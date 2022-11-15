import type { Plugin } from '@capacitor/core';
import React from 'react';
import ReactDOM from 'react-dom'

import { ComponentId, NativeNavigationPluginInternal, NativeNavigationPlugin, initViewHandler, CreateViewEventData } from '@cactuslab/native-navigation';

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
	const rootElements: Record<ComponentId, Element> = {}

	initViewHandler({
		plugin,
		handler: {
			createView,
			destroyView,
			ready,
		}
	})

	function createView(viewWindow: Window, data: CreateViewEventData) {
		const { path, id, state } = data

		/* Copy all of the currently established styles to the new window */
		document.head.querySelectorAll('link, style').forEach(htmlElement => {
			viewWindow.document.head.appendChild(htmlElement.cloneNode(true));
		});
	
		const rootElement = viewWindow.document.getElementById(viewRootId)
		if (rootElement) {
			const context = createReactContext({
				componentId: id,
				viewWindow,
				plugin,
			})

			ReactDOM.render(
				<Context.Provider value={context}>
				{
					React.createElement(root, {
						path,
						id,
						state,
					})
				}
				</Context.Provider>,
				rootElement
			)
	
			rootElements[id] = rootElement

			/* Wait a moment to allow the webview to render the DOM... it would be nice to find a signal we could use instead of just waiting */
			setTimeout(function() {
				internalPlugin.viewReady({
					id,
				})
			}, 20)
		} else {
			console.warn(`Attempted to load view "${path}" but could not find root node #${viewRootId}`)
		}
	}

	function destroyView(id: ComponentId) {
		const reactRoot = rootElements[id]
		if (reactRoot) {
			ReactDOM.unmountComponentAtNode(reactRoot)
			delete rootElements[id]
		}
	}

	function ready(view: Window) {
		return !!view.document.getElementById(viewRootId)
	}
}
