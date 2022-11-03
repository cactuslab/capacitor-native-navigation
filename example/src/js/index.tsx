import { SplashScreen } from '@capacitor/splash-screen';
import { initReact, NativeNavigation } from 'native-navigation'
import React from 'react'
import ReactDOM from 'react-dom/client'

import icon from '../assets/imgs/flag.2.crossed@2x.png'

import Root from './Root';

async function setupStack() {
	const stackRoot = await NativeNavigation.setRoot({
		component: {
			id: 'rootStack',
			type: 'stack',
			options: {
				modalPresentationStyle: 'formSheet',
			},
			stack: [
				{
					type: 'view',
					path: '/root',
					options: {
						title: 'My Root View',
					}
				}
			],
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
						modalPresentationStyle: 'formSheet',
						title: 'One',
						tab: {
							badgeValue: 'Yes',
							image: icon,
						}
					},
					stack: [
						{
							type: 'view',
							path: '/root',
						}
					],
				},
				{
					type: 'view',
					path: '/root',
					options: {
						title: 'Two',
					}
				}
			],
		},
	})
	console.log('INIT: created', tabsRoot.id)
}

async function setupView() {
	const standaloneViewRoot = await NativeNavigation.setRoot({
		component: {
			type: 'view',
			path: '/section/page1'
		},
	})
	console.log('INIT: created', standaloneViewRoot.id)
}

function Home() {
	return (
		<div>
			<h1>Capacitor Native Navigation Test Suite</h1>
			<dl>
				<dd><button style={{fontSize: '2rem'}} onClick={setupStack}>Stack</button></dd>
				<dd><button style={{fontSize: '2rem'}} onClick={setupTabs}>Tabs</button></dd>
				<dd><button style={{fontSize: '2rem'}} onClick={setupView}>View</button></dd>
			</dl>
		</div>
	)
}

const root = document.getElementById('root')
if (root) {
	ReactDOM.createRoot(root).render(<Home />)
}

initReact({
	plugin: NativeNavigation,
	root: Root,
})


// init().catch(function(reason) {
// 	console.log('INIT FAILED', reason)
// })

SplashScreen.hide({
	fadeOutDuration: 100,
})
