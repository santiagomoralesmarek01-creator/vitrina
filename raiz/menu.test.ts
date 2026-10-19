import { describe, expect, it } from 'vitest'
import {
  MENU,
  PRECIO_MENU,
  clampComensales,
  pasosPara,
  precioMaridaje,
  proximasFechas,
  totales,
  turnosDelDia,
  validarReserva,
  type Restriccion,
} from './menu'

describe('pasos según restricciones', () => {
  it('sin restricciones sirve los siete originales', () => {
    const pasos = pasosPara([])
    expect(pasos).toHaveLength(7)
    expect(pasos.map((p) => p.plato.id)).toEqual(MENU.map((p) => p.plato.id))
    expect(pasos.every((p) => p.original === null && p.cambio.length === 0)).toBe(true)
  })

  it('vegetariano cambia la trucha y el cordero, y marca el cambio', () => {
    const pasos = pasosPara(['vegetariano'])
    const cambiados = pasos.filter((p) => p.original)
    expect(cambiados.map((p) => p.plato.id)).toEqual(['hinojo', 'calabaza'])
    expect(cambiados[0].original?.id).toBe('trucha')
    expect(cambiados[0].cambio).toEqual(['vegetariano'])
  })

  it('sin TACC elige la versión más cercana al original', () => {
    const pasos = pasosPara(['sinTacc'])
    expect(pasos.map((p) => p.plato.id)).toEqual(['mandioca', 'esparragos', 'trucha', 'hongos', 'cordero-sin-tacc', 'quesos-sin-tacc', 'frutillas'])
  })

  it('con las dos restricciones todos los pasos las cumplen', () => {
    const r: Restriccion[] = ['vegetariano', 'sinTacc']
    const pasos = pasosPara(r)
    expect(pasos.every((p) => r.every((x) => p.plato.aptoPara.includes(x)))).toBe(true)
    expect(pasos[4].plato.id).toBe('calabaza')
    expect(pasos[4].cambio).toEqual(['vegetariano', 'sinTacc'])
    // El queso ya era vegetariano: sólo cambia por TACC.
    expect(pasos[5].cambio).toEqual(['sinTacc'])
  })

  it('avisa si un paso no tiene alternativa', () => {
    const menu = [{ ...MENU[2], alternativas: [] }]
    expect(() => pasosPara(['vegetariano'], menu)).toThrow('paso 3')
  })
})

describe('totales', () => {
  it('el maridaje suma las siete copas', () => {
    expect(precioMaridaje(pasosPara([]))).toBe(6500 + 7200 + 7800 + 8400 + 9200 + 8600 + 6900)
    // La calabaza va con otra copa.
    expect(precioMaridaje(pasosPara(['vegetariano']))).toBe(54600 - 9200 + 8800)
  })

  it('menú por comensales, sin maridaje', () => {
    const t = totales(pasosPara([]), false, 3)
    expect(t.total).toBe(PRECIO_MENU * 3)
    expect(t.maridaje).toBe(0)
  })

  it('con maridaje y seña del 30 %', () => {
    const t = totales(pasosPara([]), true, 2)
    expect(t.porPersona).toBe(85000 + 54600)
    expect(t.total).toBe(279200)
    expect(t.senia).toBe(83760)
    expect(t.saldo).toBe(279200 - 83760)
  })

  it('comensales entre 2 y 8', () => {
    expect(clampComensales(1)).toBe(2)
    expect(clampComensales(12)).toBe(8)
    expect(clampComensales(Number.NaN)).toBe(2)
    expect(totales(pasosPara([]), false, 20).comensales).toBe(8)
  })
})

describe('días y turnos', () => {
  it('lunes cerrado, domingo sólo a las 20, el resto los dos turnos', () => {
    expect(turnosDelDia(new Date(2026, 9, 19))).toEqual([]) // lunes
    expect(turnosDelDia(new Date(2026, 9, 25))).toEqual(['20:00']) // domingo
    expect(turnosDelDia(new Date(2026, 9, 24))).toEqual(['20:00', '22:30']) // sábado
  })

  it('ofrece los próximos 14 días desde mañana', () => {
    const fechas = proximasFechas(new Date(2026, 9, 19, 18, 30))
    expect(fechas).toHaveLength(14)
    expect(fechas[0].iso).toBe('2026-10-20')
    expect(fechas[13].iso).toBe('2026-11-02')
    expect(fechas.filter((f) => f.turnos.length === 0).map((f) => f.iso)).toEqual(['2026-10-26', '2026-11-02'])
  })

  it('cruza fin de mes sin problemas', () => {
    const fechas = proximasFechas(new Date(2026, 11, 25))
    expect(fechas[6].iso).toBe('2027-01-01')
  })

  it('valida la reserva', () => {
    const [martes] = proximasFechas(new Date(2026, 9, 19))
    const lunes = proximasFechas(new Date(2026, 9, 19))[6]
    expect(validarReserva(undefined, '20:00', 'Ana')).toMatch('fecha')
    expect(validarReserva(lunes, '20:00', 'Ana')).toMatch('cerrados')
    expect(validarReserva(martes, null, 'Ana')).toMatch('turno')
    expect(validarReserva(martes, '22:30', ' ')).toMatch('nombre')
    expect(validarReserva(martes, '22:30', 'Ana')).toBeNull()
  })
})
