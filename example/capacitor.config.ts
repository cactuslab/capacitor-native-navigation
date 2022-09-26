import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'com.example.plugin',
	appName: 'Native Navigation Example',
	webDir: 'dist',
	bundledWebRuntime: false,
	server: {
		url: 'http://127.0.0.1:3000/',
	},
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    }
  }
}

export default config
