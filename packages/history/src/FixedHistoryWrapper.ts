import type { Action, History, Location as HistoryLocation, LocationDescriptor, LocationDescriptorObject, TransitionPromptHook, UnregisterCallback } from 'history'

import { toAbsoluteLocationDescriptorObject, toLocation, toLocationDescriptorObject } from './utils'

/**
 * A History wrapper that supports a single location and action. It passes through any changes to the
 * location to the wrapped History, but it doesn't report changes to its own listeners.
 */
export class FixedHistoryWrapper implements History {
	
	public location: HistoryLocation<unknown>
	public action: Action

	private wrapped: History

	public constructor(location: LocationDescriptor<unknown>, action: Action, wrapped: History) {
		this.location = toLocation(toLocationDescriptorObject(location, undefined))
		this.action = action
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

	public listen(): UnregisterCallback {
		/* We don't allow any listeners as we have a fixed location */
		return function() {
			/* noop */
		}
	}

	public createHref(location: LocationDescriptorObject<unknown>): string {
		return this.wrapped.createHref(location)
	}

}
