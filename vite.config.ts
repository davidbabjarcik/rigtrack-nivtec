/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }

export default defineConfig({
  // Relatívne cesty: stránka funguje na GitHub Pages pod akýmkoľvek názvom repozitára.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Databázové testy si v beforeEach stavajú celú schému v PGlite; pri paralelnom behu
    // to za predvolených 10 s nemusia stihnúť (rovnako ako v RigTracku).
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
})
