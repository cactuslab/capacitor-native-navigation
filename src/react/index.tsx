import type { Plugin, PluginListenerHandle } from '@capacitor/core';
import React, { useContext } from 'react';
import ReactDOM from 'react-dom/client'

import type { NativeNavigationPlugin, ComponentId, CreateViewEventData, DestroyViewEventData, DismissOptions, DismissResult, ClickEventData, SetComponentOptions } from '../definitions';
import { NativeNavigationEvents } from '../definitions'

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

		/* Copy all of the currently established styles to the new window */
		document.head.querySelectorAll('link, style').forEach(htmlElement => {
			view.document.head.appendChild(htmlElement.cloneNode(true));
		});
	
		const rootElement = view.document.getElementById("root")
		if (rootElement) {
			const root = ReactDOM.createRoot(rootElement)
			const context: CapacitorNativeNavigationContext = {
				componentId: id,

				setOptions: async function(options) {
					return plugin.setOptions({
						id,
						animated: options.animated,
						...options,
					})
				},

				dismiss: async function(options) {
					return plugin.dismiss({
						id,
						...options,
					})
				},

				addClickListener: function(func) {
					let handle: PluginListenerHandle | undefined
					plugin.addListener(`click:${id}`, func).then(result => {
						handle = result
					}).catch(reason => {
						console.warn(`Failed to add listener for ${id}: ${reason}`)
					})

					return function() {
						if (handle) {
							handle.remove()
						} else {
							console.warn(`Failed to remove listener for ${id}. This may cause a memory leak.`)
						}
					}
				}
			}

			root.render(
				<OptionsContext.Provider value={context}>
				{
					React.createElement(options.root, {
						path,
						id,
						state,
					})
				}
				</OptionsContext.Provider>
			)
	
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

type ClickListenerFunc = (data: ClickEventData) => void
type RemoveListenerFunction = () => void

interface CapacitorNativeNavigationContext {
	componentId?: string

	/**
	 * Set this component's options.
	 */
	setOptions: (options: Omit<SetComponentOptions, 'id'>) => Promise<void>

	/**
	 * Dismiss this component, if it was presented.
	 */
	dismiss: (options: Omit<DismissOptions, 'id'>) => Promise<DismissResult>

	/**
	 * Add a listener for native clicks in this component.
	 */
	addClickListener: (func: ClickListenerFunc) => RemoveListenerFunction
}

const OptionsContext = React.createContext<CapacitorNativeNavigationContext>({
	setOptions: async () => {
		throw new Error('Not in a native component context')
	},
	dismiss: async () => {
		throw new Error('Not in a native component context')
	},
	addClickListener: () => {
		throw new Error('Not in a native component context')
	},
})

export function useNativeNavigationContext(): CapacitorNativeNavigationContext {
	return useContext(OptionsContext)
}
