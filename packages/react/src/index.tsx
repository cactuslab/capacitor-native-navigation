import { initViewHandler } from '@cactuslab/native-navigation'
import type { ComponentId, CreateViewEventData, NativeNavigationPluginInternal, NativeNavigationPlugin } from '@cactuslab/native-navigation';
import type { Plugin } from '@capacitor/core';
import React from 'react';
import ReactDOM from 'react-dom/client'

import { createReactContext, Context } from './context';

export { useNativeNavigationContext } from './context'

export interface NativeNavigationReactRootProps {
	id: ComponentId
	path: string
	state?: unknown
}

export type NativeNavigationReactRoot = React.ComponentType<NativeNavigationReactRootProps>

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
	const reactRoots: Record<ComponentId, ReactDOM.Root> = {}

	initViewHandler({
		plugin,
		handler: {
			createView,
			destroyView,
			ready,
		}
	})

	function createView(view: Window, data: CreateViewEventData) {
		const { path, id, state } = data

		/* Copy all of the currently established styles to the new window */
		document.head.querySelectorAll('link, style').forEach(htmlElement => {
			view.document.head.appendChild(htmlElement.cloneNode(true));
		});
	
		const rootElement = view.document.getElementById(viewRootId)
		if (rootElement) {
			const reactRoot = ReactDOM.createRoot(rootElement)
			const context = createReactContext(id, plugin)

			reactRoot.render(
				<Context.Provider value={context}>
				{
					React.createElement(root, {
						path,
						id,
						state,
					})
				}
				</Context.Provider>
			)
	
			reactRoots[id] = reactRoot

			/* Wait a moment to allow the webview to render the DOM... it would be nice to find a signal we could use instead of just waiting */
			setTimeout(function() {
				internalPlugin.viewReady({
					id,
				})
			}, 20)
		} else {
			console.warn(`Attempted to load view "${path}" but could not find root node: #${viewRootId}`)
		}
	}

	function destroyView(id: ComponentId) {
		const reactRoot = reactRoots[id]
		if (reactRoot) {
			reactRoot.unmount()
			delete reactRoots[id]
		}
	}

	function ready(view: Window) {
		return !!view.document.getElementById(viewRootId)
	}
}
