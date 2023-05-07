import { SplashScreen } from '@capacitor/splash-screen'
import React from 'react'
import ReactDOM from 'react-dom/client'

import Home from './Home'

import './app.css'

/* Render root UI */
const root = document.getElementById('root')
if (root) {
	ReactDOM.createRoot(root).render(<Home />)
}

SplashScreen.hide({
	fadeOutDuration: 100,
})
