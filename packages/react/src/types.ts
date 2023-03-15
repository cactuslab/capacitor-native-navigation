import type { ComponentId, CreateViewEventData, MessageEventData } from '@cactuslab/native-navigation';
import type React from 'react';

import { parsePath } from './utils'

export interface NativeNavigationReactRootProps {
	id: ComponentId
	pathname: string
	search?: string
	hash?: string
	state?: unknown
	stack?: ComponentId
	/**
	 * The Window that the component is rendered in.
	 */
	viewWindow: Window
}

export type NativeNavigationReactRoot = React.ComponentType<NativeNavigationReactRootProps>

export function toNativeNavigationReactRootProps(data: CreateViewEventData, viewWindow: Window): NativeNavigationReactRootProps {
	const props: NativeNavigationReactRootProps = {
		id: data.id,
		...parsePath(data.path),
		state: data.state,
		stack: data.stack,
		viewWindow,
	}
	return props
}

export type MessageListener = (data: MessageEventData) => void
