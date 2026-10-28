import { describe, expect, it } from 'vitest'
import { estadoHorno, hornadas, textoHorno, TURNOS } from './horno'

// 2026-10-27 es martes; 2026-10-26, lunes; 2026-11-01, domingo.
const f = (dia: number, h: number, m: number, s = 0) => new Date(2026, 9, dia, h, m, s)

describe('hornadas', () => {
  it('cada 20 minutos desde que abre, la última antes de cerrar', () => {
    const h = hornadas(TURNOS[2][0])
    expect(h[0]).toBe(11 * 60 + 30)
    expect(h[1]).toBe(11 * 60 + 50)
    expect(h.at(-1)).toBe(14 * 60 + 50)
  })
})

describe('estado del horno', () => {
  it('abierto: cuenta los minutos a la próxima', () => {
    const e = estadoHorno(f(27, 12, 3))
    expect(e).toMatchObject({ abierto: true, minutos: 7, hora: '12:10', cierra: '15:00' })
  })

  it('justo en la hornada: sale ahora', () => {
    const e = estadoHorno(f(27, 12, 10, 20))
    expect(e).toMatchObject({ abierto: true, minutos: 0, hora: '12:10' })
    expect(textoHorno(e)).toBe('Sale una hornada ahora (12:10).')
  })

  it('redondea los segundos para arriba', () => {
    expect(estadoHorno(f(27, 12, 3, 30))).toMatchObject({ minutos: 7 })
    expect(estadoHorno(f(27, 12, 9, 1))).toMatchObject({ minutos: 1 })
  })

  it('entre turnos: avisa que prende a la noche', () => {
    const e = estadoHorno(f(27, 16, 0))
    expect(e).toEqual({ abierto: false, cuando: 'hoy', hora: '19:00' })
    expect(textoHorno(e)).toBe('Horno apagado. Prendemos hoy a las 19:00.')
  })

  it('después de la última hornada ya cuenta como cerrado', () => {
    expect(estadoHorno(f(27, 23, 25))).toEqual({ abierto: false, cuando: 'mañana', hora: '11:30' })
  })

  it('el lunes descansa: prende el martes', () => {
    expect(estadoHorno(f(26, 13, 0))).toEqual({ abierto: false, cuando: 'mañana', hora: '11:30' })
    expect(estadoHorno(f(25, 23, 59))).toEqual({ abierto: false, cuando: 'el martes', hora: '11:30' })
  })

  it('viernes y sábado a la noche hasta medianoche', () => {
    expect(estadoHorno(f(31, 23, 35))).toMatchObject({ abierto: true, minutos: 5, hora: '23:40' }) // sábado
  })

  it('el progreso va de 0 a 1 dentro de la hornada', () => {
    const e = estadoHorno(f(27, 12, 0))
    if (!e.abierto) throw new Error('debería estar abierto')
    expect(e.progreso).toBeCloseTo(0.5)
  })
})
