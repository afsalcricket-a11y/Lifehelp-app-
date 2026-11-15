import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' + HashRouter lets the build work on GitHub Pages under any repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});
