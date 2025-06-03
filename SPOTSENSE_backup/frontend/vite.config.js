import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Proxy API requests to backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:5001',
        ws: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Support for .env files with REACT_APP_ prefix for CRA compatibility
  define: {
    'process.env': {},
  },
  // Automatically inject env variables prefixed with REACT_APP_
  envPrefix: ['REACT_APP_'],
}); 