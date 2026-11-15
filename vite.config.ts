import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // A classic shortcode script can inherit the page's character encoding.
  esbuild: { charset: 'ascii' },
  build: {
    target: 'es2022',
    lib: {
      entry: 'src/app/main.ts',
      name: 'ByStarMissionDemo',
      formats: ['iife'],
      fileName: () => 'assets/by-star-app.js',
      cssFileName: 'by-star-app',
    },
    rollupOptions: {
      output: { assetFileNames: 'assets/[name][extname]' },
    },
  },
});
