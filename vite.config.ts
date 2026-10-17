/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Let contrast.test.ts read the real token file via `?raw` (Vitest blanks CSS by default).
    css: { include: [/index\.css/] },
  },
});
