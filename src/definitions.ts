export interface NativeNavigationPlugin {
	
	create(options: RootOptions): Promise<CreateResult>

	/**
	 * Present a new root.
	 * @param options 
	 */
	present(options: PresentOptions): Promise<PresentResult>

	/**
	 * Dismiss a root.
	 * @param options 
	 */
	dismiss(options: DismissOptions): Promise<void>

	push(options: PushOptions): Promise<PushResult>

	pop(options: PopOptions): Promise<PopResult>
}

// use window.open to access a view... we need to specify where we want it
// ?target=<name>
// ?mode=push|replace (replaces all in stack)

export type RootName = string
export type ViewId = string

export interface RootOptions {
	type: RootType
	name?: RootName
	presentationStyle?: PresentationStyle
	modalPresentationStyle?: ModalPresentationStyle
}

export interface StackOptions extends RootOptions {
	type: 'stack'
}

export interface TabsOptions extends RootOptions {
	type: 'tabs'
	stacks: RootName[]
}

export interface PlainRootOptions extends RootOptions {
	type: 'plain'
}

export interface CreateResult {
	root: RootName
}

export type RootType = 'stack' | 'tabs' | 'plain'

export interface PresentOptions {
	/**
	 * The root to present; either an already created one or a new one
	 */
	root: RootName | RootOptions
	animated?: boolean
	presentationStyle?: PresentationStyle
	modalPresentationStyle?: ModalPresentationStyle
}

export interface PresentResult {
	root: RootName
}

export type PresentationStyle = 'normal' | 'modal'

export type ModalPresentationStyle = 'fullScreen' | 'pageSheet' | 'formSheet' // TODO mimic what's available in iOS and Android

export interface DismissOptions {
	root: RootName
	animated?: boolean
}


export interface PushOptions {
	/**
	 * The stack to push to, or undefined to push to the current stack.
	 */
	stack?: RootName

	animated?: boolean

	/**
	 * The path representing the view to push.
	 */
	path: string
}

export interface PushResult {
	/**
	 * The stack that was pushed to.
	 */
	stack: RootName
	/**
	 * The id of the view pushed
	 */
	viewId: ViewId
}

export interface PopOptions {
	/**
	 * The stack to pop from, or undefined to pop from the current stack.
	 */
	stack?: RootName
}

export interface PopResult {
	stack: RootName
	viewId: ViewId
}

export enum NativeNavigationEvents {
	View = 'view',
}
