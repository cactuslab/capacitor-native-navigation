import type { LocationDescriptorObject } from 'history'

import type { NavigationState } from './types'

export type NavigationDeciderAction = 'push' | 'replace' | 'root'

/**
 * The result of a navigation decision from a NavigationDecider.
 */
export interface NavigationDecision {
	action: NavigationDeciderAction
	popCount: number
}

/**
 * An interface for a function that decides how to handle a navigation request.
 */
export type NavigationDecider = (location: LocationDescriptorObject<unknown>, action: NavigationDeciderAction, stack?: string) => NavigationDecision

export function defaultDecider(location: LocationDescriptorObject<unknown>, action: 'push' | 'replace', history: LocationDescriptorObject<unknown>[]): NavigationDecision {
	const state: NavigationState = location.state ? location.state as NavigationState : {}

	function contextForUri(uri: string): string {
		if (uri.endsWith('/')) {
			uri = uri.substring(0, uri.length - 1)
		}
		const i = uri.lastIndexOf('/')
		if (i === 0) {
			return uri
		} else if (i !== -1) {
			return uri.substring(0, i)
		} else {
			return '/'
		}
	}
	
	if (state.root) {
		return {
			action: 'root',
			popCount: history.length - 1,
		}
	} else if (state.navigation) {
		const uri = location.pathname || ''
		const context = contextForUri(uri)
		// console.debug(`NavigationDecider: context for ${uri} is ${context}`)

		/* Look for where that context ends */
		let j = history.length - 1
		let previousIsSuperOrSame = false
		for (; j >= 0; j--) {
			const huri = history[j].pathname || ''
			const hcontext = contextForUri(huri)

			if (hcontext.startsWith(context)) {
				/* We're a super-context or the same context of the historical one so keep looking */
				// console.log(`NavigationDecider: found same context ${huri} in ${hcontext}`)
				previousIsSuperOrSame = true
			} else if (context.startsWith(hcontext)) {
				/* We're a subcontext of the historical one */
				// console.log(`NavigationDecider: found subcontext ${huri} in ${hcontext} (previous is super or same = ${previousIsSuperOrSame}`)

				const popCountToIncludeThisOne = history.length - j
				if (previousIsSuperOrSame) {
					/* Pop up to but not including this one, or the previous that is super-or-same, and then replace previous */
					return {
						action: 'replace',
						popCount: popCountToIncludeThisOne - 2,
					}
				} else {
					/* Popup to to but not including this one, then push */
					return {
						action: 'push',
						popCount: popCountToIncludeThisOne - 1,
					}
				}
			} else {
				/* We're unrelated to the historical context so keep unwinding */
				// console.log(`NavigationDecider: found unrelated ${huri} in ${hcontext}`)
				previousIsSuperOrSame = false
			}
		}

		/* Found nothing context related to replace the whole stack */
		return {
			action: 'replace',
			popCount: history.length - 1, /* -1 so we leave one unpopped to be replaced */
		}
	}
	
	/* Do nothing special */
	return {
		action,
		popCount: 0,
	}
}
