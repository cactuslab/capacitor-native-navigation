import type { ComponentId, PresentOptions, ViewState } from '@cactuslab/native-navigation';
import type { NativeNavigationContext } from '@cactuslab/native-navigation-react';
import type { NativeNavigationPlugin } from '@cactuslab/native-navigation/src/definitions';
import type { NavigateOptions, Navigator, To } from 'react-router-dom'

interface Options {
	plugin: NativeNavigationPlugin
	componentId: ComponentId
	stack?: ComponentId
	modals?: Modals
	context: NativeNavigationContext

	/**
	 * An optional error handler to receive unexpected errors from the NativeNavigation plugin
	 */
	errorHandler?: (source: string, error: unknown) => void
}

interface Modals {
	paths: ModalPath[]
}

interface ModalPath {
	pathPattern: string
	options: PresentOptions
}

interface ViewStateSpecials extends ViewState {
	root?: boolean
	navigation?: boolean
	target?: string
	dismiss?: string | boolean
}

/**
 * An error handler implementation that presents an alert with details of the error.
 */
export function alertErrorHandler(source: string, error: unknown): void {
	alert(`Navigation failed (${source}): ${error instanceof Error ? error.message : error}`)
}

/**
 * A Navigator implementation to provide to react-router that handles navigation requests
 * using Capacitor Native Navigation.
 */
export function createNavigator(options: Options): Navigator {
	const { plugin, componentId, stack, context } = options

	context.addMessageListener('navigateForMe', function(data) {
		console.log('i got a native navigation event', data)
	})

	function reportError(source: string, error: unknown) {
		if (error instanceof Error) {
			console.error(`NativeNavigation Navigator: ${source}`, error)
		} else {
			console.warn(`NativeNavigation Navigator (${source}): ${error}`)
		}

		options.errorHandler?.(source, error)
	}
	
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
					try {
						await plugin.pop({
							count: -delta,
							stack,
						})
					} catch (error) {
						reportError('pop', error)
						throw error
					}
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
				try {
					await plugin.dismiss({
						id: viewState.dismiss,
					})
				} catch (error) {
					reportError('dismiss', error)
					throw error
				}
			} else if (typeof viewState?.dismiss === 'boolean') {
				try {
					await plugin.dismiss()
				} catch (error) {
					reportError('dismiss', error)
					throw error
				}
			}


			// uh oh we need to dismiss
			// await plugin.dismiss({
			// 	id: stack || componentId
			// })
			await plugin.message({
				type: 'navigateForMe',
				value: {
					to,
					state,
				}
			})
			

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
				reportError('push', error)
				throw error
			}
		},

		replace: async function (to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
			const viewState = toViewState(state, opts?.state)
			if (typeof viewState?.dismiss === 'string') {
				try {
					await plugin.dismiss({
						id: viewState.dismiss,
					})
				} catch (error) {
					reportError('dismiss', error)
					throw error
				}
			} else if (typeof viewState?.dismiss === 'boolean') {
				try {
					await plugin.dismiss()
				} catch (error) {
					reportError('dismiss', error)
					throw error
				}
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
				reportError(viewState?.root ? 'root' : 'replace', error)
				throw error
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
