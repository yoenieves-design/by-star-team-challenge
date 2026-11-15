import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Use portable character escapes in the generated JavaScript bundle.
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
