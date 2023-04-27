/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core'

import type { DismissOptions, NativeNavigationPlugin, PopOptions, PopResult, PresentOptions, PresentResult, PushOptions, PushResult, DismissResult, UpdateOptions, GetResult } from './definitions'

export class NativeNavigationWeb
	extends WebPlugin
	implements NativeNavigationPlugin {

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

	async update(_options: UpdateOptions): Promise<void> {
		throw new Error('Not available on web')
	}

	async reset(): Promise<void> {
		throw new Error('Not available on web')
	}

	async get(): Promise<GetResult> {
		throw new Error('Not available on web')
	}
	
	async message(): Promise<void> {
		throw new Error('Not available on web')
	}

}
