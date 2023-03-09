import { initViewHandler } from '@cactuslab/native-navigation'
import type { ComponentId, CreateViewEventData, NativeNavigationPluginInternal, NativeNavigationPlugin, UpdateViewEventData , MessageEventData } from '@cactuslab/native-navigation';
import type { Plugin } from '@capacitor/core';
import React from 'react';
import ReactDOM from 'react-dom/client'

import { createReactContext, Context } from './context';
import { initSync, prepareWindowForSync } from './sync'
import type { NativeNavigationReactRoot, NativeNavigationReactRootProps } from './types'
import { toNativeNavigationReactRootProps } from './types'

export { useNativeNavigationContext, NativeNavigationContext } from './context'
export { NativeNavigationReactRoot, NativeNavigationReactRootProps } from './types'

interface Options {
	plugin: NativeNavigationPlugin & Plugin
	root: NativeNavigationReactRoot
	
	/**
	 * The element id to use for the root in new windows.
	 */
	viewRootId?: string

	/**
	 * An optional error handler to receive unexpected errors from the NativeNavigation plugin
	 */
	errorHandler?: (source: string, error: unknown) => void
}

/**
 * An error handler implementation that presents an alert with details of the error.
 */
export function alertErrorHandler(source: string, error: unknown): void {
	alert(`Native navigation integration failed (${source}): ${error instanceof Error ? error.message : error}`)
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
			messageView,
			ready,
		}
	})

	function reportError(source: string, error: unknown) {
		if (error instanceof Error) {
			console.error(`NativeNavigation React: ${source}`, error)
		} else {
			console.warn(`NativeNavigation React (${source}): ${error}`)
		}

		options.errorHandler?.(source, error)
	}

	function createView(viewWindow: Window, data: CreateViewEventData) {
		const { path, id } = data
	
		const rootElement = viewWindow.document.getElementById(viewRootId)
		if (rootElement) {
			prepareWindowForSync(viewWindow)
			views[id] = viewWindow

			const reactRoot = ReactDOM.createRoot(rootElement)
			reactRoots[id] = reactRoot

			render(viewWindow, reactRoot, toNativeNavigationReactRootProps(data, viewWindow))
		} else {
			reportError('createView', `Attempted to load view "${path}" but could not find root node: #${viewRootId}`)
		}
	}

	function updateView(viewWindow: Window, data: UpdateViewEventData) {
		const { id } = data

		const reactRoot = reactRoots[id]
		if (!reactRoot) {
			reportError('updateView', `Attempted to update a React root that doesn't exist: ${id}`)
			return
		}

		render(viewWindow, reactRoot, toNativeNavigationReactRootProps(data, viewWindow))
	}
	
	function messageView(viewWindow: Window, data: MessageEventData) {
		viewWindow.dispatchEvent(new CustomEvent('nativenavigationmessage', { detail: data }))
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
			try {
				internalPlugin.viewReady({
					id,
				})
			} catch (error) {
				reportError('viewReady', error)
			}
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
