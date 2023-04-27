import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StackImmediatePush(): JSX.Element {
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
		navigate('/stack2')

		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [])

	return (
		<div>
			<h1>Stack immediate push</h1>
			<p>This view immediately pushes on a new view when it first appears, which tests race conditions on creation of a stack.</p>
		</div>
	)
}
