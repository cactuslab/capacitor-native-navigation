export default [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'iife',
        name: 'CapacitorNativeNavigationReact',
        globals: {
          'capacitor-native-navigation': 'CapacitorNativeNavigation',
          '@capacitor/core': 'capacitorExports',
          'react': 'React',
          'react-dom/client': 'ReactDOM',
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
      '@capacitor/core',
      'react',
      'react-dom/client',
    ],
  },
];
