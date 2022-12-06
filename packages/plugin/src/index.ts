import { Capacitor, registerPlugin } from '@capacitor/core'
import type { Plugin } from '@capacitor/core'

import type { NativeNavigationPlugin } from './definitions'

const nativeNavigationPlugin: NativeNavigationPlugin = registerPlugin<NativeNavigationPlugin>(
	'NativeNavigation',
	{
		web: () => import('./web').then(m => new m.NativeNavigationWeb()),
	},
)

const NativeNavigation: NativeNavigationPlugin & Plugin = nativeNavigationPlugin as unknown as NativeNavigationPlugin & Plugin

function isNativeNavigationAvailable(): boolean {
	return Capacitor.isNativePlatform()
}

export * from './definitions'
export * from './views'
export { NativeNavigation, isNativeNavigationAvailable }
