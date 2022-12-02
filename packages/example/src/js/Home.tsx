import { NativeNavigation, StackOptions } from '@cactuslab/native-navigation'

import diamond from '../assets/imgs/diamond@2x.png'
import flags from '../assets/imgs/flag.2.crossed@2x.png'
import star from '../assets/imgs/star@2x.png'

export default function Home(): React.ReactElement {
	return (
		<div>
			<h1>Capacitor Native Navigation Test Suite</h1>
			<p>This example app demonstrates the capabilities of Capacitor Native Navigation.</p>
			<p>Choose one of the root options below:</p>
			<dl>
				<dd><button style={{fontSize: '2rem'}} onClick={() => setupStack({
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
								}
							},
							buttons: {
								color: '#DDEEFF',
								font: {
									name: 'Solway',
								}
							},
						},
					}
				})}>Stack</button></dd>
				<dd><button style={{fontSize: '2rem'}} onClick={setupTabs}>Tabs</button></dd>
				<dd><button style={{fontSize: '2rem'}} onClick={setupView}>View</button></dd>
				<h2>Races</h2>
				<dd><button onClick={() => setupStack({ path: '/race/stack-immediate-push', title: 'Stack Immediate Push' })}>Immediate push</button></dd>
				<dd><button onClick={() => setupStack({ path: '/race/stack-immediate-replace', title: 'Stack Immediate Replace' })}>Immediate replace</button></dd>
				<dd><button onClick={() => setupStack({ path: '/race/push-replace/one', title: 'Push Replace' })}>Push replace</button></dd>
			</dl>
		</div>
	)
}

async function setupStack(options: { path: string, title: string, options?: StackOptions }) {
	const stackRoot = await NativeNavigation.present({
		component: {
			id: 'rootStack',
			type: 'stack',
			stack: [
				{
					type: 'view',
					path: options?.path,
					options: {
						title: options?.title,
					}
				}
			],
			options: options.options,
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
					id: 'rootStack',
					type: 'stack',
					options: {
						title: 'First',
						tab: {
							// badgeValue: 'Yes',
							image: star,
						}
					},
					stack: [
						{
							type: 'view',
							path: '/stack1',
						}
					],
				},
				{
					type: 'view',
					path: '/view1',
					options: {
						title: 'View',
						tab: {
							image: diamond,
						}
					}
				},
				{
					type: 'view',
					path: '/tab1',
					options: {
						title: 'Tab Test',
						tab: {
							image: flags,
						}
					}
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
			path: '/view1'
		},
		animated: false,
	})
	console.log('INIT: created', standaloneViewRoot.id)
}
