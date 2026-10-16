import { describe, expect, it } from 'vitest'
import { calcularAhorro, SEMANAS_POR_MES } from './ahorro'

describe('calcularAhorro', () => {
  it('colectivo: dos boletos por día contra la luz de la bici', () => {
    const r = calcularAhorro(10, 5, 'colectivo', 1_890_000)
    const dias = 5 * SEMANAS_POR_MES
    expect(r.actualMes).toBe(Math.round(dias * 1400))
    expect(r.biciMes).toBe(Math.round(dias * 10 * 4))
    expect(r.ahorroMes).toBe(r.actualMes - r.biciMes)
    expect(r.mesesParaPagarla).toBe(Math.ceil(1_890_000 / r.ahorroMes))
  })

  it('el auto cuesta por kilómetro', () => {
    const r = calcularAhorro(20, 5, 'auto', 1_000_000)
    expect(r.actualMes).toBe(Math.round(5 * SEMANAS_POR_MES * 20 * 260))
    expect(r.co2Mes).toBe(Math.round(5 * SEMANAS_POR_MES * 20 * 0.17))
  })

  it('sin ahorro no hay meses para pagarla', () => {
    expect(calcularAhorro(0, 0, 'colectivo', 1).mesesParaPagarla).toBeNull()
  })
})
