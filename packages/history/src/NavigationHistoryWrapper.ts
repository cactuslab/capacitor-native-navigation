import type { Action, Action as HistoryAction, History, Location as HistoryLocation, Location, LocationDescriptor, LocationDescriptorObject, LocationListener, LocationState, TransitionPromptHook, UnregisterCallback } from 'history'

import { BrowserNavigationDecider } from './BrowserNavigationDecider'
import type { DefaultNavigationDeciderOptions } from './NavigationDecider'
import { toLocation, toLocationDescriptorObject } from './utils'

/**
 * A wrapper around a History that manipulates the history using a NavigationDecider
 * to implement hierarchical back-stacks.
 * <p>
 * This can be used in a browser environment to make the back stack behave more like an app.
 */
export class NavigationHistoryWrapper implements History {

	private wrapped: History
	private decider: BrowserNavigationDecider
	private lastAction: Action
	private waitingForPop: (() => void)[]
	private listeners: LocationListener<unknown>[]

	public constructor(wrapped: History, options: DefaultNavigationDeciderOptions) {
		this.wrapped = wrapped
		this.decider = new BrowserNavigationDecider(options)
		this.lastAction = wrapped.action
		this.listeners = []
		this.waitingForPop = []
		
		this.decider.replace(wrapped.location)

		wrapped.listen((location, action) => {
			if (action === 'POP' && this.waitingForPop.length > 0) {
				// console.log('NavigationHistoryWrapper: ignoring browser history event', location, action)
				const func = this.waitingForPop.shift()
				if (func) {
					func()
				}
				return
			}

			// console.log('NavigationHistoryWrapper: browser history event', location, action, this.waitingForPop)

			switch (action) {
				case 'POP':
					/* We don't know how many steps we've popped, but we know what we've popped to */
					this.decider.popTo(location)
					break
				case 'PUSH':
					this.decider.push(location)
					break
				case 'REPLACE':
					this.decider.replace(location)
					break
			}

			this.lastAction = action
			this.fire(location, action)
		})

		/* Bind all member functions so callers can pass our member functions as bare functions */
		const proto = Object.getPrototypeOf(this)
		for (const p of Object.getOwnPropertyNames(proto) as (keyof this)[]) {
			const pd = Object.getOwnPropertyDescriptor(proto, p)
			if (pd && typeof pd.value === 'function') {
				this[p] = pd.value.bind(this)
			}
		}
	}

	public get length(): number {
		const result = this.decider.length()
		// console.log('NavigationHistoryWrapper.length', result)

		return result
	}

	public get action(): HistoryAction {
		return this.lastAction
	}

	public get location(): HistoryLocation<LocationState> {
		const result = this.decider.current()
		return toLocation(result)
	}

	public push(location: LocationDescriptor<unknown>, state?: unknown): void {
		this.pushOrReplace(location, 'push', state)
	}

	public replace(location: LocationDescriptor<unknown>, state?: unknown): void {
		this.pushOrReplace(location, 'replace', state)
	}

	public goBack(): void {
		this.wrapped.goBack()
	}

	public goForward(): void {
		throw new Error('NavigationHistoryWrapper.goForward is not supported')
	}

	public go(n: number): void {
		if (n < 0) {
			this.wrapped.go(n)
		} else if (n > 0) {
			throw new Error('NavigationHistoryWrapper.go with a positive number is not supported')
		}
	}

	public block(prompt?: string | boolean | TransitionPromptHook<unknown> | undefined): UnregisterCallback {
		return this.wrapped.block(prompt)
	}

	public listen(listener: LocationListener<unknown>): UnregisterCallback {
		this.listeners.push(listener)
		return () => {
			const index = this.listeners.indexOf(listener)
			this.listeners.splice(index, 1)
		}
	}

	public createHref(location: LocationDescriptorObject<unknown>): string {
		let result = ''
		if (location.pathname) {
			result += location.pathname
		}
		if (location.search) {
			result += `?${location.search}`
		}
		if (location.hash) {
			result += `#${location.hash}`
		}
		return result
	}

	private fire(location: Location<unknown>, action: HistoryAction): void {
		// console.debug('NavigationHistoryWrapper.fire', location, action)

		const listeners = [...this.listeners]
		for (const listener of listeners) {
			listener(location, action)
		}
	}

	private pushOrReplace(location: LocationDescriptor<unknown>, action: 'push' | 'replace', state?: unknown): void {
		location = toLocationDescriptorObject(location, state)

		const decision = this.decider.decide(location, action)
		// console.log(`NavigationHistoryWrapper.${action}`, location, decision)

		if (decision.popCount > 0) {
			this.decider.pop(decision.popCount)

			this.waitingForPop.push(() => {
				switch (decision.action) {
					case 'push':
						this.wrapped.push(location) // TODO we could push our state to the browser state so we can reconstruct it when the page is reloaded
						break
					case 'replace':
						this.wrapped.replace(location) // TODO we could push our state to the browser state so we can reconstruct it when the page is reloaded
						break
				}
			})

			/* Note that unfortunately the BrowserHistory implementation fires push events synchronously but pop events come from the browser and are fired asynchronously */
			this.wrapped.go(-decision.popCount)
		} else {
			switch (decision.action) {
				case 'push':
					this.wrapped.push(location) // TODO we could push our state to the browser state so we can reconstruct it when the page is reloaded
					break
				case 'replace':
					this.wrapped.replace(location) // TODO we could push our state to the browser state so we can reconstruct it when the page is reloaded
					break
			}
		}
	}
}
