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
			'@capacitor/core',
			'react',
			'react-dom',
			'fast-deep-equal',
		],
	},
]
