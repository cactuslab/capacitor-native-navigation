/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core'

import type { SetRootResult, DismissOptions, NativeNavigationPlugin, PopOptions, PopResult, PresentOptions, PresentResult, PushOptions, PushResult, DismissResult, SetRootOptions, SetComponentOptions, StackSpec, TabsSpec, ViewSpec } from './definitions'

export class NativeNavigationWeb
	extends WebPlugin
	implements NativeNavigationPlugin {
	
	async setRoot(_options: SetRootOptions): Promise<SetRootResult> {
		throw new Error('Not available on web')
	}

	async present(_options: PresentOptions): Promise<PresentResult> {
		throw new Error('Not available on web')
	}

	async dismiss(_options: DismissOptions): Promise<DismissResult> {
		throw new Error('Not available on web')
	}

	async push(_options: PushOptions): Promise<PushResult> {
		throw new Error('Not available on web')
	}

	async pop(_options: PopOptions): Promise<PopResult> {
		throw new Error('Not available on web')
	}

	async setOptions(_options: SetComponentOptions): Promise<void> {
		throw new Error('Not available on web')
	}

	async reset(): Promise<void> {
		throw new Error('Not available on web')
	}

	async get(): Promise<StackSpec | TabsSpec | ViewSpec> {
		throw new Error('Not available on web')
	}

}
