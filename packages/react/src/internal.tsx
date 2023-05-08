import React, { useContext, useEffect, useState } from 'react'
import { NativeNavigationReact } from './types'

const DEFAULT_CONTEXT: NativeNavigationReact = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	plugin: null as any,
	views() {
		throw new Error('Not inside NativeNavigationProvider')
	},
	addViewsListener() {
		throw new Error('Not inside NativeNavigationProvider')
	},
	fireViewReady() {
		throw new Error('Not inside NativeNavigationProvider')
	},
}

export const InternalContext = React.createContext<NativeNavigationReact>(DEFAULT_CONTEXT)

export const InternalContextProvider = InternalContext.Provider

export function useNativeNavigation(): NativeNavigationReact {
	return useContext(InternalContext)
}

export function useNativeNavigationView(id?: string): HTMLElement | undefined {
	const nativeNavigationReact = useNativeNavigation()
	const [, setCounter] = useState(0)

	/* Subscribe to changes */
	useEffect(function() {
		if (id) {
			return nativeNavigationReact.addViewsListener(function(changedId) {
				if (id === changedId) {
					setCounter(counter => counter + 1)
				}
			})
		}
	}, [id, nativeNavigationReact])

	if (!id) {
		return undefined
	} else {
		const views = nativeNavigationReact.views()
		return views[id]?.element
	}
}