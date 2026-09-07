import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NativeNavigationViewProps, useNativeNavigation } from 'capacitor-native-navigation-react'
import { NativeNavigationViewContextProvider } from 'capacitor-native-navigation-react/context'
import { NativeNavigationNavigatorOptions } from './index'
import { useNativeNavigationNavigator } from './hooks'
import { BrowserRouter, matchRoutes, RouteObject, Router, RouterProvider, RouterProviderProps } from 'react-router-dom'
import { parsePath } from './utils'
import { isNativeNavigationAvailable } from 'capacitor-native-navigation'
import NativeNavigationDataRouter from './NativeNavigationDataRouter'

type RemixRouter = RouterProviderProps['router']

/** Internal state key used to tag views with their owning router */
export const NN_ROUTER_ID_KEY = '__nnRouter'

/**
 * A stable empty options object.
 *
 * An inline `{}` allocates a new object on every render, which changes the navigator's identity,
 * and rebuilds the duplicate-navigation guard around `push`.
 */
const EMPTY_NAVIGATOR_OPTIONS: NativeNavigationNavigatorOptions = {}

interface NativeNavigationRouterProps {
	navigation?: NativeNavigationNavigatorOptions

	/**
	 * Provide a react-router data router, if you are using data routers. Otherwise add `<Route>` components
	 * as children.
	 */
	router?: RemixRouter

	/**
	 * When using a data router, skip waiting for route loaders before pushing
	 * the native view. The new view is pushed immediately and must handle its
	 * own loading state via Suspense/Await.
	 *
	 * By default (false), loaders run before the native push and the current
	 * view remains visible with `navigation.state === 'loading'`, matching
	 * the default React Router web behaviour.
	 */
	dontAwaitLoaders?: boolean
}

interface NativeNavigationRouterInternalState {
	/** Track whether we have initialised and reported viewReady for existing views */
	initialised: boolean
}

/** Check if a path matches any route in a route tree */
function pathMatchesRoutes(path: string, routes: RouteObject[]): boolean {
	return matchRoutes(routes, path) !== null
}

/** Extract the router ID tag from a view's state */
function getRouterIdFromState(state: unknown): string | undefined {
	if (state && typeof state === 'object' && NN_ROUTER_ID_KEY in state) {
		return (state as Record<string, unknown>)[NN_ROUTER_ID_KEY] as string
	}
	return undefined
}

/**
 * Defer a callback so React can finish rendering first. Used to let `fireViewReady` run after the
 * render, so the native layer does not drop its loading chrome too early, and to notify registry
 * listeners outside the render phase.
 * Prefer `queueMicrotask` over `setTimeout(..., 1)` to avoid a visible flash after native tab transitions;
 * fall back to `setTimeout` when `queueMicrotask` is unavailable (older runtimes).
 */
function scheduleCallback(callback: () => void): void {
	if (typeof queueMicrotask === 'function') {
		queueMicrotask(callback)
	} else {
		setTimeout(callback, 1)
	}
}

/** Registry of data router route trees, so children-based routers can
 *  defer to them for untagged views. */
const dataRouterRoutes = new Map<string, RouteObject[]>()

/** Listeners that must re-evaluate view ownership when the registry changes */
const dataRouterRoutesListeners = new Set<() => void>()

let notifyDataRouterRoutesScheduled = false

/**
 * Tell the mounted routers that the registry changed, so they re-evaluate which views they own.
 *
 * Deferred, because the registry is written during render, and React must not receive a state
 * update for one component while another component renders.
 */
function notifyDataRouterRoutesChanged(): void {
	if (notifyDataRouterRoutesScheduled) {
		return
	}
	notifyDataRouterRoutesScheduled = true

	scheduleCallback(function() {
		notifyDataRouterRoutesScheduled = false

		for (const listener of [...dataRouterRoutesListeners]) {
			listener()
		}
	})
}

/**
 * Register a data router's routes. Idempotent, and safe to call during render, so a
 * children-based router that renders later in the same commit already sees the registration
 * and does not claim views that belong to this data router.
 */
function registerDataRouterRoutes(routerId: string, routes: RouteObject[]): void {
	if (dataRouterRoutes.get(routerId) === routes) {
		return
	}

	dataRouterRoutes.set(routerId, routes)
	notifyDataRouterRoutesChanged()
}

function unregisterDataRouterRoutes(routerId: string): void {
	if (dataRouterRoutes.delete(routerId)) {
		notifyDataRouterRoutesChanged()
	}
}

function addDataRouterRoutesListener(listener: () => void): () => void {
	dataRouterRoutesListeners.add(listener)

	return function() {
		dataRouterRoutesListeners.delete(listener)
	}
}

/** Determine whether a cached React element was created by the given router */
function isElementForRouter(element: React.ReactNode, routerId: string): boolean {
	return React.isValidElement<{ routerId?: string }>(element) && element.props.routerId === routerId
}

/**
 * Render the native views with paths using either the router provided as a prop, or `<Route>`s provided as children to this component.
 */
