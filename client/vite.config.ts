import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'daily-dose-logo.jpg'],
      manifest: {
        name: 'Daily Dose POS',
        short_name: 'Daily Dose',
        description: 'POS System for Daily Dose Coffee',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'daily-dose-logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'daily-dose-logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  resolutions: {
    "react-router-dom": "6.22.3"
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-toast', 'lucide-react'],
        },
      },
    },
  },
}));
