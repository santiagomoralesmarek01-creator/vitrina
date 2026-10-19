import { describe, expect, it } from 'vitest'
import {
  COMBOS,
  HORARIOS,
  MESAS,
  ahorro,
  codigoReserva,
  entra,
  estadoMesa,
  estaCerrado,
  horariosLibres,
  mesasDisponibles,
  ocupada,
  platosDe,
  proximosDias,
} from './reservas'

const mesa = (id: string) => MESAS.find((m) => m.id === id)!

describe('salón', () => {
  it('tiene 12 mesas de 2, 4 y 6 con números únicos', () => {
    expect(MESAS).toHaveLength(12)
    expect(new Set(MESAS.map((m) => m.numero)).size).toBe(12)
    expect(new Set(MESAS.map((m) => m.capacidad))).toEqual(new Set([2, 4, 6]))
  })

  it('horarios de 9:00 a 15:00 cada media hora', () => {
    expect(HORARIOS[0]).toBe('9:00')
    expect(HORARIOS[1]).toBe('9:30')
    expect(HORARIOS.at(-1)).toBe('15:00')
    expect(HORARIOS).toHaveLength(13)
  })
})

describe('días', () => {
  it('los lunes está cerrado', () => {
    expect(estaCerrado('2026-10-19')).toBe(true) // lunes
    expect(estaCerrado('2026-10-18')).toBe(false) // domingo
  })

  it('arma los próximos 7 días marcando el lunes', () => {
    const dias = proximosDias(new Date(2026, 9, 17, 10, 0)) // sábado
    expect(dias).toHaveLength(7)
    expect(dias[0]).toMatchObject({ iso: '2026-10-17', nombre: 'hoy', cerrado: false })
    expect(dias[1].nombre).toBe('mañana')
    expect(dias[2]).toMatchObject({ iso: '2026-10-19', cerrado: true, corto: 'lun' })
    expect(dias.filter((d) => d.cerrado)).toHaveLength(1)
  })

  it('cruza fin de mes sin problemas', () => {
    const dias = proximosDias(new Date(2026, 9, 29))
    expect(dias.map((d) => d.iso)).toContain('2026-11-02')
  })

  it('hoy solo ofrece horarios con media hora de anticipación', () => {
    const ahora = new Date(2026, 9, 18, 12, 10)
    expect(horariosLibres('2026-10-18', ahora)).toEqual(['13:00', '13:30', '14:00', '14:30', '15:00'])
    expect(horariosLibres('2026-10-20', ahora)).toHaveLength(13)
    expect(horariosLibres('2026-10-19', ahora)).toEqual([])
    expect(horariosLibres('2026-10-17', ahora)).toEqual([])
  })
})

describe('capacidad', () => {
  it('entran todos y no sobran más de dos sillas', () => {
    expect(entra(mesa('v1'), 2)).toBe(true)
    expect(entra(mesa('v1'), 3)).toBe(false)
    expect(entra(mesa('v4'), 2)).toBe(true)
    expect(entra(mesa('s7'), 2)).toBe(false)
    expect(entra(mesa('s7'), 5)).toBe(true)
    expect(entra(mesa('s7'), 7)).toBe(false)
  })
})

describe('disponibilidad', () => {
  it('es determinística para el mismo día y horario', () => {
    const a = MESAS.map((m) => ocupada(m, '2026-10-24', '11:00'))
    const b = MESAS.map((m) => ocupada(m, '2026-10-24', '11:00'))
    expect(a).toEqual(b)
  })

  it('cambia entre horarios y nunca está todo lleno ni todo vacío en una semana', () => {
    const dias = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']
    const total = dias.flatMap((d) => HORARIOS.flatMap((h) => MESAS.map((m) => ocupada(m, d, h))))
    const llenas = total.filter(Boolean).length
    expect(llenas).toBeGreaterThan(total.length * 0.15)
    expect(llenas).toBeLessThan(total.length * 0.7)
  })

  it('el lunes todas las mesas figuran ocupadas', () => {
    expect(MESAS.every((m) => ocupada(m, '2026-10-19', '10:00'))).toBe(true)
    expect(mesasDisponibles('2026-10-19', '10:00', 2)).toEqual([])
  })

  it('solo ofrece mesas libres donde entra el grupo', () => {
    for (const m of mesasDisponibles('2026-10-22', '9:30', 4)) {
      expect(entra(m, 4)).toBe(true)
      expect(estadoMesa(m, '2026-10-22', '9:30', 4)).toBe('libre')
    }
    const chica = mesa('v1')
    if (!ocupada(chica, '2026-10-22', '9:30')) expect(estadoMesa(chica, '2026-10-22', '9:30', 6)).toBe('no-entra')
  })
})

describe('código de reserva', () => {
  it('tiene formato DOM-XXXXX y es estable', () => {
    const c = codigoReserva('2026-10-25', '11:30', 'p9', 6)
    expect(c).toMatch(/^DOM-[A-Z0-9]{5}$/)
    expect(codigoReserva('2026-10-25', '11:30', 'p9', 6)).toBe(c)
  })

  it('no usa caracteres que se confunden al dictar', () => {
    const c = codigoReserva('2026-10-25', '11:30', 'p9', 6).slice(4)
    expect(c).not.toMatch(/[01OILZS258B]/)
  })

  it('cambia si cambia la mesa o el horario', () => {
    expect(codigoReserva('2026-10-25', '11:30', 'p9', 6)).not.toBe(codigoReserva('2026-10-25', '12:00', 'p9', 6))
    expect(codigoReserva('2026-10-25', '11:30', 'p9', 6)).not.toBe(codigoReserva('2026-10-25', '11:30', 's7', 6))
  })
})

describe('menú', () => {
  it('separa dulce y salado', () => {
    expect(platosDe('dulce').every((p) => p.tipo === 'dulce')).toBe(true)
    expect(platosDe('dulce').length + platosDe('salado').length).toBe(12)
  })

  it('los combos siempre convienen', () => {
    for (const c of COMBOS) expect(ahorro(c)).toBeGreaterThan(0)
  })
})
