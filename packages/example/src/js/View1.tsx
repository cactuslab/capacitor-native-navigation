import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation/react'
import React, { useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function View1(): JSX.Element {
	const { dismiss } = useNativeNavigationContext()
	const location = useLocation()

	const handleDismiss = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		dismiss({})
	}, [])

	const handleReset = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		NativeNavigation.reset()
	}, [])

	useEffect(function() {
		return function() {
			alert('View1 has been unmounted')
		}
	})
	
	return (
		<div>
			<h1>View 1</h1>
			{location.state?.modal ? (
				<>
					<p>This view was shown in a modal so you can dismiss it.</p>
					<p><button onClick={handleDismiss}>Dismiss</button></p>
				</>
			) : (
				<>
					<p>This view was NOT shown in a modal.</p>
				</>
			)}
			<h2>Unmounting</h2>
			<p>Note that this view will show an alert when it is UNMOUNTED, so if it doesn't alert there is a fault!</p>
			<p><button onClick={handleReset}>Reset</button></p>
		</div>
	)
}
