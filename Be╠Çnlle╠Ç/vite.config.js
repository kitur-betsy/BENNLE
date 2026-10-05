import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Also expose NEXT_PUBLIC_* so keys copied from Supabase's Next.js snippet work unchanged.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
