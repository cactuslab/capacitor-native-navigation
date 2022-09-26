import { registerPlugin } from '@capacitor/core'
import type { Plugin } from '@capacitor/core'

import type { NativeNavigationPlugin } from './definitions'

const nativeNavigationPlugin: NativeNavigationPlugin = registerPlugin<NativeNavigationPlugin>(
	'NativeNavigation',
	{
		web: () => import('./web').then(m => new m.NativeNavigationWeb()),
	},
)

const NativeNavigation: NativeNavigationPlugin & Plugin = nativeNavigationPlugin as unknown as NativeNavigationPlugin & Plugin

export * from './definitions'
export { NativeNavigation }
