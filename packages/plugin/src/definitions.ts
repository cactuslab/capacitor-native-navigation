export interface NativeNavigationPlugin {

	/**
	 * Present a new native UI.
	 * @param options 
	 */
	present(options: PresentOptions): Promise<PresentResult>

	/**
	 * Dismiss a native UI.
	 * @param options 
	 */
	dismiss(options?: DismissOptions): Promise<DismissResult>

	/**
	 * Push a new component onto a stack, or replace an existing component.
	 * @param options 
	 */
	push(options: PushOptions): Promise<PushResult>

	/**
	 * Pop the top component off a stack
	 * @param options 
	 */
	pop(options: PopOptions): Promise<PopResult>

	/**
	 * Set the options for an existing component
	 * @param options 
	 */
	update(options: UpdateOptions): Promise<void>

	/**
	 * Remove all of the native UI and reset back to the root Capacitor webview.
	 */
	reset(options?: ResetOptions): Promise<void>

	/**
	 * Get the spec and context of a component
	 */
	get(options?: GetOptions): Promise<GetResult>

	/**
	 * Send a message to a component.
	 */
	message<D>(options: MessageOptions<D>): Promise<void>
}

export interface NativeNavigationPluginInternal extends NativeNavigationPlugin {

	/**
	 * Signal that a view requested by the CreateView event is now ready to use.
	 */
	viewReady(options: ViewReadyOptions): Promise<void>

}

export interface MessageOptions<D = unknown> {
	/**
	 * The target component of the message, or `undefined` to send to the top-most component.
	 */
	target?: ComponentId
	/**
	 * The message type.
	 */
	type: string
	/**
	 * A message value. Must be JSON stringifiable.
	 */
	value?: D
}

/**
 * The data sent with the message event.
 */
export interface MessageEventData<D = any> {
	target: ComponentId
	type: string
	value: D
}

// use window.open to access a view... we need to specify where we want it
// ?target=<name>
// ?mode=push|replace (replaces all in stack)

export type ComponentId = string
export type ButtonId = string

export interface ComponentSpec {
	type: ComponentType

	/**
	 * The id to use for the component, or undefined to automatically generate an id.
	 */
	id?: ComponentId

	/* There was previously an options property here; this exists temporarily to help find existing usage */
	options?: never
}

type ComponentSpecs = StackSpec | TabsSpec | ViewSpec

export interface StackSpec extends ComponentSpec {
	type: 'stack'
	components: ViewSpec[]
	bar?: BarSpec
	title?: string
}

export interface TabsSpec extends ComponentSpec {
	type: 'tabs'
	tabs: TabSpec[]
	title?: string
}

export interface TabSpec {
	/**
	 * The id to use for the tab, or undefined to automatically generate an id.
	 */
	id?: ComponentId

	title?: string
	image?: ImageSpec
	badgeValue?: string

	component: StackSpec | ViewSpec
}

export type ViewState = Record<string, string | number | boolean | null | undefined>
export interface ViewSpec extends ComponentSpec {
	type: 'view'

	/**
	 * The path representing the view.
	 */
	path: string

	state?: ViewState

	/**
	 * Options for when the component is used in a stack
	 */
	stackItem?: StackItemSpec
}

export type ComponentType = 'stack' | 'tabs' | 'view'

export interface PresentOptions {
	/**
	 * The component to present.
	 */
	component: ComponentSpecs

	/**
	 * The presentation style.
	 * Defaults to `'fullScreen'`
	 */
	style?: PresentationStyle

	/**
	 * Whether to allow the user to use system gestures or the back button
	 * to unwind the presentation.
	 * Useful to prevent the accidental dismissal of a form.
	 * Defaults to `true`
	 */
	cancellable?: boolean 

	/**
	 * Whether to animate the presenting.
	 * Defaults to `true`
	 */
	animated?: boolean
}

export interface PresentResult {
	id: ComponentId
}

export type PresentationStyle = 'fullScreen' | 'pageSheet' | 'formSheet' | 'dialog'

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
	 * The target component to push to, usually a stack, or undefined to push to the current stack or component.
	 */
	target?: ComponentId

	/**
	 * Whether to animate the push.
	 * Defaults to `true`
	 */
	animated?: boolean

	/**
	 * The mode to use for the push. Defaults to `'push'`.
	 * push: Push the component onto the stack.
	 * replace: Replace the current top-most component in the stack.
	 * root: Reset the stack back to just the new component.
	 */
	mode?: PushMode

	/**
	 * How many items to pop first
	 */
	popCount?: number
}

/**
 * push: Push the component onto the stack.
 * replace: Replace the current top-most component in the stack.
 * root: Reset the stack back to just the new component.
 */
