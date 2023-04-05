import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StackImmediateReplace(): JSX.Element {
	const navigate = useNavigate()
	const { update, addClickListener } = useNativeNavigationContext()

	useEffect(function() {
		update({
			stack: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					}
				]
			}
		})
		navigate('/stack2', {
			replace: true,
		})

		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [])

	return (
		<div>
			<h1>Stack immediate replace</h1>
			<p>This view immediately replaces itself with a new view when it first appears, which tests race conditions on creation of a stack.</p>
		</div>
	)
}
