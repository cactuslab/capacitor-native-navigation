import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
import React, { useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

let counter = 1

export default function StackImmediatePush(): JSX.Element {
	const navigate = useNavigate()

	useEffect(function() {
		navigate('/stack2')
	}, [])

	return (
		<div>
			<h1>Stack immediate push</h1>
			<p>This view immediately pushes on a new view when it first appears, which tests race conditions on creation of a stack.</p>
		</div>
	)
}
