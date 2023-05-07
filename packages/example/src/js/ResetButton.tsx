import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import { useEffect } from 'react'

/**
 * Add a reset button to the stack bar.
 */
export default function ResetButton() {
	const { update, addClickListener } = useNativeNavigationViewContext()

	useEffect(function() {
		update({
			stack: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					},
				],
			},
		})

		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [])

	return null
}
