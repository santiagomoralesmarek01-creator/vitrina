import { describe, expect, it } from 'vitest'
import { estadoHappy, recomendar, reloj } from './tragos'

describe('recomendar', () => {
  it('amargo, fuerte y para cerrar la noche: Negroni', () => {
    expect(recomendar({ sabor: 'amargo', fuerza: 'fuerte', momento: 'cerrar' }).id).toBe('negroni')
  })

  it('cítrico, suave y para bailar: Mojito', () => {
    expect(recomendar({ sabor: 'citrico', fuerza: 'suave', momento: 'bailar' }).id).toBe('mojito')
  })

  it('sin alcohol solo recomienda tragos sin alcohol', () => {
    const t = recomendar({ sabor: 'dulce', fuerza: 'nada', momento: 'cerrar' })
    expect(t.base).toBe('sin-alcohol')
  })
})

describe('happy hour', () => {
  const a = (h: number, m = 0) => new Date(2026, 9, 16, h, m)

  it('activo entre las 18 y las 21', () => {
    expect(estadoHappy(a(19, 30))).toEqual({ activo: true, ms: 90 * 60_000 })
  })

  it('antes de las 18 cuenta hasta que empieza', () => {
    expect(estadoHappy(a(17))).toEqual({ activo: false, ms: 60 * 60_000 })
  })

  it('después de las 21 cuenta hasta el día siguiente', () => {
    expect(estadoHappy(a(22))).toEqual({ activo: false, ms: 20 * 60 * 60_000 })
  })

  it('formatea el reloj', () => {
    expect(reloj(3_723_000)).toBe('01:02:03')
  })
})
