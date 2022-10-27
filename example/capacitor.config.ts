import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'com.example.plugin',
	appName: 'Native Navigation Example',
	webDir: 'dist',
	bundledWebRuntime: false,
	android: {
		path: 'android'
	},
	server: {
		url: 'http://tbook.local:5173/',
	},
	plugins: {
		SplashScreen: {
			launchAutoHide: false,
		}
	}
}

export default config
