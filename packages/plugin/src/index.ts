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

if (Capacitor.isNativePlatform()) {
	/* Reset when we load / reload the page so if the page is reloaded, we don't have old native views still around. */
	NativeNavigation.reset().catch(function(reason) {
		console.warn(`NativeNavigation failed to reset: ${reason}`)
	})
}

/* Remove all listeners to prevent duplicate registrations in the case the browser is reloaded */
NativeNavigation.removeAllListeners().catch(function(reason) {
	console.warn(`NativeNavigation failed to remove listeners: ${reason}`)
})

export * from './definitions'
export * from './views'
export { NativeNavigation }
