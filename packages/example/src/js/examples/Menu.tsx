import { useNativeNavigationContext } from '@cactuslab/native-navigation-react'
import React from 'react'
import menu from '../../assets/imgs/menu.png'

export default function Menu() {
	const { setOptions } = useNativeNavigationContext()

	setOptions({
		stack: {
			rightItems: [
				{
					id: 'menu',
					title: 'Menu',
					image: menu,
				}
			]
		}
	})
	return (
		<div>
			<h1>Menu</h1>
		</div>
	)
}
