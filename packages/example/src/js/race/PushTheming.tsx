import { NativeNavigation, ViewUpdate } from 'capacitor-native-navigation'
import { useNativeNavigationViewContext } from 'capacitor-native-navigation-react'
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Route, useNavigate } from 'react-router-dom'
import TallContent from '../examples/TallContent';


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
		navigate('/race/push-theming/red')
	}, [navigate])
	
	const handleGreen = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/race/push-theming/green')
	}, [navigate])
	
	const handleBlue = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		navigate('/race/push-theming/blue')
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
	
	const [stackItem, setStackItem] = useState<ViewUpdate>({
		stackItem: {
			rightItems: [
				{
					id: 'reset',
					title: 'Reset',
				},
			],
			bar: {
				background: {
					color: '#b0c9ffff',
				},
				buttons: {
					color: '#0000ff',
				},
				title: {
					color: '#0000ff',
				}
			},
		},
		title: 'Blue',
	})

	useEffect(function() {
		updateView(stackItem)
	}, [stackItem, updateView])
	

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
			if (viewWindow.scrollY > 100) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};

		viewWindow.addEventListener("scroll", handleScroll);
		return () => viewWindow.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
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
							color: '#b0c9ffff',
						},
						title: {
							color: '#b0c9ffff',
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
					// android: {
					// 	elevatedColor: {
					// 		color: '#80ff9f',
					// 	},
					// }
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
