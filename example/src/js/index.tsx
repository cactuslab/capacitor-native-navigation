import { SplashScreen } from '@capacitor/splash-screen';
import { NativeNavigation } from 'native-navigation'
import { initReact } from 'native-navigation/react'
import React from 'react'
import ReactDOM from 'react-dom/client'

import Home from './Home';
import Root from './Root';

import './app.css'

/* Render root UI */
const root = document.getElementById('root')
if (root) {
	ReactDOM.createRoot(root).render(<Home />)
}

initReact({
	plugin: NativeNavigation,
	root: Root,
})

SplashScreen.hide({
	fadeOutDuration: 100,
})
