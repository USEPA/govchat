import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  envDir: './',
  envPrefix: ['NEXT_PUBLIC_', 'OPENAI_', 'AZURE_', 'GOOGLE_', 'DEFAULT_'],
});
