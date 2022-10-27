import { SplashScreen } from '@capacitor/splash-screen';
import { NativeNavigation, NativeNavigationEvents } from 'native-navigation'
import type { ComponentId, CreateViewEventData, DestroyViewEventData } from 'native-navigation';
import React from 'react'
import ReactDOM from 'react-dom/client'

import icon from '../assets/imgs/flag.2.crossed@2x.png'

import App from './App'
import Root from './Root';

const reactRoots: Record<ComponentId, ReactDOM.Root> = {}

function loadView(view: Window, data: CreateViewEventData) {
	const { path, id } = data

	const rootElement = view.document.getElementById("root")
	if (rootElement) {
		const root = ReactDOM.createRoot(rootElement)
		root.render(<Root path={"/root"} viewId={id} />)
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

		await NativeNavigation.prepare({id: id})
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

	const root = await NativeNavigation.create({
		id: 'rootStack',
		type: 'stack',
		options: {
			modalPresentationStyle: 'formSheet',
		},
		stack: [
			{
				type: 'view',
				path: '/root',
			}
		],
	})

	// const root = await NativeNavigation.create({
	// 	id: 'rootTabs',
	// 	type: 'tabs',
	// 	tabs: [
	// 		{
	// 			id: 'rootStack',
	// 			type: 'stack',
	// 			options: {
	// 				modalPresentationStyle: 'formSheet',
	// 				title: 'One',
	// 				tab: {
	// 					badgeValue: 'Yes',
	// 					image: icon,
	// 				}
	// 			},
	// 			stack: [
	// 				{
	// 					type: 'view',
	// 					path: '/root',
	// 				}
	// 			],
	// 		},
	// 		{
	// 			type: 'view',
	// 			path: '/root',
	// 			options: {
	// 				title: 'Two',
	// 			}
	// 		}
	// 	]
	// })

	console.log('INIT: created', root.id)

	// const { id: viewId } = await NativeNavigation.create({
	// 	type: 'view',
	// 	path: '/section/page1'
	// })

	// const pushResult = await NativeNavigation.push({
	// 	id: viewId,
	// 	stack: 'rootStack',
	// })
	// console.log('INIT: pushed', pushResult)

	// const presentResult = await NativeNavigation.present({
	// 	id: 'rootStack',
	// 	animated: true,
	// })
	const presentResult = await NativeNavigation.setRoot({
		id: 'rootStack',
	})

	console.log('INIT: presented', presentResult)
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
