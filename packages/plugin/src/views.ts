import type { Plugin } from '@capacitor/core';

import { NativeNavigationEvents } from './definitions'
import type { ComponentId, CreateViewEventData, DestroyViewEventData, NativeNavigationPlugin } from './definitions';

interface Options {
	plugin: NativeNavigationPlugin & Plugin
	handler: ViewHandlerImpl
}

export interface ViewHandlerImpl {

	createView: (view: Window, data: CreateViewEventData) => void
	destroyView: (id: string) => void

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
		console.log('view event', id)

		const view = window.open(id)
		if (view) {
			attemptLoad(view, data)
		}
	})

	await plugin.addListener(NativeNavigationEvents.DestroyView, function(data: DestroyViewEventData) {
		const { id } = data
		console.log('destroy view event', data)

		handler.destroyView(id)
		delete windows[id]
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
