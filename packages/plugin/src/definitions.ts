export interface NativeNavigationPlugin {
	
	/**
	 * Set the root UI of the application.
	 * @param options 
	 */
	setRoot(options: SetRootOptions): Promise<SetRootResult>

	/**
	 * Present a new native UI as a modal.
	 * @param options 
	 */
	present(options: PresentOptions): Promise<PresentResult>

	/**
	 * Dismiss a native UI.
	 * @param options 
	 */
	dismiss(options?: DismissOptions): Promise<DismissResult>

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

	setOptions(options: SetComponentOptions): Promise<void>

	/**
	 * Remove all of the native UI and reset back to the root Capacitor webview.
	 */
	reset(options?: ResetOptions): Promise<void>

	/**
	 * Get the spec of a component
	 */
	get(options?: GetOptions): Promise<ComponentSpecs>
}

export interface NativeNavigationPluginInternal extends NativeNavigationPlugin {

	/**
	 * Signal that a view requested by the CreateView event is now ready to use.
	 */
	viewReady(options: ViewReadyOptions): Promise<void>

}

// use window.open to access a view... we need to specify where we want it
// ?target=<name>
// ?mode=push|replace (replaces all in stack)

export type ComponentId = string
export type ButtonId = string

export interface ComponentSpec<O extends ComponentOptions> {
	type: ComponentType

	/**
	 * The id to use for the component, or undefined to automatically generate an id.
	 */
	id?: ComponentId

	options?: O
}

type ComponentSpecs = StackSpec | TabsSpec | ViewSpec

export interface StackSpec extends ComponentSpec<StackOptions> {
	type: 'stack'
	stack?: ViewSpec[]
}

export interface TabsSpec extends ComponentSpec<TabsOptions> {
	type: 'tabs'
	tabs: (StackSpec | ViewSpec)[]
}

export type ViewState = Record<string, string | number | boolean | null>
export interface ViewSpec extends ComponentSpec<ViewOptions> {
	type: 'view'

	/**
	 * The path representing the view.
	 */
	path: string

	state?: ViewState
}

export type ComponentType = 'stack' | 'tabs' | 'view'

export interface SetRootOptions {

	/**
	 * The component to set as the root of the application.
	 */
	component: ComponentSpecs

	/**
	 * Whether to animate setting the root.
	 * Defaults to `false`
	 */
	animated?: boolean
}

export interface SetRootResult {
	id: ComponentId
}

export interface PresentOptions {
	/**
	 * The component to present as a modal.
	 */
	component: ComponentSpecs

	/**
	 * Whether to animate the presenting.
	 * Defaults to `true`
	 */
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
	 * The options for the view to push onto the stack.
	 */
	component: ViewSpec

	/**
	 * The stack to push to, or undefined to push to the current stack.
	 */
	stack?: ComponentId

	/**
	 * Whether to animate the push.
	 * Defaults to `true`
	 */
	animated?: boolean

	/**
	 * The mode to use for the push. Defaults to `PushMode.PUSH`.
	 */
	mode?: PushMode
}

export enum PushMode {
	/**
	 * Push the component onto the stack.
	 */
	PUSH = 'push',
	/**
	 * Replace the current top-most component in the stack.
	 */
	REPLACE = 'replace',
	/**
	 * Reset the stack back to just the new component.
	 */
	ROOT = 'root',
}

export interface PushResult {
	/**
	 * The id of the component that was pushed.
	 */
	id: ComponentId

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

	/**
	 * How many items to pop
	 */
	count?: number

	/**
	 * Whether to animate the pop.
	 * Defaults to `true`
	 */
	animated?: boolean
}

export interface PopResult {
	stack: ComponentId

	/** The number of components that were popped */
	count: number

	/**
	 * The id of the component that was popped, if any.
	 * If multiple components are popped, the id will be of the last component popped.
	 */
	id?: ComponentId
}

export interface SetComponentOptions {
	id: ComponentId

	/**
	 * Whether to animate the changes.
	 * Defaults to `false`
	 */
	animated?: boolean

	options: AllComponentOptions
}

export interface ComponentOptions {
	title?: string | null

	/**
	 * Options for when the component is used in a stack
	 */
	stack?: {
		backItem?: StackBarItem
		leftItems?: StackBarItem[]
		rightItems?: StackBarItem[]
	}

	/**
	 * Options for when the component is used in a tab
	 */
	tab?: {
		image?: ImageSpec
		badgeValue?: string
	}

	modalPresentationStyle?: ModalPresentationStyle
}

/**
 * Options for stack components
 */
export interface StackOptions extends ComponentOptions {
	bar?: {
		background?: FillOptions
		title?: LabelOptions
		buttons?: LabelOptions
	}
}

export interface FillOptions {
	color?: string
}

export interface LabelOptions {
	color?: string
	font?: FontOptions
}

export interface FontOptions {
	name: string
	size: number
}

/**
 * Options for tabs components
 */
export type TabsOptions = ComponentOptions

/**
 * Options for view components
 */
export type ViewOptions = ComponentOptions

export type AllComponentOptions = StackOptions | TabsOptions | ViewOptions

export interface ResetOptions {
	/**
	 * Whether to animate resetting the navigation back to Capacitor
	 * Defaults to `false`
	 */
	animated?: boolean
}

interface StackBarItem {
	id: ButtonId
	title: string
	image?: ImageSpec
}

export enum NativeNavigationEvents {
	/**
	 * A new view is required to be initialised by calling window.open
	 */
	CreateView = 'createView',

	DestroyView = 'destroyView',

	/**
	 * A click occurred on a button.
	 */
	Click = 'click',
}

export interface CreateViewEventData {
	id: ComponentId
	path: string
	state?: unknown
}

export interface DestroyViewEventData {
	id: ComponentId
}

export interface ClickEventData {
	buttonId: ButtonId
	componentId: ComponentId
}

export interface ViewReadyOptions {
	/**
	 * The component id of the view that has been made ready for presentation.
	 */
	id: ComponentId
}

export type ImageSpec = ImageObject | string

export interface ImageObject {
	/**
	 * The uri for the image.
	 */
	uri: string
	/**
	 * The scale to use for the image, e.g. 2 for a 2x scale image. If not provided
	 * the scale will be determined automatically from the filename, or it will default to 1.
	 */
	scale?: number
}

export interface GetOptions {
	/**
	 * The component id to get, or undefined to get the top-most root.
	 */
	id?: ComponentId
}
