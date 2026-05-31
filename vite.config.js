import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Hardcoded fallbacks in case GitHub secrets aren't injected
    // These are PUBLIC keys — safe to be in client code
    '__SUPA_URL__': JSON.stringify(
      process.env.VITE_SUPABASE_URL ||
      'https://uakmvwwgtjrwdymfwtrf.supabase.co'
    ),
    '__SUPA_KEY__': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVha212d3dndGpyd2R5bWZ3dHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDcyMzYsImV4cCI6MjA5NTcyMzIzNn0.K_y8XXzh7N-M-aks5WLXn3_FWzxrsBEZ12-Y82_24po'
    ),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
