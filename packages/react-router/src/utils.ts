import { ModalConfig, NativeNavigationNavigationState, NativeNavigationNavigatorOptions, Path } from './types'

export function findModalConfig(path: string, options: NativeNavigationNavigatorOptions): ModalConfig | undefined {
	const modals = options.modals
	if (!modals) {
		return undefined
	}

	for (const aModal of modals) {
		if (typeof aModal.path === 'string') {
			if (path.startsWith(aModal.path)) {
				return aModal
			}
		} else if (aModal.path instanceof RegExp) {
			if (aModal.path.test(path)) {
				return aModal
			}
		}
	}
	return undefined
}

export function parsePath(path: string): Path {
	const result: Path = {
		pathname: path,
	}
	const s = path.indexOf('?')
	if (s !== -1) {
		result.pathname = path.substring(0, s)
		let search = path.substring(s)
		
		const h = search.indexOf('#')
		if (h !== -1) {
			result.hash = search.substring(h)
			search = search.substring(0, h)
		}
		result.search = search
	} else {
		const h = path.indexOf('#')
		if (h !== -1) {
			result.hash = path.substring(h)
			result.pathname = path.substring(0, h)
		}
	}
	return result
}

type StateWithNativeNavigationState = { nativeNavigation?: NativeNavigationNavigationState }

/**
 * Create a navigation state object containing 
 * @param state 
 * @returns 
 */
export function createNativeNavigationNavigationState(state: NativeNavigationNavigationState): StateWithNativeNavigationState {
	return {
		nativeNavigation: state,
	}
}

export function toNativeNavigationNavigationState(state: unknown): NativeNavigationNavigationState | undefined {
	if (state && typeof state === 'object' && (state as StateWithNativeNavigationState).nativeNavigation && typeof (state as StateWithNativeNavigationState).nativeNavigation === 'object') {
		return (state as StateWithNativeNavigationState).nativeNavigation
	} else {
		return undefined
	}
}

function delay(ms: number): Promise<void> {
	return new Promise(function(resolve) {
		setTimeout(resolve, ms)
	})
}
  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ignoreUntilDone<T extends(...args: any[]) => Promise<void>>(func: T): T {
	let inflight = false
	return async function(...args) {
		if (inflight) {
			console.log('NN Blocked')
			return
		}
		console.log('NN Permitted')
		inflight = true

		try {
			// await delay(1000)
			await func(...args)
		} finally {
			inflight = false
		}
	} as T
}
