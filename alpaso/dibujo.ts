// Dibujo del vaso en SVG (devuelve markup, sin tocar el DOM) y su estado interpolable para animarlo.
import { capas, cubitos, esFrio, tamanio, type Bebida, type CapaId } from './vaso'

export const IDS_CAPAS: CapaId[] = ['jarabe', 'base', 'shots', 'relleno', 'espuma', 'crema']

export interface CapaDibujo {
  id: CapaId
  color: string
  desde: number
  alto: number
}

/** Todo lo que se anima: números y colores. */
export interface EstadoVaso {
  escala: number
  capas: CapaDibujo[]
  /** 0 = caliente, 1 = frío (tapa, sorbete, vapor). */
  frio: number
  /** Cantidad de cubitos (puede ser fraccionaria durante la animación). */
  hielo: number
  canela: number
}

export function estadoDe(b: Bebida, anterior?: EstadoVaso): EstadoVaso {
  const cs = capas(b)
  return {
    escala: tamanio(b).escala,
    capas: IDS_CAPAS.map((id) => {
      const c = cs.find((x) => x.id === id)
      const prev = anterior?.capas.find((x) => x.id === id)
      if (c) return { id, color: c.color, desde: c.desde, alto: c.alto }
      // La capa que no está queda con alto 0 donde terminaría la de abajo.
      const abajo = cs.filter((x) => IDS_CAPAS.indexOf(x.id) < IDS_CAPAS.indexOf(id)).pop()
      return { id, color: prev?.color ?? '#ffffff', desde: abajo ? abajo.desde + abajo.alto : 0, alto: 0 }
    }),
    frio: esFrio(b) ? 1 : 0,
    hielo: cubitos(b),
    canela: b.extras.includes('canela') ? 1 : 0,
  }
}

// ---------- Interpolación ----------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
function mezclar(a: string, b: string, t: number): string {
  if (a === b || t >= 1) return b
  const [x, y] = [rgb(a), rgb(b)]
  return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join('')
}

export function interpolar(a: EstadoVaso, b: EstadoVaso, t: number): EstadoVaso {
  return {
    escala: lerp(a.escala, b.escala, t),
    capas: b.capas.map((c, i) => ({
      id: c.id,
      color: mezclar(a.capas[i].color, c.color, t),
      desde: lerp(a.capas[i].desde, c.desde, t),
      alto: lerp(a.capas[i].alto, c.alto, t),
    })),
    frio: lerp(a.frio, b.frio, t),
    hielo: lerp(a.hielo, b.hielo, t),
    canela: lerp(a.canela, b.canela, t),
  }
}

// ---------- Dibujo ----------
const f = (n: number) => Math.round(n * 10) / 10
const PISO = 284
const ALTO = 222
const ANCHO_ARRIBA = 148
const ANCHO_ABAJO = 104
const BORDE = 5

const CUBOS = [
  { x: -24, y: 0.8, g: 14 },
  { x: 16, y: 0.74, g: -10 },
  { x: -4, y: 0.6, g: 28 },
  { x: 30, y: 0.56, g: 6 },
  { x: -32, y: 0.5, g: -18 },
]

const CANELA = [
  [-38, 0], [-22, 3], [-8, -1], [6, 2], [20, -2], [34, 1], [-30, 5], [12, 5], [28, 4], [-14, 6], [0, 4], [42, -1],
]