export default function NativeNavigationRouter(props: React.PropsWithChildren<NativeNavigationRouterProps>) {
	const { children, navigation, router, dontAwaitLoaders } = props
	const nativeNavigationReact = useNativeNavigation()
	const [, setCounter] = useState(0)
	const routerId = useId()

	/* Build the route tree for matching — only for data routers. */
	const routes = useMemo<RouteObject[] | null>(() => {
		if (router) {
			return router.routes as RouteObject[]
		}
		return null
	}, [router])

	/* Register the data router routes during render, and not in an effect. Effects run after the
	   commit, so a children-based router rendering in this same commit would otherwise see an
	   empty registry, and claim views that belong to this data router. */
	if (routes) {
		registerDataRouterRoutes(routerId, routes)
	}

	/* Keep the registration alive across effect re-runs, and unregister on unmount */
	useEffect(() => {
		if (routes) {
			registerDataRouterRoutes(routerId, routes)
			return () => {
				unregisterDataRouterRoutes(routerId)
			}
		}
	}, [routerId, routes])

	/* A children-based router defers to the data routers, so it must re-evaluate ownership
	   whenever the registry changes, for example when a data router mounts later than we did. */
	useEffect(() => {
		if (routes) {
			return
		}

		return addDataRouterRoutesListener(function() {
			setCounter(counter => counter + 1)
		})
	}, [routes])

	/**
	 * Check if a view belongs to this router.
	 *
	 * 1. If the view's state has a router ID tag, match by ID.
	 * 2. Otherwise (untagged, e.g. initial present from user code):
	 *    - Data routers match by route tree.
	 *    - Children-based routers accept if no data router matches the path.
	 */
	const ownsView = useCallback(function(viewId: string, path: string, viewState: unknown): boolean {
		const taggedRouterId = getRouterIdFromState(viewState)
		if (taggedRouterId) {
			return taggedRouterId === routerId
		}
		/* Untagged view */
		if (routes) {
			/* Data router: match by route tree */
			return pathMatchesRoutes(path, routes)
		}
		/* Children-based router: only claim if no data router matches this path */
		for (const dataRoutes of dataRouterRoutes.values()) {
			if (pathMatchesRoutes(path, dataRoutes)) {
				return false
			}
		}
		return true
	}, [routerId, routes])

	/* Work around React double-firing useEffect in development mode */
	const state = useRef<NativeNavigationRouterInternalState>({
		initialised: false,
	})

	useEffect(function() {
		if (!state.current.initialised) {
			state.current.initialised = true

			const views = nativeNavigationReact.views()
			for (const view of Object.values(views)) {
				if (typeof view.props.path !== 'undefined' && ownsView(view.id, view.props.path, view.props.state)) {
					nativeNavigationReact.fireViewReady(view.id)
				}
			}
		}

		return nativeNavigationReact.addViewsListener(function(view, event) {
			if (event === 'remove') {
				return
			}

			if (typeof view.props.path === 'undefined' || !ownsView(view.id, view.props.path, view.props.state)) {
				return
			}

			setCounter(counter => counter + 1)

			if (event === 'create' || event === 'update') {
				scheduleCallback(function() {
					nativeNavigationReact.fireViewReady(view.id)
				})
			}
		})
	}, [nativeNavigationReact, ownsView])

	/* If CNN isn't available, render the default router */
	if (!isNativeNavigationAvailable()) {
		if (router) {
			return (
				<RouterProvider router={router} />
			)
		} else {
			return (
				<BrowserRouter>
					{children}
				</BrowserRouter>
			)
		}
	}

	const views = nativeNavigationReact.views()

	return (
		<>
			{Object.values(views).map(function(view) {
				const viewProps = view.props
				const path = viewProps.path
				if (typeof path === 'undefined') {
					return null
				}

				if (!ownsView(view.id, path, viewProps.state)) {
					return null
				}

				/* Only reuse the cached element if this router created it. Ownership of an untagged
				   view can move to a data router that registered its routes after we first rendered. */
				let reactElement = view.reactElement
				if (!isElementForRouter(reactElement, routerId)) {
					reactElement = view.reactElement = (
						<NativeNavigationRootWrapper
							viewProps={{
								...viewProps,
								path,
							}}
							routerProps={{
								navigation,
								router,
								dontAwaitLoaders,
							}}
							routerId={routerId}
							children={children}
						/>
					)
				}

				return createPortal(reactElement, view.element, view.id)
			})}
		</>
	)
}

type NativeNavigationRoutingViewProps = NativeNavigationViewProps & { path: string }

interface NativeNavigationReactRouterRootProps {
	viewProps: NativeNavigationRoutingViewProps
	routerProps: NativeNavigationRouterProps
	routerId: string
}

function NativeNavigationRootWrapper(props: React.PropsWithChildren<NativeNavigationReactRouterRootProps>) {
	const { viewProps, children } = props

	return (
		<NativeNavigationViewContextProvider {...viewProps}>
			<NativeNavigationRoot {...props}>
				{children}
			</NativeNavigationRoot>
		</NativeNavigationViewContextProvider>
	)
}

function NativeNavigationRoot(props: React.PropsWithChildren<NativeNavigationReactRouterRootProps>) {
	const { viewProps: componentProps, routerProps, routerId, children } = props

	const navigator = useNativeNavigationNavigator(routerProps.navigation || EMPTY_NAVIGATOR_OPTIONS, routerId)

	const sourceRouter = routerProps.router
	if (sourceRouter) {
		return (
			<NativeNavigationDataRouter
				sourceRouter={sourceRouter}
				navigator={navigator}
				componentProps={componentProps}
				dontAwaitLoaders={routerProps.dontAwaitLoaders}
				routerId={routerId}
			/>
		)
	} else {
		/* The non-data router approach */
		return (
			<Router location={{ state: componentProps.state, ...parsePath(componentProps.path) }} navigator={navigator}>
				{children}
			</Router>
		)
	}
}
