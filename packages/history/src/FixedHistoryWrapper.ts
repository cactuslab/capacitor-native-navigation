import type { Action, History, Location as HistoryLocation, LocationDescriptor, LocationDescriptorObject, LocationListener, TransitionPromptHook, UnregisterCallback } from 'history'

import { toAbsoluteLocationDescriptorObject, toLocation, toLocationDescriptorObject } from './utils'

/**
 * A History wrapper that supports a single location and action. It passes through navigation changes
 * to the wrapped History, but FixedHistoryWrapper's location is only changed using the `setLocation`
 * method that you use to control which location is reported.
 */
export class FixedHistoryWrapper implements History {
	
	public location: HistoryLocation<unknown>
	public action: Action

	private wrapped: History
	private listeners: LocationListener<unknown>[] = []

	public constructor(wrapped: History) {
		this.location = {
			hash: '',
			pathname: '',
			search: '',
			state: {},
		}
		this.action = 'REPLACE'
		this.wrapped = wrapped

		/* Bind all member functions so callers can pass our member functions as bare functions */
		const proto = Object.getPrototypeOf(this)
		for (const p of Object.getOwnPropertyNames(proto) as (keyof this)[]) {
			const pd = Object.getOwnPropertyDescriptor(proto, p)
			if (pd && typeof pd.value === 'function') {
				this[p] = pd.value.bind(this)
			}
		}
	}

	get length(): number {
		return this.wrapped.length
	}

	/**
	 * Change or set the fixed location
	 * @param location 
	 * @param action 
	 */
	public setLocation(location: LocationDescriptor<unknown>, action: Action): void {
		this.location = toLocation(toLocationDescriptorObject(location, undefined))
		this.action = action

		for (const listener of this.listeners) {
			listener(this.location, this.action)
		}
	}

	public push(location: LocationDescriptor<unknown>, state?: unknown): void {
		location = toLocationDescriptorObject(location, state)
		/* We must convert the location to absolute here as we know what it should be relative to */
		location = toAbsoluteLocationDescriptorObject(location, this.location)
		return this.wrapped.push(location)
	}

	public replace(location: LocationDescriptor<unknown>, state?: unknown): void {
		location = toLocationDescriptorObject(location, state)
		/* We must convert the location to absolute here as we know what it should be relative to */
		location = toAbsoluteLocationDescriptorObject(location, this.location)
		return this.wrapped.replace(location)
	}

	public go(n: number): void {
		return this.wrapped.go(n)
	}

	public goBack(): void {
		return this.wrapped.goBack()
	}

	public goForward(): void {
		return this.wrapped.goForward()
	}

	public block(prompt?: string | boolean | TransitionPromptHook<unknown> | undefined): UnregisterCallback {
		return this.wrapped.block(prompt)
	}

	public listen(listener: LocationListener<unknown>): UnregisterCallback {
		this.listeners.push(listener)
		return () => {
			const index = this.listeners.indexOf(listener)
			if (index !== -1) {
				this.listeners.splice(index, 1)
			}
		}
	}

	public createHref(location: LocationDescriptorObject<unknown>): string {
		return this.wrapped.createHref(location)
	}

}
