/* eslint-disable @typescript-eslint/prefer-for-of */
import type { LocationDescriptorObject } from 'history'

import { defaultDecider } from './NavigationDecider'
import type { NavigationDecision, DefaultNavigationDeciderOptions } from './NavigationDecider'

const DEFAULT_STACK = '__default'

interface StackInfo {
	history: LocationDescriptorObject<unknown>[]
}

/**
 * Provide a NavigationDecider function for browser usage. The BrowserNavigationDecider builds up
 * its own knowledge of the history so it can make decisions about how to navigate.
 */
export class BrowserNavigationDecider {

	/**
	 * Info about each stack. The web has a single stack whereas native may have multiple.
	 */
	private stacks: Record<string, StackInfo> = {}

	private navigationDeciderOptions: DefaultNavigationDeciderOptions

	public constructor(options: DefaultNavigationDeciderOptions) {
		this.navigationDeciderOptions = options
		this.stacks[DEFAULT_STACK] = { history: [] }
	}

	/**
	 * Record a push that has occurred.
	 */
	public push(location: LocationDescriptorObject<unknown>, stack?: string): void {
		this.pushOrReplace(location, 'push', stack)
	}

	/**
	 * Record a replace that has occurred.
	 */
	public replace(location: LocationDescriptorObject<unknown>, stack?: string): void {
		this.pushOrReplace(location, 'replace', stack)
	}

	/**
	 * Handle a pop that has occurred.
	 */
	public pop(count: number, stack?: string): void {
		stack = stack || DEFAULT_STACK

		if (!this.stacks[stack]) {
			return
		}

		const history = this.stacks[stack].history
		history.splice(Math.max(0, history.length - count), count)

		// console.log('BrowserNavigationDecider.pop', count, stack, history.map(h => h.pathname))
	}

	public popTo(location: LocationDescriptorObject<unknown>, stack?: string): void {
		stack = stack || DEFAULT_STACK

		if (!this.stacks[stack]) {
			return
		}

		const history = this.stacks[stack].history
		let i = history.length - 1
		while (i >= 0) {
			const potential = history[i]
			if (potential.pathname === location.pathname && potential.search === location.search && potential.hash === location.hash && compareState(potential.state, location.state)) {
				// console.log('BrowserNavigationDecider.popTo found destination at', i)
				break
			}
			i--
		}

		if (i === -1) {
			// console.log('BrowserNavigationDecider.popTo didnt find destination', location, history.map(h => h.pathname))
			history.splice(0, history.length)
			history.push(location)
			return
		}

		i++
		history.splice(i, history.length - i)

		// console.log('BrowserNavigationDecider.popTo', i, stack, history.map(h => h.pathname))
	}

	public length(stack?: string): number {
		stack = stack || DEFAULT_STACK

		if (!this.stacks[stack]) {
			return 0
		}
		return this.stacks[stack].history.length
	}

	public current(stack?: string): LocationDescriptorObject<unknown> {
		stack = stack || DEFAULT_STACK

		if (!this.stacks[stack]) {
			console.warn('BrowserNavigationDecider: Getting current from unknown stack', stack)
			return {
				pathname: '',
				hash: '',
				search: '',
				state: null,
			}
		}

		const history = this.stacks[stack].history
		if (history.length === 0) {
			console.warn('BrowserNavigationDecider: Getting current from empty stack', stack)
			return {
				pathname: '',
				hash: '',
				search: '',
				state: null,
			}
		}

		return history[history.length - 1]
	}

	public decide(location: LocationDescriptorObject<unknown>, action: 'push' | 'replace', stack?: string): NavigationDecision {
		stack = stack || DEFAULT_STACK

		if (!this.stacks[stack]) {
			this.stacks[stack] = { history: [] }
		}

		const history = this.stacks[stack].history
		return defaultDecider(location, action, history, this.navigationDeciderOptions)
	}

	private pushOrReplace(location: LocationDescriptorObject<unknown>, action: 'push' | 'replace', stack?: string): void {
		stack = stack || DEFAULT_STACK

		if (!this.stacks[stack]) {
			this.stacks[stack] = { history: [] }
		}

		const history = this.stacks[stack].history

		switch (action) {
			case 'push':
				history.push(location)
				break
			case 'replace':
				if (history.length > 0) {
					history[history.length - 1] = location
				} else {
					history.push(location)
				}
				break
		}

		// console.log('NAVIGATION DECIDER:', action, location, stack, history.map(h => h.pathname))
	}
}

function compareState(a: unknown, b: unknown) {
	if (typeof a === 'object' && typeof b === 'object') {
		if (a === null && b === null) {
			return true
		} else if (a === null || b === null) {
			return false
		}

		const ka = Object.keys(a)
		const kb = Object.keys(b)
		if (ka.length !== kb.length) {
			return false
		}

		const aa = a as Record<string, unknown>
		const bb = a as Record<string, unknown>

		for (let i = 0; i < ka.length; i++) {
			if (aa[ka[i]] !== bb[ka[i]]) {
				return false
			}
		}
		for (let i = 0; i < kb.length; i++) {
			if (aa[kb[i]] !== bb[kb[i]]) {
				return false
			}
		}

		return true
	} else {
		return a === b
	}
}
