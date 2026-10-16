import { describe, expect, it } from 'vitest'
import { ESPRESSO_BAR, FRIOS, precioBebida } from './carta'

const latte = ESPRESSO_BAR.find((b) => b.id === 'latte')!
const espresso = ESPRESSO_BAR.find((b) => b.id === 'espresso')!
const tonic = FRIOS.find((b) => b.id === 'tonic')!

describe('precioBebida', () => {
  it('suma tamaño y leche solo cuando corresponde', () => {
    expect(precioBebida(latte, 'chico', 'entera')).toBe(4600)
    expect(precioBebida(latte, 'grande', 'avena')).toBe(4600 + 1700 + 700)
  })

  it('el espresso no cambia con el tamaño ni la leche', () => {
    expect(precioBebida(espresso, 'grande', 'almendras')).toBe(3200)
  })

  it('una bebida sin leche ignora la leche elegida', () => {
    expect(precioBebida(tonic, 'chico', 'almendras')).toBe(5400)
  })
})
