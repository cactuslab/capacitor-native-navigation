import { NativeNavigation, StackSpec } from '@cactuslab/native-navigation'
import Root from './Root'
import { NativeNavigationModal, NativeNavigationProvider, initReact } from '@cactuslab/native-navigation-react'

import diamond from '../assets/imgs/diamond@2x.png'
import flags from '../assets/imgs/flag.2.crossed@2x.png'
import star from '../assets/imgs/star@2x.png'
import { NativeNavigationViews } from '@cactuslab/native-navigation-react'
import { useState } from 'react'

const nativeNavigationReact = initReact({
	plugin: NativeNavigation,
})

export default function Home(): React.ReactElement {
	const [showModal, setShowModal] = useState(false)

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
					<h2>Examples</h2>
					<dd><button onClick={() => setupStack({ path: '/examples/links', title: 'Links' })}>Links</button></dd>
					<dd><button onClick={() => setupStack({ path: '/examples/menu', title: 'Menu' })}>Menu</button></dd>
					<dd><button onClick={() => setupStack({ path: '/examples/subnav/first', title: 'Subnav' })}>Subnav</button></dd>
					<dd><button onClick={() => setupStack({ path: '/examples/tall-content', title: 'Tall Content', options: { bar: { background: { color: '#23ABED60' } } } })}>Transparent Menu</button></dd>
					<dd><button onClick={() => setShowModal(m => !m)}>Show Modal</button></dd>
				</dl>
				<NativeNavigationViews root={Root} />
				{showModal && (
					<NativeNavigationModal component={{ type: 'view', path: '' }} presentationStyle='formSheet'>
						<h1>Hello World</h1>
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
