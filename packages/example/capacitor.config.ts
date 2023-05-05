import type { CapacitorConfig } from '@capacitor/cli'
import process from 'process'

const config: CapacitorConfig = {
	appId: 'com.example.plugin',
	appName: 'Native Navigation Example',
	webDir: 'dist',
	bundledWebRuntime: false,
	android: {
		path: 'android',
	},
	server: {
		/* Set the CAP_SERVER environment variable when running cap copy or cap sync; see the cap:local npm script */
		url: process.env.CAP_SERVER || undefined,
		allowNavigation: ['cactuslab.com'],
	},
	plugins: {
		SplashScreen: {
			launchAutoHide: false,
		},
	},
}

export default config
