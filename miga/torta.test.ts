import { describe, expect, it } from 'vitest'
import {
  alternarRelleno,
  claveFecha,
  DE_LA_CASA,
  enlaceWhatsApp,
  estadoDia,
  estaCompleto,
  faltantes,
  grillaCalendario,
  limpiarMensaje,
  MAX_MENSAJE,
  precio,
  proximosDias,
  senia,
  textoPedido,
  tortaInicial,
  turnosDisponibles,
} from './torta'

// Lunes 19 de octubre de 2026, 11:00 (hora local).
const AHORA = new Date(2026, 9, 19, 11, 0)

describe('precio', () => {
  it('la torta base de 15 porciones', () => {
    expect(precio(tortaInicial())).toBe(58000)
  })

  it('suma recargos por porción', () => {
    // 20 porciones: 76.000 + (250 red velvet + 260 mousse + 120 buttercream) × 20
    const t = { ...tortaInicial(), porciones: 20, bizcochuelo: 'redvelvet', rellenos: ['frutosrojos'], cobertura: 'buttercream' }
    expect(precio(t)).toBe(76000 + 630 * 20)
  })

  it('el mensaje escrito suma solo si tiene texto', () => {
    expect(precio({ ...tortaInicial(), mensaje: '   ' })).toBe(58000)
    expect(precio({ ...tortaInicial(), mensaje: 'Feliz cumple' })).toBe(60500)
  })

  it('rechaza tamaños que no existen', () => {
    expect(() => precio({ ...tortaInicial(), porciones: 12 })).toThrow('12 porciones')
  })

  it('la seña es la mitad, redondeada hacia arriba', () => {
    expect(senia(58000)).toBe(29000)
    expect(senia(58100)).toBe(29100)
    expect(senia(58300)).toBe(29200)
  })

  it('las tortas de la casa tienen precio válido', () => {
    for (const t of DE_LA_CASA) expect(precio(t)).toBeGreaterThan(40000)
  })
})

describe('rellenos', () => {
  it('permite hasta dos', () => {
    let t = alternarRelleno(tortaInicial(), 'ganache')
    expect(t.rellenos).toEqual(['ddl', 'ganache'])
    expect(() => alternarRelleno(t, 'pistacho')).toThrow('hasta 2')
    t = alternarRelleno(t, 'ddl')
    expect(t.rellenos).toEqual(['ganache'])
  })

  it('no deja la torta sin relleno', () => {
    expect(() => alternarRelleno(tortaInicial(), 'ddl')).toThrow('al menos un relleno')
  })
})

describe('mensaje', () => {
  it('corta en el máximo y junta espacios', () => {
    expect(limpiarMensaje('  Feliz   cumple')).toBe('Feliz cumple')
    expect([...limpiarMensaje('a'.repeat(40))]).toHaveLength(MAX_MENSAJE)
  })

  it('cuenta emojis como un caracter', () => {
    expect(limpiarMensaje('🎉'.repeat(30))).toBe('🎉'.repeat(MAX_MENSAJE))
  })
})

describe('fechas de retiro', () => {
  it('exige 48 h de anticipación por horario', () => {
    expect(turnosDisponibles('2026-10-20', AHORA)).toEqual([])
    expect(turnosDisponibles('2026-10-21', AHORA)).toEqual(['12:00', '16:00', '18:00'])
    expect(turnosDisponibles('2026-10-22', AHORA)).toHaveLength(4)
  })

  it('los lunes está cerrado y el domingo hay menos horarios', () => {
    expect(estadoDia('2026-10-26', AHORA).estado).toBe('cerrado')
    expect(turnosDisponibles('2026-10-25', AHORA)).toEqual(['10:00', '12:00'])
  })

  it('marca los días sin anticipación suficiente', () => {
    expect(estadoDia('2026-10-19', AHORA).estado).toBe('cerrado')
    expect(estadoDia('2026-10-20', AHORA).estado).toBe('anticipacion')
  })

  it('bloquea los días con la agenda llena', () => {
    const dias = proximosDias(AHORA)
    const llenos = dias.filter((d) => d.estado === 'completo')
    expect(llenos.length).toBeGreaterThan(0)
    for (const d of llenos) {
      expect(estaCompleto(d.clave)).toBe(true)
      expect(d.turnos).toEqual([])
    }
    for (const d of dias.filter((x) => x.estado === 'libre')) expect(d.turnos.length).toBeGreaterThan(0)
  })

  it('muestra cuatro semanas desde hoy', () => {
    const dias = proximosDias(AHORA)
    expect(dias).toHaveLength(28)
    expect(dias[0].clave).toBe('2026-10-19')
    expect(dias[27].clave).toBe('2026-11-15')
  })

  it('arma la grilla empezando en lunes', () => {
    const dias = proximosDias(new Date(2026, 9, 22, 9, 0)) // jueves
    const grilla = grillaCalendario(dias)
    expect(grilla.slice(0, 3)).toEqual([null, null, null])
    expect(grilla[3]?.clave).toBe('2026-10-22')
  })

  it('cruza fin de mes con fechas locales', () => {
    expect(claveFecha(new Date(2026, 9, 31 + 1))).toBe('2026-11-01')
  })
})

describe('pedido', () => {
  it('pide día y horario antes de enviar', () => {
    expect(faltantes({ clave: null, hora: null })).toEqual(['el día de retiro', 'el horario'])
    expect(faltantes({ clave: '2026-10-22', hora: '10:00' })).toEqual([])
  })

  it('arma el texto completo para WhatsApp', () => {
    const t = { ...tortaInicial(), mensaje: 'Feliz cumple, Sofi' }
    const texto = textoPedido(t, { clave: '2026-10-22', hora: '16:00' }, 'Laura')
    expect(texto).toContain('Soy Laura')
    expect(texto).toContain('15 porciones')
    expect(texto).toContain('Mensaje: "Feliz cumple, Sofi"')
    expect(texto).toContain('jueves, 22 de octubre a las 16:00 h')
    expect(texto).toMatch(/Total: \$\s60\.500 · Seña \(50 %\): \$\s30\.300/)
    expect(enlaceWhatsApp(texto)).toMatch(/^https:\/\/wa\.me\/\d+\?text=%C2%A1Hola/)
  })
})
