import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Guard against empty critical service files (prevents silent corruption)
const criticalServiceGuard = {
  name: 'critical-service-guard',
  apply: 'build',
  configResolved() {
    const listingsPath = path.join(process.cwd(), 'src/services/listings.ts')
    const content = fs.readFileSync(listingsPath, 'utf-8')
    const trimmed = content.trim()

    if (!trimmed || trimmed.length === 0) {
      throw new Error(
        '🚨 CRITICAL: src/services/listings.ts is empty!\n' +
        'This file is essential for listing management. Build aborted to prevent corruption.\n' +
        'Restore from git or backup: git checkout src/services/listings.ts'
      )
    }
  },
}

export default defineConfig({
  plugins: [criticalServiceGuard, react()],
  optimizeDeps: {
    include: ['react-helmet-async'],
  },
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
