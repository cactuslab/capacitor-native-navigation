import React, { useRef } from 'react'
import { AnyComponentSpec, ComponentAlias, NativeNavigation, PresentationStyle } from '@cactuslab/native-navigation'
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

function leafComponentAlias(spec: AnyComponentSpec): string | undefined {
	if (spec.type === 'stack') {
		if (spec.components.length) {
			return leafComponentAlias(spec.components[0])
		}
	} else if (spec.type === 'tabs') {
		if (spec.tabs.length) {
			return leafComponentAlias(spec.tabs[0].component)
		}
	}
	return spec.alias
}

function updateLeafComponentAlias<T extends AnyComponentSpec>(spec: T, alias: string): T {
	if (spec.type === 'stack') {
		if (spec.components.length) {
			return {
				...spec,
				components: [
					updateLeafComponentAlias(spec.components[spec.components.length - 1], alias),
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
						component: updateLeafComponentAlias(spec.tabs[0].component, alias),
					},
					...spec.tabs.slice(1),
				],
			}
		}
	}

	return {
		...spec,
		alias,
	}
}

function updateModalComponentAliases<T extends AnyComponentSpec>(spec: T, alias: string): T {
	const result = updateLeafComponentAlias(spec, alias)
	if (!result.alias) {
		result.alias = `${alias}_root`
	}
	return result
}

interface InternalModalState {
	presented?: boolean
	shouldDismiss?: boolean
	viewListenerUnsubscribe?: ReactViewListenerUnsubscribeFunc
}

/**
 * A component that renders its children inside a native modal view.
 */
export default function NativeNavigationModal(props: React.PropsWithChildren<NativeNavigationModalProps>) {
	const { children, component, presentationStyle: style, animated, cancellable, debounce, open, onClose } = props
	const viewAlias = useMemo(function() {
		return leafComponentAlias(component) || `_modal${nextModalId++}` 
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) /* We don't want to change the view id if the component changes as we ignore component changes in the useEffect */

	const componentWithAliases = useMemo(function() {
		return updateModalComponentAliases(component, viewAlias)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [viewAlias])

	const { fireViewReady, addViewsListener } = useNativeNavigation()

	/* Our internal state is a ref so that multiple invocations of useEffect (which happens in development https://react.dev/reference/react/useEffect#examples-dependencies)
	   can record that we're no longer unmounted.
	 */
	const stateHolder = useRef<InternalModalState>({})

	useEffect(function() {
		const state = stateHolder.current
		let debounceTimer: NodeJS.Timeout | undefined

		async function createModal() {
			state.presented = true

			try {
				await NativeNavigation.present({
					component: componentWithAliases,
					style,
					animated,
					cancellable,
				})
			} catch (error) {
				console.log('NativeNavigationModal failed to present', viewAlias, error)
				return
			}

			if (state.shouldDismiss) {
				dismissModal()
			} else {
				state.viewListenerUnsubscribe = addViewsListener(function(view, event) {
					if (view.alias === viewAlias && event === 'remove') {
						state.presented = false
						onClose?.()
					}
				})
			}
		}

		function dismissModal() {
			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}

			if (state.presented) {
				state.presented = false

				NativeNavigation.dismiss({
					id: componentWithAliases.alias,
				}).then(function() {
					onClose?.()
				}).catch(function(reason: unknown) {
					console.log('NativeNavigationModal failed to dismiss', viewAlias, reason)
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
			} else if (!state.presented) {
				createModal()
			}
		}

		return function() {
			state.shouldDismiss = true

			dismissModal()
			state.viewListenerUnsubscribe?.()
			state.viewListenerUnsubscribe = undefined
		}

		/* We don't want to dismiss this once it has been presented, even if the component options change, because it will look weird */
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	const view = useNativeNavigationView(viewAlias)

	useEffect(function() {
		if (view) {
			fireViewReady(view.id)
		}
	}, [fireViewReady, view])

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
