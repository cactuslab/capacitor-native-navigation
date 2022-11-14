export default [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/plugin.js',
        format: 'iife',
        name: 'CapacitorNativeNavigation',
        globals: {
          '@capacitor/core': 'capacitorExports',
        },
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: 'dist/plugin.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: [
      '@capacitor/core',
    ],
  },
  {
    input: 'dist/esm/react/index.js',
    output: [
      {
        file: 'dist/react.js',
        format: 'iife',
        name: 'CapacitorNativeNavigationReact',
        globals: {
          '@capacitor/core': 'capacitorExports',
          'react': 'React',
          'react-dom/client': 'ReactDOM',
        },
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: 'dist/react.cjs.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: [
      '@capacitor/core',
      'react',
      'react-dom/client',
    ],
  },
  {
    input: 'dist/esm/react/router/index.js',
    output: [
      {
        file: 'dist/react-router.js',
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
        file: 'dist/react-router.cjs.js',
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
