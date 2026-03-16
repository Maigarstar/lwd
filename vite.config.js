import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    strictPort: true,
    host: '0.0.0.0',
    middlewareMode: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime - long-term cacheable across deploys
          'vendor-react': ['react', 'react-dom'],
          // Supabase DB client (~300KB) - changes rarely
          'vendor-supabase': ['@supabase/supabase-js'],
          // TipTap rich text editor - only needed in admin/studio
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-text-align',
            '@tiptap/extension-typography',
            '@tiptap/extension-underline',
          ],
        },
      },
    },
  },
})
