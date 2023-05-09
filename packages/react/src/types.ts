import type { ComponentId, CreateViewEventData, MessageEventData, NativeNavigationPlugin } from '@cactuslab/native-navigation'
import type React from 'react'

import { Plugin } from '@capacitor/core'

export interface NativeNavigationReact {
	/**
	 * The native plugin interface.
	 */
	plugin: NativeNavigationPlugin & Plugin

	/**
	 * @returns the views by id
	 */
	views: () => Record<string, NativeNavigationReactView>

	/**
	 * Add a listener function that is called when the native views list changes
	 * @param listener a function that receives the id of the view that has changed, and the type of event
	 * @returns an unsubscribe function that unsubscribes the listener when called
	 */
	addViewsListener: (listener: ReactViewListenerFunc) => ReactViewListenerUnsubscribeFunc

	/**
	 * Internal: a callback when a native view has rendered and is ready to be displayed
	 * @param id 
	 * @returns 
	 */
	fireViewReady: (id: string) => void
}

export type ReactViewListenerEvent = 'create' | 'update' | 'remove'
export type ReactViewListenerFunc = (view: NativeNavigationReactView, event: ReactViewListenerEvent) => void
export type ReactViewListenerUnsubscribeFunc = () => void

export interface NativeNavigationViewProps {
	id: ComponentId
	path?: string
	state?: unknown
	stack?: ComponentId
	/**
	 * The Window that the component is rendered in.
	 */
	viewWindow: Window
}

export function toNativeNavigationViewProps(data: CreateViewEventData, viewWindow: Window): NativeNavigationViewProps {
	const props: NativeNavigationViewProps = {
		id: data.id,
		path: data.path,
		state: data.state,
		stack: data.stack,
		viewWindow,
	}
	return props
}

/**
 * A native view for a React route
 */
export interface NativeNavigationReactView {
	id: string
	/**
	 * The route data.
	 */
	data: CreateViewEventData
	/**
	 * The element in the native view to render the React component in.
	 */
	element: HTMLElement
	/**
	 * The Window containing the native view.
	 */
	window: Window
	/**
	 * The props used to render the React component.
	 */
	props: NativeNavigationViewProps
	/**
	 * The React component that has been created for this view.
	 */
	reactElement?: React.ReactNode
}

export type MessageListener = (data: MessageEventData) => void
