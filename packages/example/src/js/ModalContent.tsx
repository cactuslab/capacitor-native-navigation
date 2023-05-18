import { useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import React from 'react'

export function ModalContent() {
	const { componentId, dismiss } = useNativeNavigationViewContext()
	return (
		<>
			<h1>Hello World</h1>
			<p>Component id: {componentId || 'Not in native navigation'}</p>
			<button onClick={evt => dismiss()}>Dismiss</button>
		</>
	)
}
