import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NativeNavigationViewProps, useNativeNavigation } from '@cactuslab/native-navigation-react'
import { NativeNavigationViewContextProvider } from '@cactuslab/native-navigation-react/context'
import { NativeNavigationNavigatorOptions, useNativeNavigationNavigator } from './index'
import { Router } from 'react-router-dom'
import { parsePath } from './utils'

interface NativeNavigationRouterProps {
	navigation?: NativeNavigationNavigatorOptions
}

interface NativeNavigationRouterInternalState {
	/** Track whether we have initialised and reported viewReady for existing views */
	initialised: boolean
}

/**
 * Render the native views with paths using the routes provided as children to this component.
 * @param props 
 * @returns 
 */
export default function NativeNavigationRouter(props: React.PropsWithChildren<NativeNavigationRouterProps>) {
	const { children, navigation } = props
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
			for (const id in views) {
				if (typeof views[id].props.path !== 'undefined') {
					nativeNavigationReact.fireViewReady(id)
				}
			}
		}

		return nativeNavigationReact.addViewsListener(function(view, event) {
			setCounter(counter => counter + 1)

			if (typeof view.props.path !== 'undefined' && (event === 'create' || event === 'update')) {
				setTimeout(function() {
					nativeNavigationReact.fireViewReady(view.id)
				}, 0)
			}
		})
	}, [nativeNavigationReact])

	const views = nativeNavigationReact.views()

	return (
		<>
			{Object.keys(views).map(function(id) {
				const view = views[id]

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
						}}
						children={children}
					/>
				)

				return createPortal(reactElement, view.element, id)
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
	return (
		<Router location={{ state: componentProps.state, ...parsePath(componentProps.path) }} navigator={navigator}>
			{children}
		</Router>
	)
}
