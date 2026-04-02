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
	pathname: string
	loaderData: RouterState['loaderData']
}

/** Shared across all views — only one navigation can be in flight at a time */
let pendingHandoff: PendingHandoff | null = null

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
 */
export default function NativeNavigationDataRouter(props: Props) {
	const { sourceRouter, navigator, componentProps, dontAwaitLoaders, routerId } = props

	const viewRouter = useMemo(() => {
		const initialPath = parsePath(componentProps.path)

		/* Check for handoff data from a previous view's navigation */
		let hydrationData: { loaderData: RouterState['loaderData'] } | undefined
		if (pendingHandoff && pendingHandoff.pathname === initialPath.pathname) {
			hydrationData = {
				loaderData: pendingHandoff.loaderData,
			}
			pendingHandoff = null
		}

		const router = createMemoryRouter(sourceRouter.routes, {
			initialEntries: [initialPath],
			hydrationData,
		})

		return createNativeNavigationRouterProxy(router, initialPath, navigator, sourceRouter, dontAwaitLoaders)
	}, []) /* Intentionally empty deps — router is created once per view portal */

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
				/* Navigate the inner router to trigger loaders.
				   Our subscribe interceptor will expose navigation.state = 'loading'
				   while keeping the current route rendered. */
				originalNavigate(to, opts)

				/* Wait for the inner router to settle */
				await new Promise<void>(resolve => {
					const unsubscribe = innerRouter.subscribe(state => {
						if (state.navigation.state === 'idle' && state.location.pathname !== initialPath.pathname) {
							unsubscribe()

							/* Capture the loader data as a handoff for the new view */
							pendingHandoff = {
								pathname: resolved.pathname,
								loaderData: state.loaderData,
							}

							/* Reset the inner router back to our location */
							originalNavigate(initialPath, { replace: true })

							resolve()
						}
					})
				})

				/* Push the native view — the new view will pick up the handoff */
				if (!opts?.replace) {
					navigator.push(resolved, opts?.state, opts)
				} else {
					navigator.replace(resolved, opts?.state, opts)
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
