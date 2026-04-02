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

/** Registry of data router route trees, so children-based routers can
 *  defer to them for untagged views. */
const dataRouterRoutes = new Map<string, RouteObject[]>()

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

	/* Register/unregister data router routes so children-based routers can defer */
	useEffect(() => {
		if (routes) {
			dataRouterRoutes.set(routerId, routes)
			return () => {
				dataRouterRoutes.delete(routerId)
			}
		}
	}, [routerId, routes])

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
				setTimeout(function() {
					nativeNavigationReact.fireViewReady(view.id)
				}, 1)
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

				const reactElement = view.reactElement || (view.reactElement =
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

	const navigator = useNativeNavigationNavigator(routerProps.navigation || {}, routerId)

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
