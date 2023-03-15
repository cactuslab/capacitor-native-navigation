import { NativeNavigation } from '@cactuslab/native-navigation'
import { NativeNavigationReactRootProps } from '@cactuslab/native-navigation-react'
import { useNativeNavigationNavigator } from '@cactuslab/native-navigation-react-router'
import {  Route, Router, Routes } from 'react-router-dom'

import PageWithState from './PageWithState'
import Stack1 from './Stack1'
import Stack2 from './Stack2'
import StackImmediatePush from './race/StackImmediatePush'
import PushReplace from './race/PushReplace'
import Tab1 from './Tab1'
import View1 from './View1'
import StackImmediateReplace from './race/StackImmediateReplace'
import Examples from './examples'
import Container from './Container'

export default function Root(props: NativeNavigationReactRootProps): JSX.Element {
	const { pathname, search, hash, state } = props

	const navigator = useNativeNavigationNavigator({
		plugin: NativeNavigation,
		modals: [
			{
				path: '/modal/',
				presentOptions(path, state) {
					return {
						component: {
							type: 'stack',
							stack: [
								{
									type: 'view',
									path,
									state,
									options: {
										title: 'Test',
										stack: {
											rightItems: [
												{
													id: 'back',
													title: 'Close',
												},
											],
										},
									},
								},
							],
						},
						style: 'formSheet',
					}
				},
			},
		]
	})

	return (
		<Router location={{ pathname, search, hash, state }} navigator={navigator}>
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
				<Route path="examples/*" element={<Examples />} />
				<Route path="modal/*" element={<Container />}>
					<Route path="" element={<View1 />} />
				</Route>
			</Routes>
		</Router>
	)
}
