import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';
const isReplit = process.env.REPL_ID !== undefined;

// PORT is only required when running on Replit
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

// BASE_PATH is only required on Replit
const basePath = process.env.BASE_PATH ?? '/';

const plugins: any[] = [react(), tailwindcss()];

if (!isProduction) {
  // Only add Replit-specific plugins in development on Replit
  const { default: runtimeErrorOverlay } = await import(
    '@replit/vite-plugin-runtime-error-modal'
  );
  plugins.push(runtimeErrorOverlay());

  if (isReplit) {
    const { cartographer } = await import('@replit/vite-plugin-cartographer');
    plugins.push(
      cartographer({
        root: path.resolve(import.meta.dirname, '..'),
      }),
    );
    const { devBanner } = await import('@replit/vite-plugin-dev-banner');
    plugins.push(devBanner());
  }
}

export default defineConfig({
  base: basePath,
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
