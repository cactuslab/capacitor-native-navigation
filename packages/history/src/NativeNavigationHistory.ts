import { NativeNavigation } from '@cactuslab/native-navigation'
import type { GetResult, ViewSpec, ViewState } from '@cactuslab/native-navigation'
import type { Action, History, Location, LocationDescriptor, LocationDescriptorObject, UnregisterCallback } from 'history'

import { defaultDecider } from './NavigationDecider'
import type { DefaultNavigationDeciderOptions, NavigationDecision } from './NavigationDecider'
import type { NavigationState } from './types'
import { toLocationDescriptorObject } from './utils'

interface NativeNavigationHistoryOptions extends DefaultNavigationDeciderOptions {

	/**
	 * An optional error handler to receive unexpected errors from the NativeNavigation plugin
	 * @param source the source of the error
	 * @param error an Error or a stringable message
	 */
	errorHandler?: (source: string, error: unknown) => boolean

}

/**
 * An error handler implementation that presents an alert with details of the error.
 */
export function alertErrorHandler(source: string, error: unknown): void {
	alert(`Navigation failed (${source}): ${error instanceof Error ? error.message : error}`)
}

/**
 * A History implementation that translates navigation requests to Native Navigation API requests.
 * Note that this object does NOT respond sensibly to requests for the `location`.
 * In order to provider a `location` for routing use `FixedHistoryWrapper`.
 */
export class NativeNavigationHistory implements History {

	private options: NativeNavigationHistoryOptions

	public constructor(options: NativeNavigationHistoryOptions) {
		this.options = options
		
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

		this.pushOrReplace(location, 'push').catch(function(reason) {
			console.error('NativeNavigationHistory: failed to push', reason)
		})
	}

	public replace(location: LocationDescriptor<unknown>, state?: unknown): void {
		location = toLocationDescriptorObject(location, state)
		
		this.pushOrReplace(location, 'replace').catch(function(reason) {
			console.error('NativeNavigationHistory: failed to replace', reason)
		})
	}

	public go(n: number): void {
		if (n < 0) {
			try {
				NativeNavigation.pop({
					count: -n,
				})
			} catch (error) {
				this.reportError('pop', error)
				throw error
			}
		} else if (n > 0) {
			throw new Error('NativeNavigationHistory.go forward not implemented')
		}
	}

	public goBack(): void {
		try {
			NativeNavigation.pop({})
		} catch (error) {
			this.reportError('pop', error)
			throw error
		}
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

		let current: GetResult
		try {
			current = await NativeNavigation.get()
		} catch (error) {
			this.reportError('get', error)
			throw error
		}

		let decision: NavigationDecision
		if (current.stack) {
			decision = defaultDecider(location, action, current.stack ? current.stack.stack.map(s => toLocationDescriptorObject(s.path, s.state)) : [], this.options)
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
			try {
				await NativeNavigation.push({
					component,
					mode: 'root',
					animated: false,
				})
			} catch (error) {
				this.reportError('root push', error)
				throw error
			}
		} else if (decision.action === 'push') {
			try {
				await NativeNavigation.push({
					component,
					popCount: decision.popCount,
				})
			} catch (error) {
				this.reportError('push', error)
				throw error
			}
		} else if (decision.action === 'replace') {
			try {
				await NativeNavigation.push({
					component,
					mode: 'replace',
					animated: false,
					popCount: decision.popCount,
				})
			} catch (error) {
				this.reportError('replace', error)
				throw error
			}
		} else {
			throw new Error(`Unsupported navigation action: ${decision.action}`)
		}
	}

	private reportError(source: string, error: unknown) {
		if (error instanceof Error) {
			console.error(`NativeNavigation Navigator: ${source}`, error)
		} else {
			console.warn(`NativeNavigation Navigator (${source}): ${error}`)
		}

		this.options.errorHandler?.(source, error)
	}

}
