import { NativeNavigation } from '@cactuslab/native-navigation'
import type { ViewSpec, ViewState } from '@cactuslab/native-navigation'
import type { Action, History, Location, LocationDescriptor, LocationDescriptorObject, UnregisterCallback } from 'history'

import { defaultDecider } from './NavigationDecider'
import type { DefaultNavigationDeciderOptions, NavigationDecision } from './NavigationDecider'
import type { NavigationState } from './types'
import { toLocationDescriptorObject } from './utils'

/**
 * A History implementation that translates navigation requests to Native Navigation API requests.
 * Note that this object does NOT respond sensibly to requests for the `location`.
 * In order to provider a `location` for routing use `FixedHistoryWrapper`.
 */
export class NativeNavigationHistory implements History {

	private navigationDeciderOptions: DefaultNavigationDeciderOptions

	public constructor(options: DefaultNavigationDeciderOptions) {
		this.navigationDeciderOptions = options
		
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
		return 0
	}

	public get action(): Action {
		return 'REPLACE'
	}

	public get location(): Location<unknown> {
		return {
			hash: '',
			pathname: '',
			search: '',
			state: '',
		}
	}

	public push(location: LocationDescriptor<unknown>, state?: unknown): void {
		location = toLocationDescriptorObject(location, state)
		// console.log('NativeNavigationHistory push', location)

		this.pushOrReplace(location, 'push').catch(function(reason) {
			console.error('NativeNavigationHistory failed to push', reason)
		})
	}

	public replace(location: LocationDescriptor<unknown>, state?: unknown): void {
		location = toLocationDescriptorObject(location, state)
		// console.log('NativeNavigationHistory replace', location)
		
		this.pushOrReplace(location, 'replace').catch(function(reason) {
			console.error('NativeNavigationHistory failed to replace', reason)
		})
	}

	public go(n: number): void {
		if (n < 0) {
			// console.log('NativeNavigationHistory go', n)
			NativeNavigation.pop({
				count: -n,
			})
		} else if (n > 0) {
			throw new Error('NativeNavigationHistory.go forward not implemented')
		}
	}

	public goBack(): void {
		// console.log('NativeNavigationHistory goBack')
		NativeNavigation.pop({})
	}

	public goForward(): void {
		throw new Error('NativeNavigationHistory.goForward is not supported')
	}

	public block(): UnregisterCallback {
		throw new Error('NativeNavigationHistory.block is not supported')
	}

	public listen(): UnregisterCallback {
		return () => {
			// NOOP
		}
	}

	public createHref(to: LocationDescriptorObject<unknown>): string {
		let result = ''
		if (to.pathname) {
			result += to.pathname
		}
		if (to.search) {
			result += `?${to.search}`
		}
		if (to.hash) {
			result += `#${to.hash}`
		}
		return result
	}

	private async pushOrReplace(location: LocationDescriptorObject<unknown>, action: 'push' | 'replace'): Promise<void> {
		if (!location.pathname || !location.pathname.startsWith('/')) {
			throw new Error(`Invalid relative pathname for ${action}: ${location.pathname || '<undefined>'}`)
		}

		const current = await NativeNavigation.get() // TODO we need to get the current containing stack
		let decision: NavigationDecision
		if (current.stack) {
			decision = defaultDecider(location, action, current.stack ? current.stack.stack.map(s => toLocationDescriptorObject(s.path, s.state)) : [], this.navigationDeciderOptions)
		} else {
			decision = {
				action,
				popCount: 0,
			}
		}
		const navigationState = (location.state || {}) as NavigationState

		const component: ViewSpec = {
			path: this.createHref(location),
			state: location.state as ViewState | undefined,
			type: 'view',
		}
		
		if (navigationState.root || decision.action === 'root') {
			await NativeNavigation.push({
				component,
				mode: 'root',
				animated: false,
			})
		} else if (decision.action === 'push') {
			await NativeNavigation.push({
				component,
				popCount: decision.popCount,
			})
		} else if (decision.action === 'replace') {
			await NativeNavigation.push({
				component,
				mode: 'replace',
				animated: false,
				popCount: decision.popCount,
			})
		} else {
			throw new Error(`Unsupported navigation action: ${decision.action}`)
		}
	}

}
