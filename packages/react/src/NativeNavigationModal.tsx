import { AnyComponentSpec, NativeNavigation, PresentationStyle } from '@cactuslab/native-navigation'
import { useNativeNavigationView } from './internal'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface NativeNavigationModalProps {
	component: AnyComponentSpec
	presentationStyle?: PresentationStyle
	animated?: boolean
	cancellable?: boolean
}

/**
 * A component that renders its children inside a native modal view.
 */
export default function NativeNavigationModal(props: React.PropsWithChildren<NativeNavigationModalProps>) {
	const { children, component, presentationStyle: style, animated, cancellable } = props
	const [viewId, setViewId] = useState<string>()

	useEffect(function() {
		const state: {
			presentedId?: string
			unmounted?: boolean
		} = {}

		async function createModal() {
			const result = await NativeNavigation.present({
				component,
				style,
				animated,
				cancellable,
			})

			let viewId: string | undefined
			const got = await NativeNavigation.get({ id: result.id })
			if (got.component && got.component.type === 'stack') {
				viewId = got.component.components[got.component.components.length - 1].id
			} else if (got.component && got.component.type === 'view') {
				viewId = got.component.id
			}

			setViewId(viewId)
			state.presentedId = result.id

			if (state.unmounted) {
				/* We have been unmounted before presenting the modal completed */
				NativeNavigation.dismiss({
					id: result.id,
				})
			}
		}

		createModal()

		return function() {
			state.unmounted = true
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
	if (!view) {
		return null
	}

	return createPortal(children, view)
}
