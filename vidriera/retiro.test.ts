import { describe, expect, it } from 'vitest'
import { calendario, clave, dia, fechaLarga, horariosDisponibles, primerRetiro, retiroLargo, sePuede } from './retiro'

// Miércoles 28 de octubre de 2026, 15:30.
const AHORA = new Date(2026, 9, 28, 15, 30)

describe('48 h de aviso', () => {
  it('hoy y mañana no se puede', () => {
    expect(dia('2026-10-28', AHORA).estado).toBe('aviso')
    expect(dia('2026-10-29', AHORA).estado).toBe('aviso')
  })

  it('pasado mañana sólo los horarios que quedan después de las 48 h', () => {
    expect(horariosDisponibles('2026-10-30', AHORA)).toEqual(['17:00', '19:00'])
    expect(sePuede('2026-10-30', '13:00', AHORA)).toBe(false)
    expect(sePuede('2026-10-30', '17:00', AHORA)).toBe(true)
  })

  it('justo a las 48 h se puede', () => {
    const ahora = new Date(2026, 9, 28, 17, 0)
    expect(horariosDisponibles('2026-10-30', ahora)).toEqual(['17:00', '19:00'])
  })

  it('si a las 48 h ya cerró, el día queda bloqueado por aviso', () => {
    const ahora = new Date(2026, 9, 28, 19, 30)
    expect(dia('2026-10-30', ahora).estado).toBe('aviso')
    expect(dia('2026-10-30', ahora).motivo).toContain('48 h')
  })
})

describe('días cerrados', () => {
  it('los lunes cierra', () => {
    const d = dia('2026-11-02', AHORA)
    expect(d.estado).toBe('cerrado')
    expect(d.horarios).toEqual([])
  })

  it('los feriados cierra aunque no sea lunes', () => {
    const d = dia('2026-12-08', AHORA)
    expect(d.estado).toBe('cerrado')
    expect(d.motivo).toContain('Inmaculada')
    expect(horariosDisponibles('2026-12-08', AHORA)).toEqual([])
  })

  it('el domingo tiene menos horarios', () => {
    expect(dia('2026-11-01', AHORA).horarios).toEqual(['09:00', '12:00'])
  })

  it('los días anteriores a hoy figuran como pasados', () => {
    expect(dia('2026-10-26', AHORA).estado).toBe('pasado')
  })
})

describe('calendario', () => {
  it('arranca el lunes de esta semana y trae semanas completas', () => {
    const c = calendario(AHORA, 5)
    expect(c).toHaveLength(35)
    expect(c[0].clave).toBe('2026-10-26')
    expect(c[0].fecha.getDay()).toBe(1)
    expect(c.at(-1)!.clave).toBe('2026-11-29')
  })

  it('cruza de mes y de año sin problemas', () => {
    const c = calendario(new Date(2026, 11, 30, 9, 0), 2)
    expect(c.map((d) => d.clave)).toContain('2027-01-01')
    expect(c.find((d) => d.clave === '2027-01-01')!.estado).toBe('cerrado')
  })

  it('primer retiro posible', () => {
    expect(primerRetiro(AHORA)).toEqual({ clave: '2026-10-30', hora: '17:00' })
    // Sábado a la noche: domingo y lunes no; el martes a las 10 ya pasaron 48 h.
    expect(primerRetiro(new Date(2026, 9, 31, 20, 0))).toEqual({ clave: '2026-11-03', hora: '10:00' })
  })
})

describe('textos de fecha', () => {
  it('escribe la fecha en castellano', () => {
    expect(clave(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(fechaLarga('2026-10-31')).toBe('sábado 31 de octubre')
    expect(retiroLargo('2026-11-04', '10:00')).toBe('miércoles 4 de noviembre a las 10:00')
  })
})
