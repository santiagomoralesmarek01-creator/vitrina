import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Cada ejemplo es una página independiente con su propio HTML, CSS y TS.
const PAGINAS = [
  'index',
  'bodegon',
  'nube',
  'pulso',
  'volta',
  'tano',
  'neblina',
  'filo',
  'mercadito',
  'kaze',
  'polo',
  'miga',
  'bunker',
  'domingo',
  'lupulo',
  'raiz',
  'nortena',
  'alpaso',
  'tueste',
  'vidriera',
]

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        PAGINAS.map((p) => [p, resolve(import.meta.dirname, p === 'index' ? 'index.html' : `${p}/index.html`)]),
      ),
    },
  },
})
