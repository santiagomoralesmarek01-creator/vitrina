import { describe, expect, it } from 'vitest'
import { GUSTOS } from './gustos'
import { mezclar, nuevaPregunta, puntajeInicial, responder, titulo } from './juego'

/** Azar con semilla (mulberry32) para que los tests sean repetibles. */
function semilla(s: number) {
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('preguntas', () => {
  it('trae tres opciones distintas con la correcta adentro', () => {
    const azar = semilla(7)
    for (let i = 0; i < 200; i++) {
      const p = nuevaPregunta(azar)
      expect(p.opciones).toHaveLength(3)
      expect(new Set(p.opciones).size).toBe(3)
      expect(p.opciones).toContain(p.correcta)
      expect(p.opciones.every((id) => GUSTOS.some((g) => g.id === id))).toBe(true)
    }
  })

  it('no repite el gusto anterior', () => {
    const azar = semilla(3)
    let anterior: string | undefined
    for (let i = 0; i < 100; i++) {
      const p = nuevaPregunta(azar, anterior)
      expect(p.correcta).not.toBe(anterior)
      anterior = p.correcta
    }
  })

  it('la correcta no cae siempre en el mismo lugar', () => {
    const azar = semilla(11)
    const lugares = new Set<number>()
    for (let i = 0; i < 60; i++) {
      const p = nuevaPregunta(azar)
      lugares.add(p.opciones.indexOf(p.correcta))
    }
    expect(lugares.size).toBe(3)
  })

  it('mezclar no pierde ni duplica', () => {
    expect(mezclar([1, 2, 3, 4], semilla(1)).sort()).toEqual([1, 2, 3, 4])
  })
})

describe('puntaje', () => {
  const p = { correcta: 'carne', opciones: ['pollo', 'carne', 'humita'] }

  it('suma aciertos y racha', () => {
    let r = responder(puntajeInicial(), p, 'carne')
    expect(r.acierto).toBe(true)
    r = responder(r.puntaje, p, 'carne')
    expect(r.puntaje).toEqual({ aciertos: 2, jugadas: 2, racha: 2, mejorRacha: 2 })
  })

  it('un error corta la racha pero guarda la mejor', () => {
    let s = puntajeInicial()
    for (let i = 0; i < 3; i++) s = responder(s, p, 'carne').puntaje
    const r = responder(s, p, 'pollo')
    expect(r.acierto).toBe(false)
    expect(r.puntaje).toEqual({ aciertos: 3, jugadas: 4, racha: 0, mejorRacha: 3 })
  })

  it('pone título según cómo te va', () => {
    expect(titulo(puntajeInicial())).toBe('Sin jugar todavía')
    expect(titulo({ aciertos: 3, jugadas: 3, racha: 3, mejorRacha: 3 })).toBe('Ojo de empanadero')
    expect(titulo({ aciertos: 0, jugadas: 3, racha: 0, mejorRacha: 0 })).toBe('Hay que comer más empanadas')
  })
})
