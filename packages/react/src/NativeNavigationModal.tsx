import React from 'react'
import { AnyComponentSpec, NativeNavigation, PresentationStyle } from '@cactuslab/native-navigation'
import { useNativeNavigation, useNativeNavigationView } from './internal'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { NativeNavigationViewContextProvider } from './context'

interface NativeNavigationModalProps {
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

/**
 * A component that renders its children inside a native modal view.
 */
export default function NativeNavigationModal(props: React.PropsWithChildren<NativeNavigationModalProps>) {
	const { children, component, presentationStyle: style, animated, cancellable, debounce } = props
	const viewId = useMemo(function() {
		return leafComponentId(component) || `_modal${nextModalId++}` 
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) /* We don't want to change the view id if the component changes as we ignore component changes in the useEffect */

	useEffect(function() {
		const state: {
			presentedId?: string
			unmounted?: boolean
		} = {}

		async function createModal() {
			const result = await NativeNavigation.present({
				component: updateLeafComponentId(component, viewId),
				style,
				animated,
				cancellable,
			})

			state.presentedId = result.id

			if (state.unmounted) {
				/* We have been unmounted before presenting the modal completed */
				NativeNavigation.dismiss({
					id: result.id,
				})
			}
		}

		let debounceTimer: NodeJS.Timeout | undefined
		if (debounce) {
			debounceTimer = setTimeout(createModal, debounce)
		} else {
			createModal()
		}

		return function() {
			state.unmounted = true

			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}

			if (state.presentedId) {
				NativeNavigation.dismiss({
					id: state.presentedId,
				})
			}
		}
		/* We don't want to dismiss this once it has been presented, even if the component options change, because it will look weird */
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const view = useNativeNavigationView(viewId)
	const { fireViewReady } = useNativeNavigation()

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
