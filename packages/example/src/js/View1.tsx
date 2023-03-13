import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function View1(): JSX.Element {
	const { dismiss } = useNativeNavigationContext()
	const location = useLocation()
	const [got, setGot] = useState('')

	const handleDismiss = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		dismiss({})
	}, [])

	const handleReset = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		NativeNavigation.reset()
	}, [])

	async function handleGet(evt: React.MouseEvent) {
		evt.preventDefault()
		const got = await NativeNavigation.get()
		setGot(JSON.stringify(got, undefined, 2))
	}

	useEffect(function() {
		return function() {
			alert('View1 has been unmounted')
		}
	}, [])
	
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
			<p><button onClick={handleGet}>Get state</button></p>
			<p><Link to="/stack1">Go to Stack 1</Link></p>
			{got && (
				<pre>{got}</pre>
			)}
		</div>
	)
}
