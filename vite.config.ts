import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Cada ejemplo es una página independiente con su propio HTML, CSS y TS.
const PAGINAS = ['index', 'bodegon', 'nube', 'pulso', 'volta', 'tano', 'neblina', 'filo', 'mercadito']

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        PAGINAS.map((p) => [p, resolve(import.meta.dirname, p === 'index' ? 'index.html' : `${p}/index.html`)]),
      ),
    },
  },
})
