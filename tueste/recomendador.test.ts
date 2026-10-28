import { describe, expect, it } from 'vitest'
import { ORIGENES } from './cafes'
import { PREGUNTAS, elegirBebida, recomendar, type Respuestas } from './recomendador'

const r = (x: Partial<Respuestas> = {}): Respuestas => ({ leche: 'solo', sabor: 'frutado', intensidad: 'suave', temperatura: 'caliente', ...x })

describe('bebida y método', () => {
  it('solo, frutado, suave y caliente: V60', () => {
    const rec = recomendar(r())
    expect(rec.bebida.id).toBe('v60')
    expect(rec.metodo).toBe('v60')
  })

  it('floral y suave: Chemex', () => {
    expect(elegirBebida(r({ sabor: 'floral' })).metodo).toBe('chemex')
  })

  it('achocolatado, intenso y solo: espresso', () => {
    expect(elegirBebida(r({ sabor: 'achocolatado', intensidad: 'intenso' })).id).toBe('espresso')
  })

  it('frutado e intenso en caliente: AeroPress', () => {
    expect(elegirBebida(r({ intensidad: 'intenso' })).metodo).toBe('aeropress')
  })

  it('frío, solo y achocolatado intenso: cold brew', () => {
    expect(elegirBebida(r({ sabor: 'achocolatado', intensidad: 'intenso', temperatura: 'frio' })).metodo).toBe('coldbrew')
  })

  it('con leche siempre recomienda una bebida con leche', () => {
    for (const sabor of ['frutado', 'achocolatado', 'floral'] as const)
      for (const intensidad of ['intenso', 'suave'] as const)
        for (const temperatura of ['caliente', 'frio'] as const)
          expect(elegirBebida({ leche: 'con-leche', sabor, intensidad, temperatura }).conLeche).toBe(true)
  })

  it('sin leche nunca recomienda una bebida con leche', () => {
    for (const sabor of ['frutado', 'achocolatado', 'floral'] as const)
      for (const intensidad of ['intenso', 'suave'] as const)
        for (const temperatura of ['caliente', 'frio'] as const)
          expect(elegirBebida({ leche: 'solo', sabor, intensidad, temperatura }).conLeche).toBe(false)
  })
})

describe('café de origen', () => {
  it('frutado y suave: un africano de acidez alta', () => {
    expect(recomendar(r()).origen.id).toBe('kenia')
  })

  it('floral: Etiopía o Colombia', () => {
    expect(['etiopia', 'colombia']).toContain(recomendar(r({ sabor: 'floral' })).origen.id)
  })

  it('achocolatado con leche: el de más cuerpo con notas de cacao', () => {
    expect(recomendar(r({ sabor: 'achocolatado', leche: 'con-leche' })).origen.id).toBe('brasil')
  })

  it('el café elegido siempre tiene al menos una familia del sabor pedido', () => {
    const familias = { frutado: ['frutado', 'vinoso', 'citrico'], achocolatado: ['chocolate', 'dulce'], floral: ['floral', 'citrico'] }
    for (const sabor of ['frutado', 'achocolatado', 'floral'] as const) {
      const o = recomendar(r({ sabor, leche: 'con-leche', intensidad: 'intenso' })).origen
      expect(o.familias.some((f) => familias[sabor].includes(f))).toBe(true)
    }
  })

  it('explica el porqué en tres frases que nombran el origen', () => {
    const rec = recomendar(r({ leche: 'con-leche' }))
    expect(rec.porque).toHaveLength(3)
    expect(rec.porque[1]).toContain(rec.origen.pais)
    expect(rec.porque[1]).toContain('leche')
  })

  it('funciona con una carta reducida', () => {
    expect(recomendar(r({ sabor: 'floral' }), [ORIGENES[4]]).origen.id).toBe('brasil')
  })
})

describe('preguntas', () => {
  it('son cuatro y cada una tiene opciones', () => {
    expect(PREGUNTAS).toHaveLength(4)
    for (const p of PREGUNTAS) expect(p.opciones.length).toBeGreaterThanOrEqual(2)
  })
})
