import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

let counter = 1

export default function Stack1(): JSX.Element {
	const { updateView, addClickListener } = useNativeNavigationViewContext()
	const navigate = useNavigate()

	const [toolbarVisible, setToolbarVisible] = useState(true)
	const [backEnabled, setBackEnabled] = useState(true)

	const handleChangeTitle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		updateView({
			title: `Changed title ${counter++}`,
		})
	}, [updateView])

	const handleRemoveTitle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		updateView({
			title: null,
		})
	}, [updateView])

	const handlePush = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/stack2')
	}, [navigate])

	const handlePushSelf = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/stack1')
	}, [navigate])

	const handlePushWithState = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/state', {
			state: {
				counter: counter++,
			},
		})
	}, [navigate])

	const handleToolbarToggle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()

		setToolbarVisible(!toolbarVisible)
	}, [toolbarVisible])

	const handleBackEnabledToggle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		setBackEnabled(!backEnabled)
	}, [backEnabled])

	useEffect(() => {
		updateView({
			stackItem: {
				bar: {
					visible: toolbarVisible,
				},
			},
			animated: true,
		})
	}, [toolbarVisible, updateView])

	useEffect(() => {
		updateView({
			stackItem: {
				backEnabled: backEnabled,
			},
			animated: true,
		})
	}, [backEnabled, updateView])

	const handleReplace1 = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/stack2', {
			replace: true,
		})
	}, [navigate])

	useEffect(function() {
		updateView({
			title: 'Stack One',
			stackItem: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					},
				],
			},
		})

		return addClickListener(function(data) {
			if (data.buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener, updateView])

	return (
		<div>
			<h1>Stack 1</h1>
			<p>This is the root of the stack. The title of this view was defined when the stack was created.</p>
			<h2>Title</h2>
			<p><button onClick={handleChangeTitle}>Change Title</button> <button onClick={handleRemoveTitle}>Remove Title</button> </p>
			<h2>Toolbar</h2>
			<p><button onClick={handleToolbarToggle}>{toolbarVisible ? 'Hide Toolbar' : 'Show Toolbar'}</button> <button onClick={handleBackEnabledToggle}>{backEnabled ? 'Disable Back' : 'Enable Back'}</button></p>
			<h2>Navigation</h2>
			<p><button onClick={handlePushSelf}>Push Stack 1 (this)</button> <button onClick={handlePush}>Push Stack 2 (new)</button> <button onClick={handlePushWithState}>Push with State</button></p>
			<p><button onClick={handleReplace1}>Replace with Stack 2</button></p>
			<ul>
				<li><Link to="/stack1">Push Stack 1</Link></li>
				<li><Link to="/stack2">Push Stack 2</Link></li>
				<li><Link to="/state" state={{ fromLink: true }}>Push with State</Link></li>
				<li><Link to="/modal/">Link to modal</Link></li>
			</ul>
			
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</div>
	)
}
