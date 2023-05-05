export default [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'iife',
        name: 'CapacitorNativeNavigationReact17',
        globals: {
          '@cactuslab/native-navigation': 'CapacitorNativeNavigation',
          '@capacitor/core': 'capacitorExports',
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
      '@cactuslab/native-navigation',
      '@capacitor/core',
      'react',
      'react-dom',
    ],
  },
];