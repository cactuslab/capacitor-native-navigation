import { initViewHandler } from '@cactuslab/native-navigation'
import type { ComponentId, CreateViewEventData, NativeNavigationPluginInternal, NativeNavigationPlugin, UpdateViewEventData } from '@cactuslab/native-navigation';
import type { Plugin } from '@capacitor/core';
import React from 'react';
import ReactDOM from 'react-dom/client'

import { createReactContext, Context } from './context';
import { initSync, prepareWindowForSync } from './sync'
import type { NativeNavigationReactRoot, NativeNavigationReactRootProps } from './types'
import { toNativeNavigationReactRootProps } from './types'

export { useNativeNavigationContext } from './context'
export { NativeNavigationReactRoot, NativeNavigationReactRootProps } from './types'

interface Options {
	plugin: NativeNavigationPlugin & Plugin
	root: NativeNavigationReactRoot
	
	/**
	 * The element id to use for the root in new windows.
	 */
	viewRootId?: string
}

export async function initReact(options: Options): Promise<void> {
	const { plugin, root } = options
	const viewRootId = options.viewRootId || 'root'
	const internalPlugin = plugin as unknown as NativeNavigationPluginInternal
	const views: Record<ComponentId, Window> = {}
	const reactRoots: Record<ComponentId, ReactDOM.Root> = {}

	initSync(views)

	initViewHandler({
		plugin,
		handler: {
			createView,
			updateView,
			destroyView,
			ready,
		}
	})

	function createView(viewWindow: Window, data: CreateViewEventData) {
		const { path, id } = data
	
		const rootElement = viewWindow.document.getElementById(viewRootId)
		if (rootElement) {
			prepareWindowForSync(viewWindow)
			views[id] = viewWindow

			const reactRoot = ReactDOM.createRoot(rootElement)
			reactRoots[id] = reactRoot

			render(viewWindow, reactRoot, toNativeNavigationReactRootProps(data))
		} else {
			console.warn(`Attempted to load view "${path}" but could not find root node: #${viewRootId}`)
		}
	}

	function updateView(viewWindow: Window, data: UpdateViewEventData) {
		const { id } = data

		const reactRoot = reactRoots[id]
		if (!reactRoot) {
			console.warn(`Attempted to update a React root that doesn't exist: ${id}`)
			return
		}

		render(viewWindow, reactRoot, toNativeNavigationReactRootProps(data))
	}

	function render(viewWindow: Window, reactRoot: ReactDOM.Root, props: NativeNavigationReactRootProps) {
		const { id } = props
		const context = createReactContext({
			componentId: id,
			stack: props.stack,
			viewWindow,
			plugin,
		})

		reactRoot.render(
			<Context.Provider value={context}>
			{
				React.createElement(root, props)
			}
			</Context.Provider>
		)

		/* Wait a moment to allow the webview to render the DOM... it would be nice to find a signal we could use instead of just waiting */
		setTimeout(function() {
			internalPlugin.viewReady({
				id,
			})
		}, 20)
	}

	function destroyView(id: ComponentId) {
		const reactRoot = reactRoots[id]
		if (reactRoot) {
			reactRoot.unmount()
			delete reactRoots[id]
			delete views[id]
		}
	}

	function ready(view: Window) {
		return !!view.document.getElementById(viewRootId)
	}
}
