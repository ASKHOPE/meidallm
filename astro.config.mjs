import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['pg-native'] // Avoid issues compiling pg driver for serverless
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('zod')) {
                return 'zod-vendor';
              }
              if (id.includes('better-auth')) {
                return 'better-auth-vendor';
              }
              if (id.includes('pg')) {
                return 'pg-vendor';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  }
});
