import type { NativeNavigationPlugin } from '@cactuslab/native-navigation/src/definitions';
import type { NavigateOptions, Navigator, To } from 'react-router-dom'

interface Options {
	plugin: NativeNavigationPlugin
}

/**
 * A Navigator implementation to provide to react-router that handles navigation requests
 * using Capacitor Native Navigation.
 */
export function createNavigator(options: Options): Navigator {
	const { plugin } = options
	
	const navigator: Navigator = {

		createHref: function (to: To): string {
			if (typeof to === 'string') {
				return to
			} else {
				let result = ''
				if (to.pathname) {
					result += to.pathname
				}
				if (to.search) {
					result += `?${to.search}`
				}
				if (to.hash) {
					result += `#${to.hash}`
				}
				return result
			}
		},

		go: async function (delta: number): Promise<void> {
			if (delta < 0) {
				await plugin.pop({
					count: -delta,
				})
			} else if (delta > 0) {
				throw new Error(`go(delta) is not implemented for going forward`)
			}
		},

		push: async function (to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
			if (opts?.replace) {
				return navigator.replace(to, state, opts)
			}

			const path = navigator.createHref(to)
			try {
				await plugin.push({
					component: {
						type: 'view',
						path,
						state: state || opts?.state,
					},
				})
			} catch (error) {
				console.log(`Failed to push ${error}`)
			}
		},

		replace: async function (to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
			const path = navigator.createHref(to)
			try {
				await plugin.push({
					component: {
						type: 'view',
						path,
						state: state || opts?.state,
					},
					animated: false,
					mode: 'replace',
				})
			} catch (error) {
				console.log(`Failed to replace ${error}`)
			}
		}
	}
	return navigator
}
