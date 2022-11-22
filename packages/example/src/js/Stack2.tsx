import { NativeNavigation } from '@cactuslab/native-navigation'
import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Stack2(): JSX.Element {
	const navigate = useNavigate()
	
	const handleShowModal = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()

		NativeNavigation.present({
			component: {
				type: 'view',
				path: '/view1',
				state: {
					modal: true,
				},
			},
			animated: true
		})
	}, [])

	const handlePush = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()

		NativeNavigation.push({
			component: {
				type: 'view',
				path: '/view1',
			},
		})
	}, [])

	return (
		<div>
			<h1>Stack Screen 2</h1>
			<p><button onClick={handleShowModal}>Show next in modal</button></p>
			<p><button onClick={handlePush}>Push next</button></p>
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</div>
	)
}
