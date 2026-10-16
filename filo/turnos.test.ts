import { describe, expect, it } from 'vitest'
import { SERVICIOS, abierto, horarios, ics, ocupados, type Turno } from './turnos'

const martes = new Date(2026, 9, 20) // martes 20/10/2026
const corte = SERVICIOS.find((s) => s.id === 'corte')!
const color = SERVICIOS.find((s) => s.id === 'color')!

describe('días', () => {
  it('abre de martes a sábado', () => {
    expect(abierto(martes)).toBe(true)
    expect(abierto(new Date(2026, 9, 19))).toBe(false) // lunes
    expect(abierto(new Date(2026, 9, 25))).toBe(false) // domingo
  })
})

describe('horarios', () => {
  const antes = new Date(2026, 9, 1, 9)

  it('un horario libre no pisa ningún bloque ocupado del barbero', () => {
    const oc = ocupados('nico', martes)
    for (const h of horarios(color, 'nico', martes, antes)) {
      if (!h.barbero) continue
      for (let m = h.inicio; m < h.inicio + 90; m += 30) expect(oc.has(m)).toBe(false)
    }
  })

  it('el servicio tiene que terminar antes del cierre', () => {
    const ultimos = horarios(color, 'nico', martes, antes).map((h) => h.inicio)
    expect(Math.max(...ultimos)).toBe(20 * 60 - 90)
  })

  it('"cualquiera" encuentra lugar si algún barbero está libre', () => {
    const uno = horarios(corte, 'nico', martes, antes)
    const todos = horarios(corte, 'cualquiera', martes, antes)
    expect(todos.filter((h) => h.barbero).length).toBeGreaterThanOrEqual(uno.filter((h) => h.barbero).length)
  })

  it('Majo no trabaja los martes', () => {
    expect(horarios(corte, 'majo', martes, antes).every((h) => h.barbero === null)).toBe(true)
  })

  it('hoy no ofrece horarios que ya pasaron', () => {
    const ahora = new Date(2026, 9, 20, 15, 10)
    expect(Math.min(...horarios(corte, 'nico', martes, ahora).map((h) => h.inicio))).toBeGreaterThanOrEqual(16 * 60)
  })

  it('un turno propio ocupa sus bloques', () => {
    const libre = horarios(corte, 'lean', martes, antes).find((h) => h.barbero)!
    const propio: Turno = { codigo: 'X', servicio: 'corte', barbero: 'lean', dia: '2026-10-20', inicio: libre.inicio, minutos: 30, nombre: 'A' }
    const despues = horarios(corte, 'lean', martes, antes, [propio]).find((h) => h.inicio === libre.inicio)!
    expect(despues.barbero).toBeNull()
  })
})

describe('ics', () => {
  it('arma el evento con inicio y fin', () => {
    const t: Turno = { codigo: 'AB12CD', servicio: 'combo', barbero: 'nico', dia: '2026-10-20', inicio: 15 * 60 + 30, minutos: 60, nombre: 'Juan' }
    const texto = ics(t)
    expect(texto).toContain('DTSTART;TZID=America/Argentina/Buenos_Aires:20261020T153000')
    expect(texto).toContain('DTEND;TZID=America/Argentina/Buenos_Aires:20261020T163000')
    expect(texto).toContain('SUMMARY:Corte + barba con Nico en Filo')
  })
})
