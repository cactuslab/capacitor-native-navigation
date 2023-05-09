import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StackImmediateReplace(): JSX.Element {
	const navigate = useNavigate()
	const { updateView, addClickListener } = useNativeNavigationViewContext()

	useEffect(function() {
		updateView({
			stackItem: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					},
				],
			},
		})
		navigate('/race/stack-immediate-replace2', {
			replace: true,
		})

		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener, navigate, updateView])

	return (
		<div>
			<h1>Stack immediate replace</h1>
			<p>This view immediately replaces itself with a new view when it first appears, which tests race conditions on creation of a stack.</p>
		</div>
	)
}

export function StackImmediateReplace2() {
	const { updateView, addClickListener } = useNativeNavigationViewContext()

	useEffect(function() {
		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener, updateView])

	return (
		<div>
			<h1>Stack immediate replace</h1>
			<p>This is the view you should see.</p>
		</div>
	)
}
