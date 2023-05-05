import React from 'react'
import { useLocation } from 'react-router-dom'

export default function PageWithState(): JSX.Element {
	const location = useLocation()

	return (
		<div>
			<h1>Page with state</h1>
			<p>This page demonstrates that routing state is passed to a new screen.</p>
			<p>State is:</p>
			<pre>
				{location.state ? JSON.stringify(location.state) : 'NONE'}
			</pre>
		</div>
	)
}
