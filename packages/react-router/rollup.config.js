export default [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'iife',
        name: 'CapacitorNativeNavigationReactRouter',
        globals: {
          '@capacitor/core': 'capacitorExports',
          'react': 'React',
          'react-dom/client': 'ReactDOM',
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
      '@capacitor/core',
      'react',
      'react-dom/client',
      'react-router-dom'
    ],
  },
];
