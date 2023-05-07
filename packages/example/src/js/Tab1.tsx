import { useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import React, { useCallback } from 'react'

let badgeCounter = 1

export default function Tab1(): JSX.Element {
	const { updateTab } = useNativeNavigationViewContext()

	const handleUpdateBadge = useCallback(function(evt: React.MouseEvent) {
		evt.preventDefault()
		updateTab({
			badgeValue: `${badgeCounter++}`,
		})
	}, [])

	return (
		<div>
			<h1>Tab 1</h1>
			<p><button onClick={handleUpdateBadge}>Update Badge</button></p>
		</div>
	)
}
