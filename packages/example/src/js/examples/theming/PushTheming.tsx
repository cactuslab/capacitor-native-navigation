import { NativeNavigation, ViewUpdate } from 'capacitor-native-navigation'
import { useNativeNavigationViewContext } from 'capacitor-native-navigation-react'
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Route, useNavigate } from 'react-router-dom'
import TallContent from '../TallContent';

import './PushTheming.css'

/**
 * A helper component that sets a data attribute on the body element of the view window.
 * 
 * We use this to set a `theme` attribute on the body element to allow the CSS to change the `background-color` based on the theme.
 * 
 * The `background-color` of the body element is used when the scroll view bounces beyond the top or bottom which is
 * the default behavior on iOS. 
 * 
 * It is important to use the viewWindow from the context to ensure that the correct window is updated which is
 * why it is useful to create a helper like this to avoid mistakes.
 */
const SetBodyAttribute: React.FC<{ attribute: string; value: string | null }> = ({ attribute, value }) => {
	const context = useNativeNavigationViewContext()
	useLayoutEffect(() => {
		const attrName = `data-${attribute}`;
		
		if (value !== null) {
			context.viewWindow.document.body.setAttribute(attrName, value);
		} else {
			context.viewWindow.document.body.removeAttribute(attrName);
		}
		
		// Cleanup function to remove the attribute when the component unmounts
		return () => {
			context.viewWindow.document.body.removeAttribute(attrName);
		};
	}, [attribute, value]); // Dependencies to re-run effect if these change
	
	return null; // No UI rendering
}

export default function PushTheming(): JSX.Element {
	return (
		<Route path="push-theming">
			<Route path="red" element={<PushRed />} />
			<Route path="green" element={<PushGreen />} />
			<Route path="blue" element={<PushBlue />} />
		</Route>
	)
}

function ThemeButtons(): JSX.Element {
	const navigate = useNavigate()
	
	const handleRed = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('../red')
	}, [navigate])
	
	const handleGreen = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('../green')
	}, [navigate])
	
	const handleBlue = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('../blue')
	}, [navigate])
	
	return (
		<div>
			<button onClick={handleRed}>Push Red</button>
			<button onClick={handleGreen}>Push Green</button>
			<button onClick={handleBlue}>Push Blue</button>
		</div>
	)
}

function PushRed(): JSX.Element {
	const navigate = useNavigate()
	const { updateView, addClickListener } = useNativeNavigationViewContext()
	
	useEffect(function() {
		updateView({
			stackItem: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					},
				],
				bar: {
					background: {
						color: '#ffe0e0',
					},
					buttons: {
						color: '#ff0000',
					},
					iOS: {
						hideShadow: true,
					},
				},
			},
			title: 'Red',
		})
		
		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener, navigate, updateView])
	
	return (
		<div>
			<SetBodyAttribute attribute="theme" value="red" />
			<h1>Red</h1>
			<p>This is the red themed navigation bar</p>
			<ThemeButtons />
			<TallContent />
		</div>
	)
}

function PushBlue(): JSX.Element {
	const navigate = useNavigate()
	const { updateView, addClickListener, viewWindow } = useNativeNavigationViewContext()
	
	useEffect(function() {		
		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener, navigate])
	
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (viewWindow.scrollY > 10) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};

		viewWindow.addEventListener("scroll", handleScroll);
		return () => viewWindow.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		const stackItem: ViewUpdate = {
			stackItem: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					},
				],
				bar: {
					background: {
						color: '#e0e0ff',
					},
					buttons: {
						color: '#0000ff',
					},
					title: {
						color: '#0000ff',
					},
					iOS: {
						hideShadow: true,
					}
				},
			},
			title: 'Blue',
		}

		if (isScrolled) {
			updateView({
				...stackItem,
				stackItem: {
					...stackItem.stackItem,
					bar: {
						background: {
							color: '#0000ff',
						},
						buttons: {
							color: '#b0c9ff',
						},
						title: {
							color: '#b0c9ff',
						}
					},
				},
				animated: true,
			})
		} else {
			updateView({
				...stackItem,
				animated: true,
			})
		}
	}, [isScrolled]);
  
	return (
		<div>
			<SetBodyAttribute attribute="theme" value="blue" />
			<h1>Blue</h1>
			<p>This is the blue themed navigation bar</p>
			<ThemeButtons />
			<TallContent />
		</div>
	)
}

function PushGreen(): JSX.Element {
	const navigate = useNavigate()
	const { updateView, addClickListener } = useNativeNavigationViewContext()
	
	useEffect(function() {
		updateView({
			stackItem: {
				rightItems: [
					{
						id: 'reset',
						title: 'Reset',
					},
				],
				bar: {
					background: {
						color: '#b0ffd3',
					},
					buttons: {
						color: '#425f4f',
					},
				},
				
			},
			title: 'Green',
		})
		
		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener, navigate, updateView])
	
	return (
		<div>
		<SetBodyAttribute attribute="theme" value="green" />
		<h1>Green</h1>
		<p>This is the green themed navigation bar</p>
		<ThemeButtons />
		<TallContent />
		</div>
	)
}
