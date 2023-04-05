import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

let counter = 1

export default function Stack1(): JSX.Element {
	const { setOptions, addClickListener } = useNativeNavigationContext()
	const navigate = useNavigate()

	const [toolbarVisible, setToolbarVisible] = useState(true)
	const [backEnabled, setBackEnabled] = useState(true)

	const handleChangeTitle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		setOptions({
			title: `Changed title ${counter++}`,
		})
	}, [])

	const handleRemoveTitle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		setOptions({
			title: null,
		})
	}, [])

	const handlePush = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/stack2')
	}, [])

	const handlePushSelf = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/stack1')
	}, [])

	const handlePushWithState = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/state', {
			state: {
				counter: counter++,
			},
		})
	}, [])

	const handleToolbarToggle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()

		setToolbarVisible(!toolbarVisible)
	}, [toolbarVisible])

	const handleBackEnabledToggle = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		setBackEnabled(!backEnabled)
	}, [backEnabled])

	useEffect(() => {
		setOptions({
			stack: {
				bar: {
					visible: toolbarVisible
				},
			},
			animated: true
		})
	}, [toolbarVisible])

	useEffect(() => {
		setOptions({
			stack: {
				backEnabled: backEnabled,
			},
			animated: true
		})
	}, [backEnabled])

	const handleReplace1 = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/stack2', {
			replace: true,
		})
	}, [])

	useEffect(function() {
		setOptions({
			title: "Stack One",
			stack: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					}
				]
			}
		})

		return addClickListener(function(data) {
			if (data.buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [])

	return (
		<div>
			<h1>Stack root</h1>
			<p>This is the root of the stack. The title of this view was defined when the stack was created.</p>
			<p><button onClick={handleChangeTitle}>Change Title</button> <button onClick={handleRemoveTitle}>Remove Title</button> </p>
			<p><button onClick={handlePush}>Push New</button> <button onClick={handlePushSelf}>Push Same</button> <button onClick={handlePushWithState}>Push With State</button></p>
			<p><button onClick={handleToolbarToggle}>{toolbarVisible ? "Hide Toolbar" : "Show Toolbar"}</button> <button onClick={handleBackEnabledToggle}>{backEnabled ? "Disable Back" : "Enable Back"}</button></p>
			<h2>Replace</h2>
			<p><button onClick={handleReplace1}>Replace 1</button></p>
			<h2>Links</h2>
			<p><Link to="/stack2">Push New</Link> <Link to="/stack1">Push Same</Link> <Link to="/state" state={{fromLink: true}}>Push With State</Link></p>
			<p><Link to="/modal/">Link to modal</Link></p>
			
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</div>
	)
}
