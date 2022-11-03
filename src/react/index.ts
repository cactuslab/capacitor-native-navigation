import type { Plugin } from '@capacitor/core';
import React from 'react';
import ReactDOM from 'react-dom/client'

import { NativeNavigationEvents } from '../definitions'
import type { NativeNavigationPlugin, ComponentId, CreateViewEventData, DestroyViewEventData } from '../definitions';

export interface NativeNavigationReactRootProps {
	id: ComponentId
	path: string
	state?: unknown
}

export type NativeNavigationReactRoot = React.ComponentType<NativeNavigationReactRootProps>

interface Options {
	plugin: NativeNavigationPlugin & Plugin
	root: NativeNavigationReactRoot
}

export async function initReact(options: Options): Promise<void> {
	const { plugin } = options
	const reactRoots: Record<ComponentId, ReactDOM.Root> = {}

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

		const root = reactRoots[id]
		if (root) {
			root.unmount()
			delete reactRoots[id]
		}
	})

	function loadView(view: Window, data: CreateViewEventData) {
		const { path, id, state } = data
	
		const rootElement = view.document.getElementById("root")
		if (rootElement) {
			const root = ReactDOM.createRoot(rootElement)
			root.render(React.createElement(options.root, {
				path,
				id,
				state,
			}))
	
			reactRoots[id] = root
		} else {
			console.warn(`Attempted to load view "${path}" but could not find root node`)
		}
	}
	
	function attemptLoad(view: Window, data: CreateViewEventData) {
		const root = view.document.getElementById("root")
		console.log("Attempting load with root", root)
		if (root) {
			loadView(view, data)
		} else {
			setTimeout(() => attemptLoad(view, data), 9)
		}
	}	
}
