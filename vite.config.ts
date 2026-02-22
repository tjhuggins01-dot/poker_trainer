import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Change REPO_NAME to match your GitHub repository name for Pages deployments.
const REPO_NAME = 'poker_trainer';
const BASE_PATH = `/${REPO_NAME}/`;

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['pwa-icon-192.svg', 'pwa-icon-512.svg'],
      manifest: {
        name: 'Preflop Range Drill',
        short_name: 'Range Drill',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: 'standalone',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [
          {
            src: `${BASE_PATH}pwa-icon-192.svg`,
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: `${BASE_PATH}pwa-icon-512.svg`,
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        navigateFallback: `${BASE_PATH}index.html`,
      },
    }),
  ],
});
