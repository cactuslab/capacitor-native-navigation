import type { AllComponentOptions, ClickEventData, ComponentId, DismissOptions, DismissResult, NativeNavigationPlugin } from '@cactuslab/native-navigation'
import type { Plugin, PluginListenerHandle } from '@capacitor/core'
import React, { useContext } from 'react'

interface ContextInit {
	componentId: ComponentId
	stack?: ComponentId
	plugin: NativeNavigationPlugin & Plugin
	viewWindow: Window
}

export function createReactContext(options: ContextInit): CapacitorNativeNavigationContext {
	const { componentId: id, stack, viewWindow, plugin } = options

	const context: CapacitorNativeNavigationContext = {
		componentId: id,
		stack,
		viewWindow,

		setOptions: async function(options) {
			return plugin.setOptions({
				id,
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
				console.warn(`Failed to add listener for ${id}: ${reason}`)
			})

			return function() {
				if (handle) {
					handle.remove()
				} else {
					console.warn(`Failed to remove listener for ${id}. This may cause a memory leak.`)
				}
			}
		},
	}
	return context
}


type ClickListenerFunc = (data: ClickEventData) => void
type RemoveListenerFunction = () => void

interface CapacitorNativeNavigationContext {
	componentId: string

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
	setOptions: (options: AllComponentOptions & { animated?: boolean }) => Promise<void>

	/**
	 * Dismiss this component, if it was presented.
	 */
	dismiss: (options: Omit<DismissOptions, 'id'>) => Promise<DismissResult>

	/**
	 * Add a listener for native clicks in this component.
	 */
	addClickListener: (func: ClickListenerFunc) => RemoveListenerFunction
}

export const Context = React.createContext<CapacitorNativeNavigationContext | undefined>(undefined)

export function useNativeNavigationContext(): CapacitorNativeNavigationContext | undefined
export function useNativeNavigationContext(defaultValue: Partial<CapacitorNativeNavigationContext>): Partial<CapacitorNativeNavigationContext>

export function useNativeNavigationContext(defaultValue?: Partial<CapacitorNativeNavigationContext>): CapacitorNativeNavigationContext | Partial<CapacitorNativeNavigationContext> | undefined {
	const context = useContext(Context)
	if (context) {
		return context
	} else if (defaultValue) {
		return defaultValue
	} else {
		return undefined
	}
}
