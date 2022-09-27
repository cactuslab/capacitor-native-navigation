import { NativeNavigation } from 'native-navigation'
import React from 'react'

export default function App(): JSX.Element {

	async function handle1() {
		const { stack, viewId } = await NativeNavigation.push({
			path: 'button'
		})
		console.log('pushed', stack, viewId)
	}

	console.log('rendered app')
	return (
		<div>
			<h1>Hello World</h1>
			<button onClick={handle1}>Push</button>
		</div>
	)
}
