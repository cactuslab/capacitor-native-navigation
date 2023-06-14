import type { Plugin } from '@capacitor/core'

import { NativeNavigationEvents } from './definitions'
import type { MessageEventData, ComponentId, CreateViewEventData, DestroyViewEventData, NativeNavigationPlugin, UpdateViewEventData } from './definitions'

interface Options {
	plugin: NativeNavigationPlugin & Plugin
	handler: ViewHandlerImpl
}

export interface ViewHandlerImpl {

	createView: (view: Window, data: CreateViewEventData) => void
	updateView: (view: Window, data: UpdateViewEventData) => void
	messageView: (view: Window, data: MessageEventData) => void
	destroyView: (id: ComponentId) => void

	/**
	 * Return whether the given Window is ready to be used.
	 */
	ready: (view: Window) => boolean

}

export async function initViewHandler(options: Options): Promise<void> {
	const { plugin, handler } = options
	const windows: Record<ComponentId, Window> = {}

	await plugin.addListener(NativeNavigationEvents.CreateView, async function(data: CreateViewEventData) {
		const { id } = data

		const view = window.open(`/capacitor-native-navigation/${id}`)
		if (view) {
			attemptLoad(view, data)
		}
	})

	await plugin.addListener(NativeNavigationEvents.UpdateView, async function(data: UpdateViewEventData) {
		const { id } = data
		
		const view = windows[id]
		if (!view) {
			console.warn(`Attempted to update a view that doesn't exist: ${id}`)
			return
		}

		handler.updateView(view, data)
	})

	await plugin.addListener(NativeNavigationEvents.DestroyView, function(data: DestroyViewEventData) {
		const { id } = data

		handler.destroyView(id)
		delete windows[id]
	})

	await plugin.addListener(NativeNavigationEvents.Message, function(data: MessageEventData) {
		const { target } = data

		const view = windows[target]
		if (!view) {
			console.warn(`Attempted to message a view that doesn't exist: ${target}`)
			return
		}

		handler.messageView(view, data)
	})

	function loadView(view: Window, data: CreateViewEventData) {
		const { id } = data

		windows[id] = view

		handler.createView(view, data)
	}
	
	function attemptLoad(view: Window, data: CreateViewEventData) {
		if (handler.ready(view)) {
			loadView(view, data)
		} else {
			setTimeout(() => attemptLoad(view, data), 9)
		}
	}
}
