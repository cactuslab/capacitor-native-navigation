export default [
	{
		input: 'dist/esm/index.js',
		output: [
			{
				file: 'dist/index.js',
				format: 'iife',
				name: 'CapacitorNativeNavigationReactRouter',
				globals: {
					'capacitor-native-navigation': 'CapacitorNativeNavigation',
					'react': 'React',
					'react-dom': 'ReactDOM',
					'react-router-dom': 'ReactRouterDOM',
				},
				sourcemap: true,
				inlineDynamicImports: true,
			},
			{
				file: 'dist/index.cjs.js',
				format: 'cjs',
				sourcemap: true,
				inlineDynamicImports: true,
			},
		],
		external: [
			'capacitor-native-navigation',
			'react',
			'react-dom',
			'react-router-dom',
		],
	},
]
