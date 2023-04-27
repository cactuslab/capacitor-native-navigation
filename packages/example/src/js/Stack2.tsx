import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
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

	const { addViewWillAppearListener, addViewDidAppearListener, addViewWillDisappearListener, addViewDidDisappearListener } = useNativeNavigationContext()

	useEffect(function() {
		return addViewWillAppearListener(() => {
			console.log('Stack2 received viewWillAppear')
		})
	}, [])
	useEffect(function() {
		return addViewDidAppearListener(() => {
			console.log('Stack2 received viewDidAppear')
		})
	}, [])
	useEffect(function() {
		return addViewWillDisappearListener(() => {
			console.log('Stack2 received viewWillDisappear')
		})
	}, [])
	useEffect(function() {
		return addViewDidDisappearListener(() => {
			console.log('Stack2 received viewDidDisappear')
		})
	}, [])

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
