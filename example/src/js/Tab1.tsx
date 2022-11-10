import { useNativeNavigationContext } from 'native-navigation/react'
import React, { useCallback } from 'react'

let badgeCounter = 1

export default function Tab1(): JSX.Element {
	const { setOptions } = useNativeNavigationContext()

	const handleUpdateBadge = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		setOptions({
			tab: {
				badgeValue: `${badgeCounter++}`,
			}
		})
	}, [])

	return (
		<div>
			<h1>Tab 1</h1>
			<p><button onClick={handleUpdateBadge}>Update Badge</button></p>
		</div>
	)
}
