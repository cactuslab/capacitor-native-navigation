import { ModalConfig, NativeNavigationNavigationState, Path } from './types'
import { pathToRegexp } from 'path-to-regexp'

/**
 * Find the modal config, if any, that matches the given path.
 *
 * The path can be a full href, including a search string and a hash. Modal configs match the
 * pathname only, so a query string or a hash must not prevent a match.
 */
export function findModalConfig(path: string, modals: ModalConfig[] | undefined): ModalConfig | undefined {
	if (!modals) {
		return undefined
	}

	const { pathname } = parsePath(path)

	for (const aModal of modals) {
		if (typeof aModal.path === 'string') {
			if (pathToRegexp(aModal.path).regexp.test(pathname)) {
				return aModal
			}
		} else if (Array.isArray(aModal.path)) {
			for (const aModalPath of aModal.path) {
				if (pathToRegexp(aModalPath).regexp.test(pathname)) {
					return aModal
				}
			}
		} else if (aModal.path instanceof RegExp) {
			if (aModal.path.test(pathname)) {
				return aModal
			}
		}
	}
	return undefined
}

export function parsePath(path: string): Path {
	const result: Path = {
		pathname: path,
		search: '',
		hash: '',
	}

	/* Look for the hash first, as React Router's own parsePath does, so a `?` that occurs
	   inside the hash is not mistaken for the start of the search string. */
	const h = result.pathname.indexOf('#')
	if (h !== -1) {
		result.hash = result.pathname.substring(h)
		result.pathname = result.pathname.substring(0, h)
	}

	const s = result.pathname.indexOf('?')
	if (s !== -1) {
		result.search = result.pathname.substring(s)
		result.pathname = result.pathname.substring(0, s)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ignoreUntilDone<T extends(...args: any[]) => Promise<void>>(func: T): T {
	let inflight = false
	return async function(...args) {
		if (inflight) {
			return
		}
		inflight = true

		try {
			await func(...args)
		} finally {
			inflight = false
		}
	} as T
}
