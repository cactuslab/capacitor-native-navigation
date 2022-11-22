import { initViewHandler } from '@cactuslab/native-navigation'
import type { ComponentId, NativeNavigationPluginInternal, NativeNavigationPlugin, CreateViewEventData, UpdateViewEventData } from '@cactuslab/native-navigation';
import type { Plugin } from '@capacitor/core';
import React from 'react';
import ReactDOM from 'react-dom'

import { createReactContext, Context } from './context';
import { initSync, prepareWindowForSync } from './sync'

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
	const views: Record<ComponentId, Window> = {}
	const rootElements: Record<ComponentId, Element> = {}

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
			rootElements[id] = rootElement

			const props: NativeNavigationReactRootProps = {
				id: data.id,
				path: data.path,
				state: data.state,
			}
			render(viewWindow, rootElement, props)
		} else {
			console.warn(`Attempted to load view "${path}" but could not find root node #${viewRootId}`)
		}
	}

	function updateView(viewWindow: Window, data: UpdateViewEventData) {
		const { id } = data

		const rootElement = rootElements[id]
		if (!rootElement) {
			console.warn(`Attempted to update a React element that doesn't exist: ${id}`)
			return
		}

		const props: NativeNavigationReactRootProps = {
			id: data.id,
			path: data.path,
			state: data.state,
		}
		render(viewWindow, rootElement, props)
	}

	function render(viewWindow: Window, rootElement: Element, props: NativeNavigationReactRootProps) {
		const { id } = props
		const context = createReactContext({
			componentId: id,
			viewWindow,
			plugin,
		})

		ReactDOM.render(
			<Context.Provider value={context}>
			{
				React.createElement(root, props)
			}
			</Context.Provider>,
			rootElement
		)

		/* Wait a moment to allow the webview to render the DOM... it would be nice to find a signal we could use instead of just waiting */
		setTimeout(function() {
			internalPlugin.viewReady({
				id,
			})
		}, 20)
	}

	function destroyView(id: ComponentId) {
		const reactRoot = rootElements[id]
		if (reactRoot) {
			ReactDOM.unmountComponentAtNode(reactRoot)
			delete rootElements[id]
			delete views[id]
		}
	}

	function ready(view: Window) {
		return !!view.document.getElementById(viewRootId)
	}
}
