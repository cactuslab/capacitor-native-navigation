export default [
	{
		input: 'dist/esm/index.js',
		output: [
			{
				file: 'dist/index.cjs.js',
				format: 'cjs',
				sourcemap: true,
				inlineDynamicImports: true,
			},
		],
		external: [
			'capacitor-native-navigation',
			'capacitor-native-navigation-react',
			'capacitor-native-navigation-react/context',
			'react',
			'react-dom',
			'react-router-dom',
		],
	},
]
