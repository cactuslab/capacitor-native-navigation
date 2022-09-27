/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core'

import type { CreateResult, DismissOptions, NativeNavigationPlugin, PopOptions, PopResult, PresentOptions, PresentResult, PushOptions, PushResult, RootOptions, ViewOptions, ViewResult } from './definitions'

export class NativeNavigationWeb
	extends WebPlugin
	implements NativeNavigationPlugin {

	async create(_options: RootOptions): Promise<CreateResult> {
		throw new Error('Not available on web')
	}

	async present(_options: PresentOptions): Promise<PresentResult> {
		throw new Error('Not available on web')
	}

	async dismiss(_options: DismissOptions): Promise<void> {
		throw new Error('Not available on web')
	}

	async createView(_options: ViewOptions): Promise<ViewResult> {
		throw new Error('Not available on web')
	}

	async push(_options: PushOptions): Promise<PushResult> {
		throw new Error('Not available on web')
	}

	async pop(_options: PopOptions): Promise<PopResult> {
		throw new Error('Not available on web')
	}

}
