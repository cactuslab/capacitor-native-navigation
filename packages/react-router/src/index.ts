import type { ComponentId, ViewState } from '@cactuslab/native-navigation';
import type { NativeNavigationPlugin } from '@cactuslab/native-navigation/src/definitions';
import type { NavigateOptions, Navigator, To } from 'react-router-dom'

interface Options {
	plugin: NativeNavigationPlugin
	componentId: ComponentId
	stack?: ComponentId
}

interface ViewStateSpecials extends ViewState {
	root?: boolean
	navigation?: boolean
	target?: string
	dismiss?: string | boolean
}

/**
 * A Navigator implementation to provide to react-router that handles navigation requests
 * using Capacitor Native Navigation.
 */
export function createNavigator(options: Options): Navigator {
	const { plugin, componentId, stack } = options
	
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
				if (stack) {
					await plugin.pop({
						count: -delta,
						stack,
					})
				} else {
					console.warn(`Failed to pop as component ${componentId} is not in a stack`)
				}
			} else if (delta > 0) {
				throw new Error(`go(delta) is not implemented for going forward`)
			}
		},

		push: async function (to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
			if (opts?.replace) {
				return navigator.replace(to, state, opts)
			}

			const viewState = toViewState(state, opts?.state)
			if (typeof viewState?.dismiss === 'string') {
				await plugin.dismiss({
					id: viewState.dismiss,
				})
			} else if (typeof viewState?.dismiss === 'boolean') {
				await plugin.dismiss()
			}

			const path = navigator.createHref(to)
			try {
				await plugin.push({
					component: {
						type: 'view',
						path,
						state: viewState,
					},
					mode: viewState?.root ? 'root' : undefined,
					target: viewState?.target || stack || componentId,
				})
			} catch (error) {
				console.log(`Failed to push ${error}`)
			}
		},

		replace: async function (to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
			const viewState = toViewState(state, opts?.state)
			if (typeof viewState?.dismiss === 'string') {
				await plugin.dismiss({
					id: viewState.dismiss,
				})
			} else if (typeof viewState?.dismiss === 'boolean') {
				await plugin.dismiss()
			}

			const path = navigator.createHref(to)
			try {
				await plugin.push({
					component: {
						type: 'view',
						path,
						state: viewState,
					},
					animated: false,
					mode: viewState?.root ? 'root' : 'replace',
					target: viewState?.target || stack || componentId,
				})
			} catch (error) {
				console.log(`Failed to replace ${error}`)
			}
		}
	}
	return navigator
}

function toViewState(...args: unknown[]): ViewStateSpecials | undefined {
	for (const arg of args) {
		if (arg) {
			if (typeof arg === 'object') {
				return arg as ViewState
			} else {
				return undefined
			}
		}
	}
	return undefined
}
