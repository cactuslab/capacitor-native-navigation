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
		url: 'http://127.0.0.1:5173/',
	},
	plugins: {
		SplashScreen: {
			launchAutoHide: false,
		}
	}
}

export default config
