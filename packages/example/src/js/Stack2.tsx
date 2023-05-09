import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import React, { useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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
			style: 'pageSheet',
			animated: true,
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

	const { addClickListener, addViewWillAppearListener, addViewDidAppearListener, addViewWillDisappearListener, addViewDidDisappearListener } = useNativeNavigationViewContext()

	useEffect(function() {
		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener])

	useEffect(function() {
		return addViewWillAppearListener(() => {
			console.log('Stack2 received viewWillAppear')
		})
	}, [addViewWillAppearListener])
	useEffect(function() {
		return addViewDidAppearListener(() => {
			console.log('Stack2 received viewDidAppear')
		})
	}, [addViewDidAppearListener])
	useEffect(function() {
		return addViewWillDisappearListener(() => {
			console.log('Stack2 received viewWillDisappear')
		})
	}, [addViewWillDisappearListener])
	useEffect(function() {
		return addViewDidDisappearListener(() => {
			console.log('Stack2 received viewDidDisappear')
		})
	}, [addViewDidDisappearListener])

	return (
		<div>
			<h1>Stack Screen 2</h1>
			<p><button onClick={handleShowModal}>Show next in modal</button></p>
			<p><button onClick={handlePush}>Push next</button></p>
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
			<p><Link to="/view1">Link</Link></p>
		</div>
	)
}
