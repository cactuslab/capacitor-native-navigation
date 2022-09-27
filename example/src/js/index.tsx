import { SplashScreen } from '@capacitor/splash-screen';
import { NativeNavigation, NativeNavigationEvents } from 'native-navigation'
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'

function loadView(view: Window, path: string) {
	const root = view.document.getElementById("root")
	if (root) {
		ReactDOM.createRoot(root).render(<App path={path} />)
	} else {
		console.warn(`Attempted to load view "${path}" but could not find root`)
	}
}

function attemptLoad(view: Window, path: string) {
	const root = view.document.getElementById("root")
	if (root) {
		loadView(view, path)
	} else {
		setTimeout(() => attemptLoad(view, path), 9)
	}
}

async function init() {
	NativeNavigation.addListener(NativeNavigationEvents.View, function(data) {
		const { viewId, path } = data
		console.log('view event', data)

		const view = window.open(viewId)
		if (view) {
			attemptLoad(view, path)
		}
	})

	const root = await NativeNavigation.create({
		name: 'rootStack',
		type: 'stack',
	})

	console.log('INIT: created', root)

	const { viewId } = await NativeNavigation.createView({
		path: '/whatever'
	})

	const pushResult = await NativeNavigation.push({
		viewId,
		stack: 'rootStack',
	})
	console.log('INIT: pushed', pushResult)
	// const pushResult2 = await NativeNavigation.push({
	// 	path: 'textftw2'
	// })
	// console.log('INIT: pushed', pushResult2)

	const presentResult = await NativeNavigation.present({
		root: 'rootStack',
		animated: true,
		presentationStyle: 'modal',
		modalPresentationStyle: 'formSheet',
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