export type PushMode = 'push' | 'replace' | 'root'

export interface PushResult {
	/**
	 * The id of the component that was pushed.
	 */
	id: ComponentId

	/**
	 * The stack that was pushed to, if it was pushed to a stack.
	 */
	stack?: ComponentId
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

export interface UpdateOptions {
	id: ComponentId

	/**
	 * Whether to animate the changes.
	 * Defaults to `false`
	 */
	animated?: boolean

	update: StackUpdate | TabsUpdate | TabUpdate | ViewUpdate
}

export interface ComponentOptions {
	title?: string | null
}

/**
 * Options for stack components
 */
export interface StackUpdate extends ComponentOptions {
	components?: ViewSpec[]
	bar?: BarUpdate
}

interface BarSpec {
	background?: FillSpec
	title?: LabelSpec
	buttons?: LabelSpec
	visible?: boolean
}

interface BarUpdate {
	background?: FillUpdate | null
	title?: LabelUpdate | null
	buttons?: LabelUpdate | null
	visible?: boolean | null
}

export interface FillSpec {
	color?: string
}

export interface FillUpdate {
	color?: string | null
}

export interface LabelSpec {
	color?: string
	font?: FontSpec
}

export interface LabelUpdate {
	color?: string | null
	font?: FontUpdate | null
}

export interface FontSpec {
	name?: string
	size?: number
}

export interface FontUpdate {
	name?: string | null
	size?: number | null
}

/**
 * Options for tabs components
 */
export interface TabsUpdate extends ComponentOptions {
	tabs?: TabSpec[]
}

export interface TabUpdate {
	title?: string | null
	image?: ImageSpec | null
	badgeValue?: string | null

	component?: StackSpec | ViewSpec
}

/**
 * Options for view components
 */
export interface ViewUpdate extends ComponentOptions {
	/**
	 * Options for when the component is used in a stack
	 */
	stackItem?: StackItemUpdate
}

export interface StackItemSpec {
	backItem?: StackBarButtonItem
	leftItems?: StackBarButtonItem[]
	rightItems?: StackBarButtonItem[]
	
	/**
	 * Enables the system gestures and buttons for managing the back action.
	 * Useful for preventing the user from exiting a window that is running
	 * an important operation. Does not prevent the user from backgrounding
	 * the application.
	 * Default behaviour is to use the host Stack configuration which behaves
	 * as backEnabled is `true`
	 */
	backEnabled?: boolean

	/**
	 * Customise the bar on top of the default options provided by the
	 * stack
	 */
	bar?: BarSpec
}
export interface StackItemUpdate {
	backItem?: StackBarButtonItem | null
	leftItems?: StackBarButtonItem[] | null
	rightItems?: StackBarButtonItem[] | null
	
	/**
	 * Enables the system gestures and buttons for managing the back action.
	 * Useful for preventing the user from exiting a window that is running
	 * an important operation. Does not prevent the user from backgrounding
	 * the application.
	 * Default behaviour is to use the host Stack configuration which behaves
	 * as backEnabled is `true`
	 */
	backEnabled?: boolean | null

	/**
	 * Customise the bar on top of the default options provided by the
	 * stack
	 */
	bar?: BarUpdate | null
}



export interface ResetOptions {
	/**
	 * Whether to animate resetting the navigation back to Capacitor
	 * Defaults to `false`
	 */
	animated?: boolean
}

interface StackBarButtonItem {
	id: ButtonId
	title: string
	image?: ImageSpec
}

export enum NativeNavigationEvents {
	/**
	 * A new view is required to be initialised by calling window.open
	 */
	CreateView = 'createView',

	UpdateView = 'updateView',

	DestroyView = 'destroyView',

	/**
	 * A click occurred on a button.
	 */
	Click = 'click',

	Message = 'message',

	ViewWillAppear = 'viewWillAppear',
	ViewDidAppear = 'viewDidAppear',
	ViewWillDisappear = 'viewWillDisappear',
	ViewDidDisappear = 'viewDidDisappear',
}

export interface CreateViewEventData {
	id: ComponentId
	path: string
	state?: unknown
	stack?: ComponentId
}

export type UpdateViewEventData = CreateViewEventData

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
	 * The component id to get, or undefined to get the top-most component.
	 */
	id?: ComponentId
}

export interface GetResult {
	/**
	 * The component, if any.
	 */
	component?: ComponentSpecs

	/**
	 * The stack containing the component, if any.
	 */
	stack?: StackSpec
	
	/**
	 * The tabs containing the component, if any.
	 */
	tabs?: TabsSpec
}
