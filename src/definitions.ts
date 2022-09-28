export interface NativeNavigationPlugin {
	
	/**
	 * Create a new native UI.
	 * @param options 
	 */
	create(options: CreateOptionsValues): Promise<CreateResult>

	setRoot(options: SetRootOptions): Promise<void>

	/**
	 * Present a new native UI as a modal.
	 * @param options 
	 */
	present(options: PresentOptions): Promise<PresentResult>

	/**
	 * Dismiss a native UI.
	 * @param options 
	 */
	dismiss(options: DismissOptions): Promise<DismissResult>

	/**
	 * Push a new component onto a stack
	 * @param options 
	 */
	push(options: PushOptions): Promise<PushResult>

	/**
	 * Pop the top component off a stack
	 * @param options 
	 */
	pop(options: PopOptions): Promise<PopResult>

	setOptions(options: ComponentOptions): Promise<void>
}

// use window.open to access a view... we need to specify where we want it
// ?target=<name>
// ?mode=push|replace (replaces all in stack)

export type ComponentId = string

export interface CreateOptions {
	type: ComponentType

	/**
	 * The id to use for the component, or undefined to automatically generate an id.
	 */
	id?: ComponentId

	modalPresentationStyle?: ModalPresentationStyle

	/**
	 * Whether to retain this component even if it is dismissed or popped.
	 */
	retain?: boolean
}

type CreateOptionsValues = StackOptions | TabsOptions | ViewOptions

export interface StackOptions extends CreateOptions {
	type: 'stack'
	stack?: CreateOptionsValues[]
}

export interface TabsOptions extends CreateOptions {
	type: 'tabs'
	tabs: CreateOptionsValues[]
}

export interface ViewOptions extends CreateOptions {
	type: 'view'

	/**
	 * The path representing the view.
	 */
	path: string

	state?: Record<string, unknown>
}

export interface CreateResult {
	id: ComponentId
}

export type ComponentType = 'stack' | 'tabs' | 'view'

export interface SetRootOptions {
	id: ComponentId
}

export interface PresentOptions {
	/**
	 * The root to present; either an already created one or a new one
	 */
	id: ComponentId

	animated?: boolean
}

export interface PresentResult {
	id: ComponentId
}

export type ModalPresentationStyle = 'fullScreen' | 'pageSheet' | 'formSheet' // TODO mimic what's available in iOS and Android

export interface DismissOptions {
	id?: ComponentId
	animated?: boolean
}

export interface DismissResult {
	id: ComponentId
}

export interface PushOptions {
	/**
	 * The id of the component to push.
	 */
	id: ComponentId

	/**
	 * The stack to push to, or undefined to push to the current stack.
	 */
	stack?: ComponentId

	animated?: boolean
}

export interface PushResult {
	/**
	 * The stack that was pushed to.
	 */
	stack: ComponentId
}

export interface PopOptions {
	/**
	 * The stack to pop from, or undefined to pop from the current stack.
	 */
	stack?: ComponentId

	animated?: boolean
}

export interface PopResult {
	stack: ComponentId

	/**
	 * The id of the component that was popped, if any
	 */
	id?: ComponentId
}

export interface ComponentOptions {
	id: ComponentId
	
	title?: string
	rightButton?: {
		title?: string
	}
}


export enum NativeNavigationEvents {
	View = 'view',
}

export interface ViewEventData {
	id: ComponentId
	path: string
	state?: unknown
}
