import { NativeNavigation } from 'native-navigation'
import React from 'react'

export default function App(props: {
	path: string
}): JSX.Element {
	const { path } = props

	async function handle1() {
		const { id: viewId } = await NativeNavigation.create({
			type: 'view',
			path: '/button',
		})
		const { stack } = await NativeNavigation.push({
			id: viewId,
			stack: 'rootStack',
		})
		console.log('pushed', stack, viewId)
	}

	return (
		<div>
			<h1>Hello World</h1>
			<p>{path}</p>
			<button onClick={handle1}>Push</button>
		</div>
	)
}
