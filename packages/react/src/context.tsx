import type { ClickEventData, ComponentAlias, ComponentId, DismissOptions, DismissResult, MessageEventData, TabUpdate, ViewUpdate } from '@cactuslab/native-navigation'
import type { PluginListenerHandle } from '@capacitor/core'
import React, { useContext, useLayoutEffect, useMemo, useRef } from 'react'
import equal from 'fast-deep-equal'

import type { MessageListener, NativeNavigationReact, NativeNavigationViewProps } from './types'
import { useNativeNavigation } from './internal'

interface ContextInit extends NativeNavigationViewProps {
	nativeNavigationReact: NativeNavigationReact
}

function createViewContext(options: ContextInit): NativeNavigationViewContext {
	const { nativeNavigationReact, id: componentId, viewWindow, ...otherViewProps } = options
	const { plugin } = nativeNavigationReact

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function createPluginComponentListener(type: string, func: (...args: any[]) => any) {
		const holder: { handle?: PluginListenerHandle | undefined; removed?: boolean } = {}
		
		plugin.addListener(`${type}:${componentId}`, func).then(result => {
			if (holder.removed) {
				result.remove()
			} else {
				holder.handle = result
			}
		}).catch(reason => {
			console.warn(`NativeNavigation: Failed to add ${type} listener for ${componentId}: ${reason}`)
		})

		return function() {
			const handle = holder.handle
			if (handle) {
				handle.remove()
			} else {
				holder.removed = true
			}
		}
	}

	const context: NativeNavigationViewContext = {
		componentId,
		viewWindow,
		...otherViewProps,

		updateView: async function(update) {
			return plugin.update({
				id: componentId,
				animated: update.animated,
				update,
			})
		},

		updateTab: async function(update) {
			return plugin.update({
				id: componentId,
				animated: update.animated,
				update,
			})
		},

		dismiss: async function(options) {
			return plugin.dismiss({
				id: componentId,
				...options,
			})
		},

		addClickListener: function(func) {
			return createPluginComponentListener('click', func)
		},

		addViewWillAppearListener: function(func) {
			return createPluginComponentListener('viewWillAppear', func)
		},
		addViewDidAppearListener: function(func) {
			return createPluginComponentListener('viewDidAppear', func)
		},
		addViewWillDisappearListener: function(func) {
			return createPluginComponentListener('viewWillDisappear', func)
		},
		addViewDidDisappearListener: function(func) {
			return createPluginComponentListener('viewDidDisappear', func)
		},

		addMessageListener(type, listener: MessageListenerWithAdapter) {
			if (!listener.nativeNavigationAdapters) {
				listener.nativeNavigationAdapters = {}
			}
			const adapter = listener.nativeNavigationAdapters[type] = listener.nativeNavigationAdapters[type] || function(event: Event) {
				const customEvent = event as CustomEvent
				const data: MessageEventData = customEvent.detail
				if (!type || data.type === type) {
					listener(data)
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
type ViewTransitionListenerFunc = () => void
type RemoveListenerFunction = () => void

export interface NativeNavigationViewContext {
	/**
	 * The component id. Will be undefined if not in a native context.
	 */
	componentId?: ComponentId

	alias?: ComponentAlias

	/**
	 * The path the component is rendering, if any.
	 */
	path?: string

	/**
	 * The state the component is rendering, if any.
	 */
	state?: unknown

	/**
	 * The id of the stack containing this component, if any.
	 */
	stack?: ComponentId

	/**
	 * The Window that contains the current view
	 */
	viewWindow: Window

	/**
	 * Set this component's options.
	 */
	updateView: (update: ViewUpdate & { animated?: boolean }) => Promise<void>

	/**
	 * Set this component's options.
	 */
	updateTab: (update: TabUpdate & { animated?: boolean }) => Promise<void>

	/**
	 * Dismiss this component, if it was presented.
	 */
	dismiss: (options?: Omit<DismissOptions, 'id'>) => Promise<DismissResult>

	/**
	 * Add a listener for native clicks in this component.
	 */
	addClickListener: (func: ClickListenerFunc) => RemoveListenerFunction

	addViewWillAppearListener: (func: ViewTransitionListenerFunc) => RemoveListenerFunction
	addViewDidAppearListener: (func: ViewTransitionListenerFunc) => RemoveListenerFunction
	addViewWillDisappearListener: (func: ViewTransitionListenerFunc) => RemoveListenerFunction
	addViewDidDisappearListener: (func: ViewTransitionListenerFunc) => RemoveListenerFunction

	addMessageListener: (type: string, listener: MessageListener) => void
	removeMessageListener: (type: string, listener: MessageListener) => void
}

const DEFAULT_CONTEXT: NativeNavigationViewContext = {
	viewWindow: window,
	updateView: async function() {
		return
	},
	updateTab: async function() {
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
	addViewWillAppearListener: function() {
		return function() {
			/* noop */
		}
	},
	addViewDidAppearListener: function() {
		return function() {
			/* noop */
		}
	},
	addViewWillDisappearListener: function() {
		return function() {
			/* noop */
		}
	},
	addViewDidDisappearListener: function() {
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

const Context = React.createContext<NativeNavigationViewContext>(DEFAULT_CONTEXT)

export function NativeNavigationViewContextProvider(props: React.PropsWithChildren<NativeNavigationViewProps>) {
	const { children, id, path, state, stack, viewWindow } = props
	const nativeNavigationReact = useNativeNavigation()

	const value: NativeNavigationViewContext = useMemo(
		() => createViewContext({ id, path, state, stack, viewWindow, nativeNavigationReact }),
		[nativeNavigationReact, id, path, state, stack, viewWindow],
	)
	return (
		<Context.Provider value={value}>{children}</Context.Provider>
	)
}

export function useNativeNavigationViewContext(options?: ViewUpdate): NativeNavigationViewContext {
	const context = useContext(Context)
	const previousOptions = useRef<ViewUpdate>()

	/* We want to update the options before layout occurs */
	useLayoutEffect(function() {
		if (options && !equal(options, previousOptions.current)) {
			previousOptions.current = options
			context.updateView({ ...options, animated: false })
		}
	}, [context, options])

	return context
}