export function svgVaso(e: EstadoVaso, uid: string): string {
  const h = ALTO * e.escala
  const arriba = PISO - h
  const wa = (ANCHO_ARRIBA * e.escala) / 2
  const wb = (ANCHO_ABAJO * e.escala) / 2
  // Interior del vaso (para recortar el líquido).
  const ia = arriba + 10
  const ib = PISO - BORDE
  const hi = ib - ia
  const anchoEn = (y: number) => lerp(wb, wa, (PISO - y) / h) - BORDE
  const interior = `${f(100 - anchoEn(ia))},${f(ia)} ${f(100 + anchoEn(ia))},${f(ia)} ${f(100 + anchoEn(ib))},${f(ib)} ${f(100 - anchoEn(ib))},${f(ib)}`
  const yDe = (frac: number) => ib - frac * hi

  const rects = e.capas
    .filter((c) => c.alto > 0.002)
    .map((c) => {
      const y1 = yDe(c.desde + c.alto)
      const alto = c.alto * hi
      return `<rect x="0" y="${f(y1)}" width="200" height="${f(alto + 0.6)}" fill="${c.color}"/><rect x="0" y="${f(y1)}" width="200" height="1.6" fill="#fff" opacity=".22"/>`
    })
    .join('')

  const tope = e.capas.reduce((m, c) => Math.max(m, c.desde + c.alto), 0)
  const yTope = yDe(tope)
  const crema = e.capas.find((c) => c.id === 'crema')!
  const espuma = e.capas.find((c) => c.id === 'espuma')!

  const cubos = CUBOS.map((c, i) => {
    const op = Math.max(0, Math.min(1, e.hielo - i))
    if (op <= 0) return ''
    const lado = 24 * e.escala
    const cy = yDe(Math.min(c.y, tope - 0.05) * Math.min(1, tope / 0.8))
    const cx = 100 + c.x * e.escala
    return `<g opacity="${f(op * 0.95)}" transform="translate(${f(cx)} ${f(cy)}) rotate(${c.g})"><rect x="${f(-lado / 2)}" y="${f(-lado / 2)}" width="${f(lado)}" height="${f(lado)}" rx="5" fill="#eaf6ff" fill-opacity=".55" stroke="#fff" stroke-width="2"/><path d="M${f(-lado / 2 + 5)} ${f(-lado / 2 + 7)} l${f(lado / 3)} -2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g>`
  }).join('')

  const copos =
    crema.alto > 0.01
      ? Array.from({ length: 7 }, (_, i) => {
          const x = 100 - anchoEn(yTope) + (i + 0.5) * ((anchoEn(yTope) * 2) / 7)
          return `<circle cx="${f(x)}" cy="${f(yTope + 2)}" r="${f(11 * e.escala * Math.min(1, crema.alto / 0.12))}" fill="${crema.color}"/>`
        }).join('')
      : ''

  const burbujas =
    espuma.alto > 0.01 && crema.alto < 0.01
      ? [-30, -12, 8, 26, -20, 18].map((x, i) => `<circle cx="${f(100 + x * e.escala)}" cy="${f(yTope + 6 + (i % 2) * 6)}" r="${i % 3 ? 2 : 3}" fill="#fff" opacity=".7"/>`).join('')
      : ''

  const canela =
    e.canela > 0.01
      ? `<g opacity="${f(e.canela)}" fill="#8a4a1f">${CANELA.map(([x, y]) => `<circle cx="${f(100 + x * e.escala)}" cy="${f(yTope + 4 + y - (crema.alto > 0.01 ? 8 * e.escala : 0))}" r="1.8"/>`).join('')}</g>`
      : ''

  const caliente = 1 - e.frio
  const vapor =
    caliente > 0.01
      ? `<g class="vapor" opacity="${f(caliente)}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">${[-22, 0, 22]
          .map((x, i) => `<path style="--i:${i}" d="M${f(100 + x)} ${f(arriba - 24)} c-8 -10 8 -16 0 -26 c-8 -10 8 -14 0 -22"/>`)
          .join('')}</g>`
      : ''

  const cuerpo = `M${f(100 - wa)} ${f(arriba)} L${f(100 + wa)} ${f(arriba)} L${f(100 + wb)} ${f(PISO)} Q${f(100 + wb)} ${f(PISO + 4)} ${f(100 + wb - 6)} ${f(PISO + 4)} L${f(100 - wb + 6)} ${f(PISO + 4)} Q${f(100 - wb)} ${f(PISO + 4)} ${f(100 - wb)} ${f(PISO)} Z`

  const tapaPlana = `<g opacity="${f(caliente)}"><rect x="${f(100 - wa - 7)}" y="${f(arriba - 12)}" width="${f(wa * 2 + 14)}" height="14" rx="7" fill="currentColor"/><rect x="${f(100 - wa + 8)}" y="${f(arriba - 20)}" width="${f(wa * 2 - 16)}" height="10" rx="5" fill="currentColor"/><rect x="${f(100 + wa - 34 * e.escala)}" y="${f(arriba - 17)}" width="${f(16 * e.escala)}" height="3" rx="1.5" fill="#fff" opacity=".5"/></g>`
  const domo = `<g opacity="${f(e.frio)}"><path d="M${f(100 - wa - 6)} ${f(arriba)} Q${f(100 - wa)} ${f(arriba - 40 * e.escala)} 100 ${f(arriba - 42 * e.escala)} Q${f(100 + wa)} ${f(arriba - 40 * e.escala)} ${f(100 + wa + 6)} ${f(arriba)} Z" fill="#fff" fill-opacity=".35" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><rect x="${f(100 - wa - 7)}" y="${f(arriba - 6)}" width="${f(wa * 2 + 14)}" height="9" rx="4.5" fill="currentColor"/></g>`
  const sorbete = `<g opacity="${f(e.frio)}"><path d="M${f(112)} ${f(ib - 30)} L${f(124 + 6 * e.escala)} ${f(arriba - 70 * e.escala)}" stroke="currentColor" stroke-width="12" stroke-linecap="round"/><path d="M${f(112)} ${f(ib - 30)} L${f(124 + 6 * e.escala)} ${f(arriba - 70 * e.escala)}" stroke="var(--sorbete, #ff5c93)" stroke-width="6" stroke-linecap="round"/></g>`

  return `<defs><clipPath id="${uid}-in"><polygon points="${interior}"/></clipPath></defs>
<ellipse cx="100" cy="${PISO + 8}" rx="${f(wb + 18)}" ry="7" fill="currentColor" opacity=".14"/>
${vapor}
${sorbete}
<path d="${cuerpo}" fill="#fff" fill-opacity=".55"/>
<g clip-path="url(#${uid}-in)">${rects}${cubos}${burbujas}${copos}${canela}</g>
<path d="M${f(100 - wa + 12)} ${f(arriba + 18)} L${f(100 - wb + 9)} ${f(PISO - 16)}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
<path d="${cuerpo}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
${domo}
${tapaPlana}`
}
