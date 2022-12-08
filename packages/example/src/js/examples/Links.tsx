import React, { useCallback } from 'react'
import ResetButton from '../ResetButton'

export default function Links() {
	const handleChangeLocation = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		window.location.assign('https://cactuslab.com')
	}, [])

	return (
		<div>
			<ResetButton />
			<h1>Links</h1>
			<h2>External Services</h2>
			<p>These links should trigger the relevant external apps when used on a device:</p>
			<p><a href="mailto:test@example.com">Send email</a></p>
			<p><a href="tel:555-1234">Phone a friend</a></p>

			<h2>External Websites</h2>
			<p>This website is not included in Capacitor's <code>allowNavigation</code> so it will open in a browser:</p>
			<p><a href="https://www.google.com">Open in browser</a></p>
			<p>This website is included in Capacitor's <code>allowNavigation</code> so it will open in the app in the current native view:</p>
			<p><a href="https://cactuslab.com">Open in app</a></p>
			<p>This button triggers the navigation on Capacitor's window, resetting the NativeNavigation UI:</p>
			<p><button onClick={handleChangeLocation}>Open in root of app</button></p>
		</div>
	)
}
