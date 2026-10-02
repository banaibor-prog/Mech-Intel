import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Reads the same Firebase web config as the mobile app from the repo-root .env.
export default defineConfig({
  plugins: [react()],
  envDir: '..',
  envPrefix: 'EXPO_PUBLIC_FIREBASE_',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // Keep the Firebase SDK in its own long-cached chunk.
      output: { manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'] } },
    },
    chunkSizeWarningLimit: 700,
  },
});
