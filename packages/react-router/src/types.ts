import type { PresentOptions, ViewState } from '@cactuslab/native-navigation'

export interface NativeNavigationNavigatorOptions {
	modals?: ModalConfig[]

	/**
	 * An optional error handler to receive unexpected errors from the NativeNavigation plugin
	 */
	errorHandler?: (source: string, error: unknown) => void
}

export interface ModalConfig {
	/**
	 * The path prefix under which this modal lives.
	 */
	path: string | RegExp
	presentOptions(path: string, state?: ViewState): PresentOptions
}

export interface Path {
	pathname: string
	search?: string
	hash?: string
}
