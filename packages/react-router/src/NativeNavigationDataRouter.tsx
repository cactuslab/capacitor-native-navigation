import React, { useEffect, useMemo } from 'react'
import { createMemoryRouter, resolvePath, RouterProvider, RouterProviderProps, To } from 'react-router-dom'
import { NativeNavigationViewProps } from 'capacitor-native-navigation-react'
import { useNativeNavigationNavigator } from './hooks'
import { parsePath } from './utils'

type RemixRouter = RouterProviderProps['router']
type RouterState = RemixRouter['state']
type RouterNavigateOptions = Exclude<Parameters<RemixRouter['navigate']>[1], undefined>
type RouterSubscriber = Parameters<RemixRouter['subscribe']>[0]
type NativeNavigationRoutingViewProps = NativeNavigationViewProps & { path: string }

interface Props {
	sourceRouter: RemixRouter
	navigator: ReturnType<typeof useNativeNavigationNavigator>
	componentProps: NativeNavigationRoutingViewProps
	dontAwaitLoaders?: boolean
	routerId: string
}

/** Pending handoff: loader data from a navigation that hasn't been claimed yet */
interface PendingHandoff {
	loaderData: RouterState['loaderData']
	/** The time the handoff was created, so an abandoned handoff can expire */
	time: number
}

/**
 * The handoffs that are waiting to be claimed, keyed by pathname.
 *
 * A map, and not a single value, because navigations in different stacks or tabs can be
 * in flight at the same time, and they must not overwrite each other.
 */
const pendingHandoffs = new Map<string, PendingHandoff>()

/**
 * How long a handoff stays valid, in milliseconds.
 *
 * If the native push fails, or the new view is never created, the handoff is abandoned. An
 * abandoned handoff must not hydrate an unrelated later view with stale loader data.
 */
const PENDING_HANDOFF_TIMEOUT = 5000

function evictExpiredHandoffs(): void {
	const expiredBefore = Date.now() - PENDING_HANDOFF_TIMEOUT
	for (const [pathname, handoff] of pendingHandoffs) {
		if (handoff.time < expiredBefore) {
			pendingHandoffs.delete(pathname)
		}
	}
}

function storePendingHandoff(pathname: string, loaderData: RouterState['loaderData']): PendingHandoff {
	evictExpiredHandoffs()

	const handoff: PendingHandoff = {
		loaderData,
		time: Date.now(),
	}
	pendingHandoffs.set(pathname, handoff)
	return handoff
}

/** Remove a handoff that we stored, unless a later navigation has already replaced it */
function discardPendingHandoff(pathname: string, handoff: PendingHandoff): void {
	if (pendingHandoffs.get(pathname) === handoff) {
		pendingHandoffs.delete(pathname)
	}
}

/** Take the handoff for a pathname, if there is one that has not expired */
function claimPendingHandoff(pathname: string): PendingHandoff | undefined {
	evictExpiredHandoffs()

	const handoff = pendingHandoffs.get(pathname)
	if (!handoff) {
		return undefined
	}

	pendingHandoffs.delete(pathname)
	return handoff
}

/**
 * A data router wrapper for native navigation.
 *
 * Uses a real memory router internally for loader execution and route matching,
 * but intercepts state updates so the view never sees a location change. When a
 * navigation triggers a loader, the view sees navigation.state = 'loading' while
 * staying on its current route. Once the loader completes, the loaded data is
 * stored as a pending handoff and the native push happens. The new view picks up
 * the handoff data via hydrationData and renders immediately without re-running
 * the loader.
 *
 * The inner router is keyed on the view's path. A replacing navigation reuses the native
 * view and updates its props in place, so the path can change without this component
 * unmounting. The key remounts the view, which disposes the router for the old path
 * exactly once, and creates a router for the new path.
 */
export default function NativeNavigationDataRouter(props: Props) {
	return (
		<NativeNavigationDataRouterView key={props.componentProps.path} {...props} />
	)
}

