/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core'

import type { CreateResult, DismissOptions, NativeNavigationPlugin, PopOptions, PopResult, PresentOptions, PresentResult, PushOptions, PushResult, CreateOptions, ComponentOptions, DismissResult, SetRootOptions, PrepareOptions } from './definitions'

export class NativeNavigationWeb
	extends WebPlugin
	implements NativeNavigationPlugin {

	async create(_options: CreateOptions): Promise<CreateResult> {
		throw new Error('Not available on web')
	}
	
	async setRoot(_options: SetRootOptions): Promise<void> {
		throw new Error('Not available on web')
	}

	async prepare(_options: PrepareOptions): Promise<void> {
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

	async setOptions(_options: ComponentOptions): Promise<void> {
		throw new Error('Not available on web')
	}

	async reset(): Promise<void> {
		throw new Error('Not available on web')
	}

}
