export default [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'iife',
        name: 'CapacitorNativeNavigationReact17',
        globals: {
          '@capacitor/core': 'capacitorExports',
          'native-navigation': 'CapacitorNativeNavigation',
          'react': 'React',
          'react-dom': 'ReactDOM',
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
      '@capacitor/core',
      'native-navigation',
      'react',
      'react-dom',
    ],
  },
];