function NativeNavigationDataRouterView(props: Props) {
	const { sourceRouter, navigator, componentProps, dontAwaitLoaders } = props

	const viewRouter = useMemo(() => {
		const initialPath = parsePath(componentProps.path)

		/* Check for handoff data from a previous view's navigation */
		const handoff = claimPendingHandoff(initialPath.pathname)
		const hydrationData = handoff ? { loaderData: handoff.loaderData } : undefined

		const router = createMemoryRouter(sourceRouter.routes, {
			initialEntries: [initialPath],
			hydrationData,
		})

		return createNativeNavigationRouterProxy(router, initialPath, navigator, sourceRouter, dontAwaitLoaders)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) /* Intentionally empty deps — the router is created once per mount, and the path key remounts us */

	useEffect(() => {
		return () => {
			viewRouter.dispose()
		}
	}, [viewRouter])

	return <RouterProvider router={viewRouter} />
}

function createNativeNavigationRouterProxy(
	innerRouter: RemixRouter,
	initialPath: ReturnType<typeof parsePath>,
	navigator: ReturnType<typeof useNativeNavigationNavigator>,
	sourceRouter: RemixRouter,
	dontAwaitLoaders?: boolean,
): RemixRouter {
	const subscribers = new Set<RouterSubscriber>()

	/* The state we present to RouterProvider: always at our initial location,
	   but with navigation.state reflecting any in-flight loader */
	let currentState: RouterState = innerRouter.state

	/* Subscribe to the inner router to intercept state changes */
	innerRouter.subscribe((newState, opts) => {
		const locationChanged = newState.location.pathname !== initialPath.pathname

		if (locationChanged && newState.navigation.state === 'idle') {
			/* The inner router has completed navigation to a new location.
			   Don't let this through — we stay at our initial location.
			   The loader data was captured by the navigate override. */
			currentState = {
				...currentState,
				navigation: { state: 'idle', location: undefined, formMethod: undefined, formAction: undefined, formEncType: undefined, formData: undefined, text: undefined, json: undefined },
			}
		} else if (locationChanged) {
			/* Navigation in progress — expose the loading state but keep our location */
			currentState = {
				...currentState,
				navigation: newState.navigation,
			}
		} else {
			/* Same location — pass through (handles initial load, revalidation, etc.) */
			currentState = newState
		}

		for (const subscriber of subscribers) {
			subscriber(currentState, opts)
		}
	})

	const originalNavigate = innerRouter.navigate.bind(innerRouter)

	const proxy: RemixRouter = {
		...innerRouter,

		get state() {
			return currentState
		},

		subscribe(callback: RouterSubscriber) {
			subscribers.add(callback)
			return () => {
				subscribers.delete(callback)
			}
		},

		navigate: async function(to: To | number | null, opts?: RouterNavigateOptions) {
			if (typeof to === 'number') {
				navigator.go(to)
				return
			}
			if (!to) return

			const resolved = resolvePath(to, initialPath.pathname)

			if (!dontAwaitLoaders) {
				let handoff: PendingHandoff | undefined

				/* Wait for the inner router to settle.
				   Subscribe before we navigate. A route with no loaders settles synchronously
				   inside originalNavigate, so a subscriber added after that call never hears
				   about it, and this promise never settles. */
				await new Promise<void>(resolve => {
					let settled = false

					const unsubscribe = innerRouter.subscribe(state => {
						if (settled || state.navigation.state !== 'idle') {
							return
						}

						settled = true
						unsubscribe()

						/* Capture the loader data as a handoff for the new view */
						handoff = storePendingHandoff(resolved.pathname, state.loaderData)

						if (state.location.pathname !== initialPath.pathname) {
							/* Reset the inner router back to our location */
							originalNavigate(initialPath, { replace: true })
						}

						resolve()
					})

					/* Navigate the inner router to trigger loaders.
					   Our subscribe interceptor will expose navigation.state = 'loading'
					   while keeping the current route rendered. */
					originalNavigate(to, opts)
				})

				/* Push the native view — the new view will pick up the handoff.
				   The Navigator type declares that these return void, but our implementation
				   returns a promise, which rejects if the native navigation fails. */
				const navigation: unknown = !opts?.replace
					? navigator.push(resolved, opts?.state, opts)
					: navigator.replace(resolved, opts?.state, opts)

				if (handoff) {
					const storedHandoff = handoff
					Promise.resolve(navigation).catch(function() {
						/* The navigation failed, so no view will claim the handoff */
						discardPendingHandoff(resolved.pathname, storedHandoff)
					})
				}
			} else {
				/* Push immediately — the new view handles its own loading */
				if (!opts?.replace) {
					navigator.push(resolved, opts?.state, opts)
				} else {
					navigator.replace(resolved, opts?.state, opts)
				}
			}
		},

		dispose() {
			subscribers.clear()
			innerRouter.dispose()
		},
	}

	return proxy
}
