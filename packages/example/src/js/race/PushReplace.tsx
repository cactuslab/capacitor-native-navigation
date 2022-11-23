import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
import React, { useEffect } from 'react'
import { Route, useNavigate } from 'react-router-dom'

export default function PushReplace(): JSX.Element {
	return (
		<Route path="push-replace">
			<Route path="one" element={<PushReplace1 />} />
			<Route path="two" element={<PushReplace2 />} />
			<Route path="three" element={<PushReplace3 />} />
		</Route>
	)
}

function PushReplace1(): JSX.Element {
	const navigate = useNavigate()
	const { setOptions, addClickListener } = useNativeNavigationContext({})

	useEffect(function() {
		setOptions && setOptions({
			stack: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					}
				]
			}
		})
		navigate('/race/push-replace/two')

		return addClickListener && addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [])

	return (
		<div>
			<h1>Push Replace 1</h1>
			<p>Pushes to a new component.</p>
		</div>
	)
}

function PushReplace2(): JSX.Element {
	const navigate = useNavigate()

	useEffect(function() {
		navigate('/race/push-replace/three', {
			replace: true,
		})
	}, [])

	return (
		<div>
			<h1>Push Replace 2</h1>
			<p>Replaces to the next component.</p>
		</div>
	)
}

function PushReplace3(): JSX.Element {
	return (
		<div>
			<h1>Push Replace 3</h1>
			<p>This is the component you should see.</p>
		</div>
	)
}
