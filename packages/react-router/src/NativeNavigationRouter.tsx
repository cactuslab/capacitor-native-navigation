import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NativeNavigationViewProps, useNativeNavigation } from 'capacitor-native-navigation-react'
import { NativeNavigationViewContextProvider } from 'capacitor-native-navigation-react/context'
import { NativeNavigationNavigatorOptions } from './index'
import { useNativeNavigationNavigator } from './hooks'
import { BrowserRouter, resolvePath, Router, RouterProvider, RouterProviderProps, To } from 'react-router-dom'
import { parsePath } from './utils'
import { isNativeNavigationAvailable } from 'capacitor-native-navigation'

type RemixRouter = RouterProviderProps['router']
type RouterNavigateOptions = Exclude<Parameters<RemixRouter['navigate']>[1], undefined>

interface NativeNavigationRouterProps {
	navigation?: NativeNavigationNavigatorOptions

	/**
	 * Provide a react-router data router, if you are using data routers. Otherwise add `<Route>` components
	 * as children.
	 */
	router?: RemixRouter
}

interface NativeNavigationRouterInternalState {
	/** Track whether we have initialised and reported viewReady for existing views */
	initialised: boolean
}

/**
 * Render the native views with paths using either the router provided as a prop, or `<Route>`s provided as children to this component.
 * @param props 
 * @returns 
 */
export default function NativeNavigationRouter(props: React.PropsWithChildren<NativeNavigationRouterProps>) {
	const { children, navigation, router } = props
	const nativeNavigationReact = useNativeNavigation()
	const [, setCounter] = useState(0)

	/* Work around React double-firing useEffect in development mode */
	const state = useRef<NativeNavigationRouterInternalState>({
		initialised: false,
	})

	useEffect(function() {
		if (!state.current.initialised) {
			state.current.initialised = true

			/* Fire viewReady for any native views that were created before this component is rendered */
			const views = nativeNavigationReact.views()
			for (const view of Object.values(views)) {
				if (typeof view.props.path !== 'undefined') {
					nativeNavigationReact.fireViewReady(view.id)
				}
			}
		}

		return nativeNavigationReact.addViewsListener(function(view, event) {
			setCounter(counter => counter + 1)

			if (typeof view.props.path !== 'undefined' && (event === 'create' || event === 'update')) {
				setTimeout(function() {
					nativeNavigationReact.fireViewReady(view.id)
				}, 1) /* A tiny timeout so any render-time calls to update view config happen first */
			}
		})
	}, [nativeNavigationReact])

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
					/* We don't create portals for any view without a path */
					return null
				}

				/* Memoise the react element to prevent unncessary re-renders */
				const reactElement = view.reactElement || (view.reactElement = 
					<NativeNavigationRootWrapper 
						viewProps={{
							...viewProps,
							path,
						}} 
						routerProps={{
							navigation,
							router,
						}}
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
	const { viewProps: componentProps, routerProps, children } = props

	const navigator = useNativeNavigationNavigator(routerProps.navigation || {})

	const router = routerProps.router
	if (router) {
		/* The data router approach */
		const nnRouter: RemixRouter = {
			...router,
			createHref(location) {
				return navigator.createHref(location)
			},
			state: {
				...router.state,
				location: {
					state: componentProps.state,
					...parsePath(componentProps.path),
					key: componentProps.id,
					unstable_mask: undefined,
				}
			},
			navigate: async function(to: To | number | null, opts?: RouterNavigateOptions) {
				if (typeof to === 'number') {
					navigator.go(to)
				} else if (to) {
					to = resolvePath(to, componentProps.path)
					if (!opts?.replace) {
						navigator.push(to, opts?.state, opts)
					} else {
						navigator.replace(to, opts?.state, opts)
					}
				}
			},
		}
		return (
			<RouterProvider router={nnRouter} />
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
