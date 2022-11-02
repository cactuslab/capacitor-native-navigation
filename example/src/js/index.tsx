import { SplashScreen } from '@capacitor/splash-screen';
import { NativeNavigation, NativeNavigationEvents } from 'native-navigation'
import type { ComponentId, CreateViewEventData, DestroyViewEventData } from 'native-navigation';
import React from 'react'
import ReactDOM from 'react-dom/client'

import Root from './Root';

const reactRoots: Record<ComponentId, ReactDOM.Root> = {}

function loadView(view: Window, data: CreateViewEventData) {
	const { path, id } = data

	const rootElement = view.document.getElementById("root")
	if (rootElement) {
		const root = ReactDOM.createRoot(rootElement)
		root.render(<Root path={path} viewId={id} />)
		// root.render(<p>This more string - {path} id: {id}</p>)
		reactRoots[id] = root
	} else {
		console.warn(`Attempted to load view "${path}" but could not find root node`)
	}
}

function attemptLoad(view: Window, data: CreateViewEventData) {
	const root = view.document.getElementById("root")
	console.log("Attempting load with root", root)
	if (root) {
		loadView(view, data)
	} else {
		setTimeout(() => attemptLoad(view, data), 9)
	}
}

async function init() {
	await NativeNavigation.addListener(NativeNavigationEvents.CreateView, async function(data: CreateViewEventData) {
		const { id } = data
		console.log('view event', id)

		const view = window.open(id)
		if (view) {
			attemptLoad(view, data)
		}
	})

	await NativeNavigation.addListener(NativeNavigationEvents.DestroyView, function(data: DestroyViewEventData) {
		const { id } = data
		console.log('destroy view event', data)

		const root = reactRoots[id]
		if (root) {
			root.unmount()
			delete reactRoots[id]
		}
	})

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
	
	// const pushResult = await NativeNavigation.push({
	// 	component: {
	// 		type: 'view',
	// 		path: '/section/page1'
	// 	},
	// 	stack: 'rootStack',
	// })

	// const tabsRoot = await NativeNavigation.setRoot({
	// 	component: {
	// 		id: 'rootTabs',
	// 		type: 'tabs',
	// 		tabs: [
	// 			{
	// 				id: 'rootStack',
	// 				type: 'stack',
	// 				options: {
	// 					modalPresentationStyle: 'formSheet',
	// 					title: 'One',
	// 					tab: {
	// 						badgeValue: 'Yes',
	// 						image: icon,
	// 					}
	// 				},
	// 				stack: [
	// 					{
	// 						type: 'view',
	// 						path: '/root',
	// 					}
	// 				],
	// 			},
	// 			{
	// 				type: 'view',
	// 				path: '/root',
	// 				options: {
	// 					title: 'Two',
	// 				}
	// 			}
	// 		],
	// 	},
	// })

	// const standaloneViewRoot = await NativeNavigation.setRoot({
	// 	component: {
	// 		type: 'view',
	// 		path: '/section/page1'
	// 	},
	// })
}

init().catch(function(reason) {
	console.log('INIT FAILED', reason)
})

SplashScreen.hide({
	fadeOutDuration: 100,
})

const root = document.getElementById('root')
if (root) {
	ReactDOM.createRoot(root).render(<p>Please wait…</p>)
}
