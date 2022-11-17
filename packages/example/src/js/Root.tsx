import { NativeNavigation } from '@cactuslab/native-navigation'
import { createNavigator } from '@cactuslab/native-navigation-react-router'
import {  Route, Router, Routes } from 'react-router-dom'

import PageWithState from './PageWithState'
import Stack1 from './Stack1'
import Stack2 from './Stack2'
import Tab1 from './Tab1'
import View1 from './View1'

interface Props {
	path: string
	state?: unknown
	id: string
}

const navigator = createNavigator({
	plugin: NativeNavigation
})

export default function Root(props: Props): JSX.Element {
	const { path, state } = props

	return (
		<Router location={{ pathname: path, state }} navigator={navigator}>
			<Routes>
				<Route path="stack1" element={<Stack1 />} />
				<Route path="stack2" element={<Stack2 />} />
				<Route path="view1" element={<View1 />} />
				<Route path="state" element={<PageWithState />} />
				<Route path="tab1" element={<Tab1 />} />
			</Routes>
		</Router>
	)
}
