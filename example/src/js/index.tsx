import { SplashScreen } from '@capacitor/splash-screen';
import { NativeNavigation } from 'native-navigation'
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'

async function init() {
	NativeNavigation.addListener('view', function(data) {
		console.log('view event', data)
	})

	const root = await NativeNavigation.create({
		name: 'rootStack',
		type: 'stack',
	})

	console.log('INIT: created', root)

	const presentResult = await NativeNavigation.present({
		root: 'rootStack',
		animated: true,
		presentationStyle: 'modal',
	})

	console.log('INIT: presented', presentResult)

	const pushResult = await NativeNavigation.push({
		path: 'textftw'
	})
	console.log('INIT: pushed', pushResult)
	const pushResult2 = await NativeNavigation.push({
		path: 'textftw2'
	})
	console.log('INIT: pushed', pushResult2)

}

init().catch(function(reason) {
	console.log('INIT FAILED', reason)
})

SplashScreen.hide({
	fadeOutDuration: 100,
})

const root = document.getElementById('root')
if (root) {
	ReactDOM.createRoot(root).render(<App />)
}
