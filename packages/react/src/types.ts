import type { ComponentId, CreateViewEventData } from '@cactuslab/native-navigation';
import type React from 'react';

export interface NativeNavigationReactRootProps {
	id: ComponentId
	path: string
	state?: unknown
	stack?: ComponentId
}

export type NativeNavigationReactRoot = React.ComponentType<NativeNavigationReactRootProps>

export function toNativeNavigationReactRootProps(data: CreateViewEventData): NativeNavigationReactRootProps {
	const props: NativeNavigationReactRootProps = {
		id: data.id,
		path: data.path,
		state: data.state,
		stack: data.stack,
	}
	return props
}
