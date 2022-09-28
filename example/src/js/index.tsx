import { SplashScreen } from '@capacitor/splash-screen';
import { NativeNavigation, NativeNavigationEvents } from 'native-navigation'
import type { ViewEventData } from 'native-navigation';
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import Root from './Root';

function loadView(view: Window, data: ViewEventData) {
	const { path, id } = data

	const root = view.document.getElementById("root")
	if (root) {
		ReactDOM.createRoot(root).render(<Root path={path} viewId={id} />)
	} else {
		console.warn(`Attempted to load view "${path}" but could not find root node`)
	}
}

function attemptLoad(view: Window, data: ViewEventData) {
	const root = view.document.getElementById("root")
	if (root) {
		loadView(view, data)
	} else {
		setTimeout(() => attemptLoad(view, data), 9)
	}
}

async function init() {
	await NativeNavigation.addListener(NativeNavigationEvents.View, function(data: ViewEventData) {
		const { id } = data
		console.log('view event', data)

		const view = window.open(id)
		if (view) {
			attemptLoad(view, data)
		}
	})

	const root = await NativeNavigation.create({
		id: 'rootStack',
		type: 'stack',
		modalPresentationStyle: 'formSheet',
	})

	console.log('INIT: created', root)

	const { id: viewId } = await NativeNavigation.create({
		type: 'view',
		path: '/section/page1'
	})

	const pushResult = await NativeNavigation.push({
		id: viewId,
		stack: 'rootStack',
	})
	console.log('INIT: pushed', pushResult)

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
	ReactDOM.createRoot(root).render(<App path="/" />)
}
