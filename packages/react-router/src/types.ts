import type { PresentOptions, StateObject } from '@cactuslab/native-navigation'

export interface NativeNavigationNavigatorOptions {
	modals?: ModalConfig[]

	/**
	 * An optional error handler to receive unexpected errors from the NativeNavigation plugin
	 */
	errorHandler?: (source: string, error: unknown) => void
}

/**
 * The navigation options that are supported as part of the state property given to the navigate() function.
 */
export interface NativeNavigationNavigationState {
	/**
	 * Set to `true` if this navigation should pop to the root of the current stack before navigating.
	 */
	root?: boolean

	/**
	 * Set to `true` if this navigation is in "hierarchical" mode and should examine the path we're navigating
	 * to to decide how many (if any) components to pop off the current stack in order to maintain
	 * a hierarchical path behaviour.
	 */
	// hierarchical?: boolean // TODO implement support for this from the history module

	/**
	 * A component id to target with this navigation. This could be the id of the stack that this navigation
	 * should take place in. When no target is specified the current stack is targeted.
	 */
	target?: string

	/**
	 * Set to `true` to dismiss the current root before navigating. Set to the component id of a root to dismiss
	 * that root before navigating.
	 */
	dismiss?: string | boolean

	/**
	 * Set to control whether there is animation for the navigation. Defaults to `true`.
	 */
	animated?: boolean

	/**
	 * Set to `true` to make this navigation a replacing navigation. Defaults to `false`.
	 */
	replace?: boolean
}

export interface ModalConfig {
	/**
	 * The path prefix under which this modal lives.
	 */
	path: string | RegExp
	presentOptions(path: string, state?: StateObject): PresentOptions
}

export interface Path {
	pathname: string
	search?: string
	hash?: string
}
