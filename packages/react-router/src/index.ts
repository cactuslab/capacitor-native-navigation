import type { MessageEventData, ViewState } from '@cactuslab/native-navigation'
import { useNativeNavigation, useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import { useCallback, useEffect, useMemo } from 'react'
import type { NavigateOptions, Navigator, To } from 'react-router-dom'
import { NativeNavigationNavigatorOptions } from './types'
import { findModalConfig } from './utils'

export { NativeNavigationNavigatorOptions, ModalConfig } from './types'
export { default as NativeNavigationRouter } from './NativeNavigationRouter'

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

const NAVIGATOR_NAVIGATE_MESSAGE_TYPE = '@cactuslab/native-navigation-react-router:navigate'

/**
 * A Navigator implementation to provide to react-router that handles navigation requests
 * using Capacitor Native Navigation.
 */
export function useNativeNavigationNavigator(options: NativeNavigationNavigatorOptions): Navigator {
	const { plugin } = useNativeNavigation()

	const { componentId, stack, path: currentPath, addMessageListener, removeMessageListener } = useNativeNavigationViewContext()
	
	const currentModal = currentPath !== undefined ? findModalConfig(currentPath, options) : undefined

	const reportError = useCallback(function(source: string, error: unknown) {
		if (error instanceof Error) {
			console.error(`NativeNavigation Navigator: ${source}`, error)
		} else {
			console.warn(`NativeNavigation Navigator (${source}): ${error}`)
		}

		options.errorHandler?.(source, error)
	}, [options])
	
	const navigator: Navigator = useMemo(() => ({

		createHref: function(to: To): string {
			if (typeof to === 'string') {
				return to
			} else {
				let result = ''
				if (to.pathname) {
					result += to.pathname
				}
				if (to.search) {
					result += `${to.search}`
				}
				if (to.hash) {
					result += `${to.hash}`
				}
				return result
			}
		},

		go: async function(delta: number): Promise<void> {
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
				throw new Error('go(delta) is not implemented for going forward')
			}
		},

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		push: async function(to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
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
				}).catch(function(reason) {
					reportError('dismiss', reason)
				})

				/* Then get the new top view to handle this navigation */
				await plugin.message<NavigateMessageData>({
					type: NAVIGATOR_NAVIGATE_MESSAGE_TYPE,
					value: {
						to,
						state,
						opts,
					},
				})
				return
			}

			const replace = !!(opts?.replace || viewState?.replace)
			try {
				await plugin.push({
					component: {
						type: 'view',
						path,
						state: viewState,
					},
					mode: viewState?.root ? 'root' : replace ? 'replace' : undefined,
					target: viewState?.target || stack || componentId,
					animated: opts?.state?.animated,
				})
			} catch (error) {
				reportError(replace ? 'replace' : 'push', error)
				throw error
			}
		},

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		replace: async function(to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
			return navigator.push(to, state, opts ? { ...opts, replace: true } : { replace: true })
		},
	}), [componentId, currentModal, options, plugin, reportError, stack])

	/* Handle navigate requests from closing modals */
	useEffect(function() {
		function navigateMessageListener(data: MessageEventData<NavigateMessageData>) {
			const targetPath = navigator.createHref(data.value.to)
	
			/* Decide whether to replace what's already here, or to push */
			if (currentPath === targetPath) {
				navigator.replace(data.value.to, data.value.state, data.value.opts)
			} else {
				navigator.push(data.value.to, data.value.state, data.value.opts)
			}
		}

		addMessageListener(NAVIGATOR_NAVIGATE_MESSAGE_TYPE, navigateMessageListener)

		return function() {
			removeMessageListener(NAVIGATOR_NAVIGATE_MESSAGE_TYPE, navigateMessageListener)
		}
	}, [addMessageListener, currentPath, navigator, removeMessageListener])

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
