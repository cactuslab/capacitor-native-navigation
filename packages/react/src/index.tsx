import { initViewHandler } from '@cactuslab/native-navigation'
import type { ComponentId, CreateViewEventData, NativeNavigationPluginInternal, NativeNavigationPlugin, UpdateViewEventData, MessageEventData } from '@cactuslab/native-navigation'
import type { Plugin } from '@capacitor/core'

import { initSync, prepareWindowForSync } from './sync'
import { NativeNavigationReact, NativeNavigationReactView, ReactViewListenerEvent, ReactViewListenerFunc, toNativeNavigationViewProps } from './types'

export { useNativeNavigationViewContext, NativeNavigationViewContext } from './context'
export { NativeNavigationViewProps } from './types'
export { default as NativeNavigationModal } from './NativeNavigationModal'
export { useNativeNavigation, InternalContextProvider as NativeNavigationProvider } from './internal'

interface Options {
	plugin: NativeNavigationPlugin & Plugin
	
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

export function initReact(options: Options): NativeNavigationReact {
	const { plugin } = options
	const viewRootId = options.viewRootId || 'root'
	const internalPlugin = plugin as unknown as NativeNavigationPluginInternal
	const views: Record<ComponentId, NativeNavigationReactView> = {}

	initSync(views)

	initViewHandler({
		plugin,
		handler: {
			createView,
			updateView,
			destroyView,
			messageView,
			ready,
		},
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
			const view: NativeNavigationReactView = {
				id,
				data,
				props: toNativeNavigationViewProps(data, viewWindow),
				window: viewWindow,
				element: rootElement,
			}
			views[id] = view

			fireViewDidChange(view, 'create')
		} else {
			reportError('createView', `Attempted to load view "${path}" but could not find root node: #${viewRootId}`)
		}
	}

	function updateView(viewWindow: Window, data: UpdateViewEventData) {
		const { id } = data

		const view = views[id]
		if (!view) {
			reportError('updateView', `Attempted to update a view that doesn't exist: ${id}`)
			return
		}

		view.data = data
		view.props = toNativeNavigationViewProps(data, viewWindow)
		view.reactElement = undefined /* So we recreate it */

		fireViewDidChange(view, 'update')
	}
	
	function messageView(viewWindow: Window, data: MessageEventData) {
		viewWindow.dispatchEvent(new CustomEvent('nativenavigationmessage', { detail: data }))
	}

	function destroyView(id: ComponentId) {
		const view = views[id]
		if (view) {
			delete views[id]
			fireViewDidChange(view, 'remove')
		}
	}

	function ready(view: Window) {
		return !!view.document.getElementById(viewRootId)
	}

	const listeners: ReactViewListenerFunc[] = []

	function fireViewDidChange(view: NativeNavigationReactView, event: ReactViewListenerEvent) {
		for (const listener of [...listeners]) {
			listener(view, event)
		}
	}

	return {
		plugin,
		addViewsListener(listener) {
			listeners.push(listener)
			return function() {
				const i = listeners.indexOf(listener)
				if (i !== -1) {
					listeners.splice(i, 1)
				}
			}
		},
		views() {
			return views
		},
		fireViewReady(id) {
			try {
				internalPlugin.viewReady({
					id,
				})
			} catch (error) {
				reportError('viewReady', error)
			}
		},
	}
}
