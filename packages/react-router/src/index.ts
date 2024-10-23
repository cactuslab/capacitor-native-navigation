

export { NativeNavigationNavigatorOptions, ModalConfig } from './types'
export { default as NativeNavigationRouter } from './NativeNavigationRouter'
export { createNativeNavigationNavigationState } from './utils'
export { useNativeNavigationNavigator } from './hooks'

/**
 * An error handler implementation that presents an alert with details of the error.
 */
export function alertErrorHandler(source: string, error: unknown): void {
	alert(`Navigation failed (${source}): ${error instanceof Error ? error.message : error}`)
}

