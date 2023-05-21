import { NativeNavigation, StackSpec } from '@cactuslab/native-navigation'
import { NativeNavigationModal, NativeNavigationProvider } from '@cactuslab/native-navigation-react'

import diamond from '../assets/imgs/diamond@2x.png'
import flags from '../assets/imgs/flag.2.crossed@2x.png'
import star from '../assets/imgs/star@2x.png'
import { NativeNavigationRouter } from '@cactuslab/native-navigation-react-router'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Stack1 from './Stack1'
import View1 from './View1'
import PageWithState from './PageWithState'
import Tab1 from './Tab1'
import PushReplace from './race/PushReplace'
import StackImmediatePush from './race/StackImmediatePush'
import StackImmediateReplace, { StackImmediateReplace2 } from './race/StackImmediateReplace'
import Stack2 from './Stack2'
import Examples from './examples'
import Container from './Container'
import { ModalContent } from './ModalContent'
import { nativeNavigationNavigatorOptions, nativeNavigationReact } from './init'
import ModalsRace from './race/ModalsRace'

export default function Home(): React.ReactElement {
	const [showModal, setShowModal] = useState(false)
	const [showModal2, setShowModal2] = useState(false)

	return (
		<NativeNavigationProvider value={nativeNavigationReact}>
			<div>
				<h1>Capacitor Native Navigation Test Suite</h1>
				<p>This example app demonstrates the capabilities of Capacitor Native Navigation.</p>
				<p>Choose one of the root options below:</p>
				<dl>
					<dd><button style={{ fontSize: '2rem' }} onClick={() => setupStack({
						path: '/stack1',
						title: 'Stack 1',
						options: {
							bar: {
								background: {
									color: '#336699',
								},
								title: {
									color: '#DFEFEF',
									font: {
										name: 'Solway',
										size: 26,
									},
								},
								buttons: {
									color: '#DDEEFF',
									font: {
										name: 'Solway',
									},
								},
							},
						},
					})}>Stack</button></dd>
					<dd><button style={{ fontSize: '2rem' }} onClick={setupTabs}>Tabs</button></dd>
					<dd><button style={{ fontSize: '2rem' }} onClick={setupView}>View</button></dd>
					<h2>Races</h2>
					<dd><button onClick={() => setupStack({ path: '/race/stack-immediate-push', title: 'Stack Immediate Push' })}>Immediate push</button></dd>
					<dd><button onClick={() => setupStack({ path: '/race/stack-immediate-replace', title: 'Stack Immediate Replace' })}>Immediate replace</button></dd>
					<dd><button onClick={() => setupStack({ path: '/race/push-replace/one', title: 'Push Replace' })}>Push replace</button></dd>
					<dd><button onClick={() => setupStack({ path: '/race/modals', title: 'Modal Race' })}>Modal Race</button></dd>
					<h2>Examples</h2>
					<dd><button onClick={() => setupStack({ path: '/examples/links', title: 'Links' })}>Links</button></dd>
					<dd><button onClick={() => setupStack({ path: '/examples/menu', title: 'Menu' })}>Menu</button></dd>
					<dd><button onClick={() => setupStack({ path: '/examples/subnav/first', title: 'Subnav' })}>Subnav</button></dd>
					<dd><button onClick={() => setupStack({ path: '/examples/tall-content', title: 'Tall Content', options: { bar: { background: { color: '#23ABED60' } } } })}>Transparent Menu</button></dd>
					<dd><button onClick={() => setupStack({ path: '/examples/modals', title: 'Modals' })}>Modals</button></dd>
					<h2>Modals</h2>
					<dd><button onClick={() => setShowModal(m => !m)}>Show Modal 1</button></dd>
					<dd><button onClick={() => setShowModal2(m => !m)}>Show Modal 2</button></dd>
				</dl>
				<NativeNavigationRouter navigation={nativeNavigationNavigatorOptions}>
					<Routes>
						<Route path="stack1" element={<Stack1 />} />
						<Route path="stack2" element={<Stack2 />} />
						<Route path="view1" element={<View1 />} />
						<Route path="state" element={<PageWithState />} />
						<Route path="tab1" element={<Tab1 />} />
						<Route path="race">
							{PushReplace()}
							<Route path="stack-immediate-push" element={<StackImmediatePush />} />
							<Route path="stack-immediate-replace2" element={<StackImmediateReplace2 />} />
							<Route path="stack-immediate-replace" element={<StackImmediateReplace />} />
							<Route path="modals" element={<ModalsRace />} />
						</Route>
						<Route path="examples/*" element={<Examples />} />
						<Route path="modal/*" element={<Container />}>
							<Route path="" element={<View1 />} />
						</Route>
					</Routes>
				</NativeNavigationRouter>

				{/* Modals */}
				{/* This modal is always mounted and its presentation is controlled by the open prop, so it retains the same modal component id */}
				<NativeNavigationModal component={{ type: 'view' }} presentationStyle='formSheet' open={showModal} onClose={() => {
					console.log('Close modal 1')
					setShowModal(false)
				}}>
					<ModalContent />
				</NativeNavigationModal>
				
				{/* This modal is only mounted when the state is true, so it gets a new modal component id each time */}
				{showModal2 && (
					<NativeNavigationModal component={{ type: 'view' }} presentationStyle='formSheet' onClose={() => {
						console.log('Close modal 2')
						setShowModal2(false)
					}}>
						<ModalContent />
					</NativeNavigationModal>
				)}
			</div>
		</NativeNavigationProvider>
	)
}

async function setupStack(options: { path: string; title: string; options?: Partial<StackSpec> }) {
	const stackRoot = await NativeNavigation.present({
		component: {
			id: 'rootStack',
			type: 'stack',
			components: [
				{
					type: 'view',
					path: options?.path,
					title: options?.title,
				},
			],
			...options.options,
		},
		animated: false,
	})
	console.log('INIT: created', stackRoot.id)
}

async function setupTabs() {
	const tabsRoot = await NativeNavigation.present({
		component: {
			id: 'rootTabs',
			type: 'tabs',
			tabs: [
				{
					title: 'First',
					image: star,
					component: {
						id: 'rootStack',
						type: 'stack',
						components: [
							{
								type: 'view',
								path: '/stack1',
							},
						],
					},
				},
				{
					title: 'View',
					image: diamond,
					component: {
						type: 'stack',
						components: [
							{
								type: 'view',
								path: '/view1',
							},
						],
					},
				},
				{
					title: 'Tab Test',
					image: flags,
					component: {
						type: 'view',
						path: '/tab1',
					},
				},
			],
		},
		animated: false,
	})
	console.log('INIT: created', tabsRoot.id)
}

async function setupView() {
	const standaloneViewRoot = await NativeNavigation.present({
		component: {
			type: 'view',
			path: '/view1',
		},
		animated: false,
	})
	console.log('INIT: created', standaloneViewRoot.id)
}
