import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NativeNavigationReactRoot, NativeNavigationReactRootProps } from './types'
import { Context, createReactContext } from './context'
import { useNativeNavigation } from './internal'

interface NativeNavigationViewsProps {
	root: NativeNavigationReactRoot
}

/**
 * Render the native views using a root component.
 * @param props 
 * @returns 
 */
export default function NativeNavigationViews(props: NativeNavigationViewsProps) {
	const nativeNavigationReact = useNativeNavigation()
	const [, setCounter] = useState(0)

	useEffect(function() {
		return nativeNavigationReact.addViewsListener(function(id, event) {
			setCounter(counter => counter + 1)

			if (event === 'create' || event === 'update') {
				setTimeout(function() {
					nativeNavigationReact.fireViewReady(id)
				}, 0)
			}
		})
	}, [nativeNavigationReact])

	const views = nativeNavigationReact.views()

	return (
		<>
			{Object.keys(views).map(function(id) {
				const view = views[id]

				/* Memoise the react element to prevent unncessary re-renders */
				const reactElement = view.reactElement || (view.reactElement = React.createElement(NativeNavigationRootWrapper, { ...view.props, ...props }))
				return createPortal(reactElement, view.element, id)
			})}
		</>
	)
}

function NativeNavigationRootWrapper(props: NativeNavigationReactRootProps & NativeNavigationViewsProps) {
	const nativeNavigationReact = useNativeNavigation()

	const { id, pathname, search, hash, state, stack, viewWindow, root } = props
	const context = createReactContext({
		componentId: id,
		pathname,
		search,
		hash,
		state,
		stack,
		viewWindow,
		nativeNavigationReact,
	})

	return (
		<Context.Provider value={context}>
			{
				React.createElement(root, props)
			}
		</Context.Provider>
	)
}
