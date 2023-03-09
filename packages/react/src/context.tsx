import type { AllComponentOptions, ClickEventData, ComponentId, DismissOptions, DismissResult, MessageEventData, NativeNavigationPlugin } from '@cactuslab/native-navigation'
import type { Plugin, PluginListenerHandle } from '@capacitor/core'
import React, { useContext } from 'react'

import type { MessageListener } from './types'

interface ContextInit {
	componentId: ComponentId
	stack?: ComponentId
	plugin: NativeNavigationPlugin & Plugin
	viewWindow: Window
}

export function createReactContext(options: ContextInit): NativeNavigationContext {
	const { componentId: id, stack, viewWindow, plugin } = options

	const context: NativeNavigationContext = {
		componentId: id,
		stack,
		viewWindow,

		setOptions: async function(options) {
			return plugin.setOptions({
				id: options.id || id,
				animated: options.animated,
				options,
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
				console.warn(`NativeNavigation: Failed to add click listener for ${id}, this may cause some navigation buttons to fail: ${reason}`)
			})

			return function() {
				if (handle) {
					handle.remove()
				} else {
					console.warn(`NativeNavigation: Failed to remove listener for ${id}. This may cause a memory leak.`)
				}
			}
		},

		addMessageListener(type, listener: MessageListenerWithAdapter) {
			if (!listener.nativeNavigationAdapters) {
				listener.nativeNavigationAdapters = {}
			}
			const adapter = listener.nativeNavigationAdapters[type] = listener.nativeNavigationAdapters[type] || function(event: Event) {
				const customEvent = event as CustomEvent
				const data: MessageEventData = customEvent.detail.data
				if (!type || data.type === type) {
					listener(customEvent.detail.data)
				}
			}
			viewWindow.addEventListener('nativenavigationmessage', adapter)
		},

		removeMessageListener(type, listener: MessageListenerWithAdapter) {
			if (listener.nativeNavigationAdapters) {
				const adapter = listener.nativeNavigationAdapters[type]
				if (adapter) {
					viewWindow.removeEventListener('nativenavigationmessage', adapter)
					delete listener.nativeNavigationAdapters[type]
				}
			}
		},
	}
	return context
}

interface MessageListenerWithAdapter extends MessageListener {
	nativeNavigationAdapters?: {
		[type: string]: ((event: Event) => void) | undefined
	}
}


type ClickListenerFunc = (data: ClickEventData) => void
type RemoveListenerFunction = () => void

export interface NativeNavigationContext {
	/**
	 * The component id. Will be undefined if not in a native context.
	 */
	componentId?: string

	/**
	 * The id of the stack containing this component, if any.
	 */
	stack?: string

	/**
	 * The Window that contains the current view
	 */
	viewWindow: Window

	/**
	 * Set this component's options.
	 */
	setOptions: (options: AllComponentOptions & { id?: string; animated?: boolean }) => Promise<void>

	/**
	 * Dismiss this component, if it was presented.
	 */
	dismiss: (options: Omit<DismissOptions, 'id'>) => Promise<DismissResult>

	/**
	 * Add a listener for native clicks in this component.
	 */
	addClickListener: (func: ClickListenerFunc) => RemoveListenerFunction

	addMessageListener: (type: string, listener: MessageListener) => void
	removeMessageListener: (type: string, listener: MessageListener) => void
}

const DEFAULT_CONTEXT: NativeNavigationContext = {
	viewWindow: window,
	setOptions: async function() {
		return
	},
	dismiss: async function() {
		throw new Error('Not in a native context')
	},
	addClickListener: function() {
		return function() {
			/* noop */
		}
	},
	addMessageListener() {
		/* noop */
	},
	removeMessageListener() {
		/* noop */
	},
}

export const Context = React.createContext<NativeNavigationContext>(DEFAULT_CONTEXT)

export function useNativeNavigationContext(): NativeNavigationContext {
	return useContext(Context)
}
