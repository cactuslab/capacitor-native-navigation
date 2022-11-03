export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorNativeNavigation',
      globals: {
        '@capacitor/core': 'capacitorExports',
        'react': 'React',
        'react-dom/client': 'ReactDOM',
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
    'react',
    'react-dom/client',
  ],
};
