import type { MessageEventData, PresentOptions, ViewState } from '@cactuslab/native-navigation';
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react';
import type { NativeNavigationPlugin } from '@cactuslab/native-navigation/src/definitions';
import { useCallback, useEffect } from 'react';
import type { NavigateOptions, Navigator, To } from 'react-router-dom'

interface Options {
	plugin: NativeNavigationPlugin
	modals?: ModalConfig[]

	/**
	 * An optional error handler to receive unexpected errors from the NativeNavigation plugin
	 */
	errorHandler?: (source: string, error: unknown) => void
}

interface ModalConfig {
	/**
	 * The path prefix under which this modal lives.
	 */
	path: string | RegExp
	presentOptions(path: string, state?: ViewState): PresentOptions
}

interface ViewStateSpecials extends ViewState {
	root?: boolean
	navigation?: boolean
	target?: string
	dismiss?: string | boolean
}

function findModalConfig(path: string, options: Options): ModalConfig | undefined {
	const modals = options.modals
	if (!modals) {
		return undefined
	}

	for (const aModal of modals) {
		if (typeof aModal.path === 'string') {
			if (path.startsWith(aModal.path)) {
				return aModal
			}
		} else if (aModal.path instanceof RegExp) {
			if (aModal.path.test(path)) {
				return aModal
			}
		}
	}
	return undefined
}

/**
 * An error handler implementation that presents an alert with details of the error.
 */
export function alertErrorHandler(source: string, error: unknown): void {
	alert(`Navigation failed (${source}): ${error instanceof Error ? error.message : error}`)
}

const NAVIGATOR_NAVIGATE_MESSAGE_TYPE = '@cactuslab/native-navigation-react-router:navigate'

/**
 * A Navigator implementation to provide to react-router that handles navigation requests
 * using Capacitor Native Navigation.
 */
export function useNativeNavigationNavigator(options: Options): Navigator {
	const { plugin } = options

	const { componentId, stack, path, addMessageListener, removeMessageListener } = useNativeNavigationContext()

	const currentModal = findModalConfig(path, options)

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
						const result = await plugin.pop({
							count: -delta,
							stack,
						})
						if (result.count === 0) {
							/* If there was nothing to pop, and we're in a navigation-driven modal, dismiss it */
							if (currentModal) {
								await plugin.dismiss()
							}
						}
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

			const path = navigator.createHref(to)

			const targetModal = findModalConfig(path, options)
			if (targetModal) {
				if (!currentModal || targetModal !== currentModal) {
					/* New modal */
					const presentOptions = targetModal.presentOptions(path, state)
					try {
						await plugin.present(presentOptions)
					} catch (error) {
						reportError('push modal', error)
						throw error
					}
					return
				}
			} else if (currentModal) {
				/* Close this modal */
				plugin.dismiss({
					id: stack || componentId,
				})

				/* Then get the new top view to handle this navigation */
				await plugin.message<NavigateMessageData>({
					type: NAVIGATOR_NAVIGATE_MESSAGE_TYPE,
					value: {
						to,
						state,
						opts,
					}
				})
				return
			}

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

	/* Handle navigate requests from closing modals */
	const navigateMessageListener = useCallback(function(data: MessageEventData<NavigateMessageData>) {
		const targetPath = navigator.createHref(data.value.to)

		/* Decide whether to replace what's already here, or to push */
		if (path === targetPath) {
			navigator.replace(data.value.to, data.value.state, data.value.opts)
		} else {
			navigator.push(data.value.to, data.value.state, data.value.opts)
		}
	}, [])

	useEffect(function() {
		addMessageListener(NAVIGATOR_NAVIGATE_MESSAGE_TYPE, navigateMessageListener)

		return function() {
			removeMessageListener(NAVIGATOR_NAVIGATE_MESSAGE_TYPE, navigateMessageListener)
		}
	}, [])

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

interface NavigateMessageData {
	to: To
	state: unknown
	opts?: NavigateOptions | undefined
}
