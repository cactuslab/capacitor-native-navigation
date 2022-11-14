import { NativeNavigation } from '@cactuslab/native-navigation'

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
				<dd><button style={{fontSize: '2rem'}} onClick={setupStack}>Stack</button></dd>
				<dd><button style={{fontSize: '2rem'}} onClick={setupTabs}>Tabs</button></dd>
				<dd><button style={{fontSize: '2rem'}} onClick={setupView}>View</button></dd>
			</dl>
		</div>
	)
}



async function setupStack() {
	const stackRoot = await NativeNavigation.setRoot({
		component: {
			id: 'rootStack',
			type: 'stack',
			stack: [
				{
					type: 'view',
					path: '/stack1',
					options: {
						title: 'Stack 1',
					}
				}
			],
			options: {
				bar: {
					background: {
						color: '#336699',
					},
					title: {
						color: '#f00099',
						font: {
							name: 'Arial',
							size: 26,
						}
					},
					buttons: {
						color: '#888866',
					},
				},
			},
		},
	})
	console.log('INIT: created', stackRoot.id)
}

async function setupTabs() {
	const tabsRoot = await NativeNavigation.setRoot({
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
	})
	console.log('INIT: created', tabsRoot.id)
}

async function setupView() {
	const standaloneViewRoot = await NativeNavigation.setRoot({
		component: {
			type: 'view',
			path: '/view1'
		},
	})
	console.log('INIT: created', standaloneViewRoot.id)
}
