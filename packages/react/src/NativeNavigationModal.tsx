import React, { useRef } from 'react'
import { AnyComponentSpec, NativeNavigation, PresentResult, PresentationStyle } from '@cactuslab/native-navigation'
import { useNativeNavigation, useNativeNavigationView } from './internal'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { NativeNavigationViewContextProvider } from './context'
import { ReactViewListenerUnsubscribeFunc } from './types'

export interface NativeNavigationModalProps {
	open?: boolean
	onClose?: () => void
	component: AnyComponentSpec
	presentationStyle?: PresentationStyle
	animated?: boolean
	cancellable?: boolean
	debounce?: number
}

let nextModalId = 0

function leafComponentId(spec: AnyComponentSpec): string | undefined {
	if (spec.type === 'stack') {
		if (spec.components.length) {
			return leafComponentId(spec.components[0])
		}
	} else if (spec.type === 'tabs') {
		if (spec.tabs.length) {
			return leafComponentId(spec.tabs[0].component)
		}
	}
	return spec.id
}

function updateLeafComponentId<T extends AnyComponentSpec>(spec: T, id: string): T {
	if (spec.type === 'stack') {
		if (spec.components.length) {
			return {
				...spec,
				components: [
					updateLeafComponentId(spec.components[spec.components.length - 1], id),
					...spec.components.slice(1),
				],
			}
		}
	} else if (spec.type === 'tabs') {
		if (spec.tabs.length) {
			return {
				...spec,
				tabs: [
					{
						...spec.tabs[0],
						component: updateLeafComponentId(spec.tabs[0].component, id),
					},
					...spec.tabs.slice(1),
				],
			}
		}
	}

	return {
		...spec,
		id,
	}
}

interface InternalModalState {
	presentedId?: string
	shouldDismiss?: boolean
	viewListenerUnsubscribe?: ReactViewListenerUnsubscribeFunc
}

/**
 * A component that renders its children inside a native modal view.
 */
export default function NativeNavigationModal(props: React.PropsWithChildren<NativeNavigationModalProps>) {
	const { children, component, presentationStyle: style, animated, cancellable, debounce, open, onClose } = props
	const viewId = useMemo(function() {
		return leafComponentId(component) || `_modal${nextModalId++}` 
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) /* We don't want to change the view id if the component changes as we ignore component changes in the useEffect */

	const { fireViewReady, addViewsListener } = useNativeNavigation()

	/* Our internal state is a ref so that multiple invocations of useEffect (which happens in development https://react.dev/reference/react/useEffect#examples-dependencies)
	   can record that we're no longer unmounted.
	 */
	const stateHolder = useRef<InternalModalState>({})

	useEffect(function() {
		const state = stateHolder.current
		let debounceTimer: NodeJS.Timeout | undefined

		async function createModal() {
			let result: PresentResult
			try {
				result = await NativeNavigation.present({
					component: updateLeafComponentId(component, viewId),
					style,
					animated,
					cancellable,
				})
			} catch (error) {
				console.log('NativeNavigationModal failed to present', viewId, error)
				return
			}

			state.presentedId = result.id

			if (state.shouldDismiss) {
				dismissModal()
			} else {
				state.viewListenerUnsubscribe = addViewsListener(function(view, event) {
					if (view.id === result.id && event === 'remove') {
						state.presentedId = undefined
						onClose?.()
					}
				})
			}
		}

		function dismissModal() {
			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}

			// eslint-disable-next-line react-hooks/exhaustive-deps
			const presentedId = state.presentedId
			if (presentedId) {
				state.presentedId = undefined

				NativeNavigation.dismiss({
					id: presentedId,
				}).then(function() {
					onClose?.()
				}).catch(function(reason: unknown) {
					console.log('NativeNavigationModal failed to dismiss', viewId, reason)
				})
			}
		}

		if (open === false) {
			state.shouldDismiss = true
			dismissModal()
		} else {
			state.shouldDismiss = false

			if (debounce) {
				debounceTimer = setTimeout(createModal, debounce)
			} else if (!state.presentedId) {
				createModal()
			}
		}

		return function() {
			state.shouldDismiss = true

			if (state.presentedId) {
				dismissModal()
			}
			state.viewListenerUnsubscribe?.()
			state.viewListenerUnsubscribe = undefined
		}

		/* We don't want to dismiss this once it has been presented, even if the component options change, because it will look weird */
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	const view = useNativeNavigationView(viewId)

	useEffect(function() {
		if (view) {
			fireViewReady(viewId)
		}
	}, [fireViewReady, view, viewId])

	if (view) {
		return createPortal(
			(
				<NativeNavigationViewContextProvider {...view.props}>
					{children}
				</NativeNavigationViewContextProvider>
			),
			view.element)
	} else {
		return null
	}
}
