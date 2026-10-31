import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite build configuration.
 *
 * `base: './'` makes every asset path relative, so the built site in `dist/`
 * works no matter where it is hosted (GitHub Pages sub-path, a custom domain,
 * or simply opening the folder from disk through a static server).
 */
export default defineConfig({
  base: './',
  plugins: [react()],
});
