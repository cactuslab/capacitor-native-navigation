import { NativeNavigation } from '@cactuslab/native-navigation'
import { NativeNavigationReactRootProps } from '@cactuslab/native-navigation-react'
import { createNavigator } from '@cactuslab/native-navigation-react-router'
import {  Route, Router, Routes } from 'react-router-dom'

import PageWithState from './PageWithState'
import Stack1 from './Stack1'
import Stack2 from './Stack2'
import StackImmediatePush from './race/StackImmediatePush'
import PushReplace from './race/PushReplace'
import Tab1 from './Tab1'
import View1 from './View1'
import StackImmediateReplace from './race/StackImmediateReplace'

export default function Root(props: NativeNavigationReactRootProps): JSX.Element {
	const { path, state, id, stack } = props

	const navigator = createNavigator({
		plugin: NativeNavigation,
		componentId: id,
		stack,
	})


	return (
		<Router location={{ pathname: path, state }} navigator={navigator}>
			<Routes>
				<Route path="stack1" element={<Stack1 />} />
				<Route path="stack2" element={<Stack2 />} />
				<Route path="view1" element={<View1 />} />
				<Route path="state" element={<PageWithState />} />
				<Route path="tab1" element={<Tab1 />} />
				<Route path="race">
					{PushReplace()}
					<Route path="stack-immediate-push" element={<StackImmediatePush />} />
					<Route path="stack-immediate-replace" element={<StackImmediateReplace />} />
				</Route>
			</Routes>
		</Router>
	)
}
