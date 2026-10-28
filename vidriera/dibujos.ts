// Dibujos en SVG (texto) de las porciones, las masas finas y la torta entera. Sin DOM.
import { renglones, type Adorno, type DibujoMasa, type Porcion, type Torta } from './catalogo'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------- Porciones (vista de tres cuartos) ----------

const T = [16, 64] // punta
const R = [130, 54] // borde de afuera
const B = [106, 34] // atrás
const ALTO = 36

/** Puntos aleatorios pero siempre iguales para la misma semilla. */
function semilla(n: number) {
  let s = n
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

/** Un punto dentro de la cara de arriba de la porción. */
function enTope(r: () => number): [number, number] {
  let a = r()
  let b = r()
  if (a + b > 1) { a = 1 - a; b = 1 - b }
  const x = T[0] + (R[0] - T[0]) * a + (B[0] - T[0]) * b
  const y = T[1] + (R[1] - T[1]) * a + (B[1] - T[1]) * b
  return [x * 0.86 + 88 * 0.14, y * 0.86 + 50 * 0.14]
}

const beso = (x: number, y: number, k = 1, color = '#fbf2df', tostado = '#d29a55') =>
  `<path d="M${x} ${y} c${-7 * k} 0 ${-8 * k} ${-6 * k} ${-4 * k} ${-9 * k} c${2 * k} ${-1.5 * k} ${3 * k} ${-3 * k} ${4 * k} ${-6 * k} c${1 * k} ${3 * k} ${2 * k} ${4.5 * k} ${4 * k} ${6 * k} c${4 * k} ${3 * k} ${3 * k} ${9 * k} ${-4 * k} ${9 * k}z" fill="${color}" stroke="${tostado}" stroke-width="1.2"/>`

function adorno(a: Adorno, n: number): string {
  const r = semilla(n * 7 + 3)
  const p = () => enTope(r)
  const out: string[] = []
  switch (a) {
    case 'cacao':
      for (let i = 0; i < 26; i++) { const [x, y] = p(); out.push(`<circle cx="${x}" cy="${y}" r="${0.6 + r() * 0.9}" fill="#8a5a3c"/>`) }
      out.push(`<ellipse cx="80" cy="47" rx="9" ry="3.6" fill="#2b1813"/><ellipse cx="80" cy="46" rx="6" ry="2" fill="#4a2c22"/>`)
      break
    case 'merengue':
      for (const [x, y, k] of [[44, 60, 1], [64, 55, 1.1], [86, 50, 1.15], [104, 47, 1], [72, 45, 0.9], [96, 40, 0.85]]) out.push(beso(x, y, k))
      break
    case 'frutos':
      for (let i = 0; i < 9; i++) { const [x, y] = p(); out.push(`<circle cx="${x}" cy="${y}" r="3.4" fill="${i % 3 ? '#8f1630' : '#3b3a78'}"/><circle cx="${x - 1}" cy="${y - 1.2}" r="0.9" fill="#fff" opacity=".6"/>`) }
      break
    case 'cerezas':
      for (const [x, y] of [[48, 60], [76, 52], [104, 45]]) {
        out.push(`<path d="M${x - 7} ${y} q7 -9 14 0 q-7 5 -14 0z" fill="#fffaf2" stroke="#e7d8c2"/>`)
        out.push(`<path d="M${x} ${y - 6} q2 -8 7 -10" stroke="#5b3a1c" stroke-width="1.3" fill="none"/><circle cx="${x}" cy="${y - 5}" r="4.4" fill="#9b1028"/><circle cx="${x - 1.4}" cy="${y - 6.6}" r="1.2" fill="#fff" opacity=".7"/>`)
      }
      for (let i = 0; i < 10; i++) { const [x, y] = p(); out.push(`<rect x="${x}" y="${y}" width="4" height="1.6" rx=".8" fill="#3d2219" transform="rotate(${r() * 180} ${x} ${y})"/>`) }
      break
    case 'pistacho':
      for (let i = 0; i < 6; i++) { const [x, y] = p(); out.push(`<circle cx="${x}" cy="${y}" r="4" fill="#d23d5e"/><circle cx="${x}" cy="${y}" r="1.6" fill="#a82444"/>`) }
      for (let i = 0; i < 16; i++) { const [x, y] = p(); out.push(`<rect x="${x}" y="${y}" width="2.6" height="1.8" fill="#6f8d3a" transform="rotate(${r() * 90} ${x} ${y})"/>`) }
      break
    case 'ddl':
      out.push(`<path d="M30 60 l14 -7 l6 5 l14 -8 l6 5 l14 -8 l6 4 l14 -8" stroke="#a8642c" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
      for (let i = 0; i < 5; i++) { const [x, y] = p(); out.push(`<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="#7a4a24"/>`) }
      break
    case 'crema':
      for (const [x, y] of [[46, 59], [70, 53], [94, 47], [80, 42]]) {
        out.push(`<path d="M${x} ${y} c-5 -1 -7 -6 -3 -9 c1 -1 2 -1 3 0 c1 -1 2 -1 3 0 c4 3 2 8 -3 9z" fill="#d8283f"/><circle cx="${x - 1.4}" cy="${y - 5}" r=".7" fill="#ffe3a0"/><circle cx="${x + 1.2}" cy="${y - 3.6}" r=".7" fill="#ffe3a0"/>`)
      }
      break
    case 'glaseado':
      out.push(`<path d="M30 60 q30 -4 80 -14" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`)
      break
  }
  return out.join('')
}

/** Una porción de torta sobre su platito. */
export function svgPorcion(p: Porcion, n = 0): string {
  const totalPeso = p.capas.reduce((s, [, h]) => s + h, 0)
  let acum = 0
  const bandas = p.capas
    .map(([color, h]) => {
      const f0 = acum / totalPeso
      acum += h
      const f1 = acum / totalPeso
      const y = (base: number, f: number) => (base + ALTO * (1 - f)).toFixed(1)
      return `<polygon points="${T[0]},${y(T[1], f1)} ${R[0]},${y(R[1], f1)} ${R[0]},${y(R[1], f0)} ${T[0]},${y(T[1], f0)}" fill="${color}"/>`
    })
    .join('')
  return `<svg viewBox="0 0 146 118" aria-hidden="true" focusable="false">
    <ellipse cx="74" cy="100" rx="66" ry="14" class="platito"/>
    <ellipse cx="74" cy="98" rx="52" ry="9" class="platito-centro"/>
    <ellipse cx="74" cy="${R[1] + ALTO + 6}" rx="56" ry="6" fill="#000" opacity=".12"/>
    ${bandas}
    <polygon points="${T[0]},${T[1]} ${R[0]},${R[1]} ${R[0]},${R[1] + ALTO} ${T[0]},${T[1] + ALTO}" fill="url(#luz-corte)"/>
    <path d="M${T[0]} ${T[1]} L${R[0]} ${R[1]} Q${R[0] - 2} ${B[1] + 2} ${B[0]} ${B[1]} Z" fill="${p.tope}"/>
    <path d="M${T[0]} ${T[1]} L${R[0]} ${R[1]}" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>
    ${adorno(p.adorno, n)}
  </svg>`
}

/** Degradé compartido por todas las porciones (se pone una vez en la página). */
export const DEFS_PORCION = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="luz-corte" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/>
  </linearGradient></defs></svg>`

// ---------- Masas finas (vista desde arriba, en su pirotín) ----------

function masaDibujo(d: DibujoMasa): string {
  switch (d) {
    case 'tartaleta':
      return `<circle cx="30" cy="30" r="20" fill="#d9a35f"/><circle cx="30" cy="30" r="16" fill="#f5df9e"/>
        <path d="M23 22 c-6 2 -5 10 1 11 c5 -2 5 -9 -1 -11z" fill="#d42a40"/><path d="M38 24 c-5 -1 -9 5 -5 10 c6 0 8 -6 5 -10z" fill="#d42a40"/><path d="M28 34 c-5 3 -2 10 4 9 c3 -4 1 -9 -4 -9z" fill="#c21f36"/>
        <circle cx="24" cy="25" r="1.3" fill="#fff" opacity=".7"/><circle cx="36" cy="27" r="1.3" fill="#fff" opacity=".7"/><path d="M33 22 l3 -3" stroke="#5f7d3a" stroke-width="2" stroke-linecap="round"/>`
    case 'canoncito':
      return `<g transform="rotate(-32 30 30)"><rect x="8" y="23" width="44" height="14" rx="7" fill="#e3ad66"/>
        <path d="M14 23 v14 M20 23 v14 M26 23 v14 M32 23 v14 M38 23 v14 M44 23 v14" stroke="#c48a45" stroke-width="1.4"/>
        <ellipse cx="9" cy="30" rx="3.2" ry="5.5" fill="#9b5b26"/><ellipse cx="51" cy="30" rx="3.2" ry="5.5" fill="#9b5b26"/>
        <rect x="12" y="25" width="36" height="3" rx="1.5" fill="#fff" opacity=".55"/></g>`
    case 'palmerita':
      return `<path d="M30 46 C14 36 10 22 20 16 C26 13 30 18 30 22 C30 18 34 13 40 16 C50 22 46 36 30 46Z" fill="#dba25a"/>
        <path d="M30 22 C30 28 24 30 22 25 M30 22 C30 28 36 30 38 25 M30 30 C26 34 19 30 18 24 M30 30 C34 34 41 30 42 24" stroke="#b77a35" stroke-width="1.5" fill="none"/>
        <path d="M30 46 C14 36 10 22 20 16 C26 13 30 18 30 22 C30 18 34 13 40 16 C50 22 46 36 30 46Z" fill="#3a2019" clip-path="url(#pm-mitad)"/>
        <path d="M36 20 q5 2 6 7" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    case 'bombon':
      return `<circle cx="30" cy="30" r="18" fill="#3a2019"/><circle cx="30" cy="30" r="18" fill="url(#brillo-masa)"/>
        <rect x="27" y="22" width="4" height="3" fill="#8fae4f" transform="rotate(20 29 23)"/><rect x="32" y="27" width="3.6" height="2.6" fill="#a4c062" transform="rotate(-30 33 28)"/><rect x="25" y="30" width="3.4" height="2.4" fill="#7f9d42" transform="rotate(50 26 31)"/><rect x="31" y="33" width="3" height="2.4" fill="#a4c062"/>`
    case 'lemon':
      return `<circle cx="30" cy="30" r="19" fill="#d9a35f"/><circle cx="30" cy="30" r="15" fill="#f3d24f"/>
        <path d="M30 30 m-9 0 a9 9 0 1 0 18 0 a7 7 0 1 0 -14 0 a5 5 0 1 0 10 0 a3 3 0 1 0 -6 0" fill="#fbf2df" stroke="#d29a55" stroke-width="1.6"/>`
    case 'macaron':
      return `<circle cx="30" cy="30" r="19" fill="#e9879e"/><circle cx="30" cy="30" r="15.5" fill="none" stroke="#f6b7c5" stroke-width="2.4" stroke-dasharray="2 2"/>
        <circle cx="30" cy="30" r="13" fill="#ef99ad"/><ellipse cx="25" cy="24" rx="6" ry="3" fill="#fff" opacity=".35" transform="rotate(-30 25 24)"/>`
    case 'profiterol':
      return `<circle cx="30" cy="31" r="18" fill="#d49a52"/>
        <path d="M18 27 c2 -9 20 -12 25 -2 c2 4 -1 4 -2 8 c-1 3 -4 0 -5 3 c-1 3 -4 2 -5 -1 c-1 -3 -4 1 -6 -2 c-2 -2 -6 -1 -7 -6z" fill="#3a2019"/>
        <ellipse cx="26" cy="22" rx="5" ry="2.2" fill="#fff" opacity=".3" transform="rotate(-20 26 22)"/>`
    case 'alfajor':
      return `<circle cx="30" cy="30" r="19" fill="#b06f35"/><circle cx="30" cy="30" r="16" fill="#f4e4bd"/>
        ${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return `<circle cx="${(30 + Math.cos(a) * 17.6).toFixed(1)}" cy="${(30 + Math.sin(a) * 17.6).toFixed(1)}" r="1.6" fill="#fffaf0"/>` }).join('')}
        <circle cx="30" cy="30" r="16" fill="url(#brillo-masa)"/>`
  }
}

/** Una masa fina en su pirotín, vista desde arriba. */
export function svgMasa(d: DibujoMasa): string {
  return `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">
    <circle cx="30" cy="30" r="27" class="pirotin"/>
    <circle cx="30" cy="30" r="27" class="pirotin-borde" fill="none" stroke-width="3" stroke-dasharray="2.2 2.2"/>
    <circle cx="30" cy="30" r="22" class="pirotin-fondo"/>
    ${masaDibujo(d)}
  </svg>`
}

export const DEFS_MASA = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <clipPath id="pm-mitad"><rect x="30" y="0" width="30" height="60"/></clipPath>
  <radialGradient id="brillo-masa" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs></svg>`

// ---------- Torta entera con dedicatoria ----------

const ESCALA: Record<number, number> = { 8: 0.8, 12: 0.9, 16: 1 }

export function svgTorta(t: Torta, porciones: number, dedicatoria: string): string {
  const s = ESCALA[porciones] ?? 0.9
  const cx = 160
  const rx = 122 * s
  const ry = 42 * s
  const alto = 64
  const cy = 108
  const base = cy + alto
  const r = semilla(t.id.length * 13 + porciones)
  const borde: { y: number; svg: string }[] = []
  const costado: string[] = []

  // Capas o textura del costado
  if (t.id === 'rogel') {
    for (let i = 0; i < 8; i++) {
      const y = cy + 6 + i * ((alto - 6) / 8)
      costado.push(`<rect x="${cx - rx}" y="${y}" width="${rx * 2}" height="${(alto - 6) / 16}" fill="#a8642c"/>`)
    }
  } else if (t.id === 'chocotorta') {
    for (let i = 0; i < 3; i++) costado.push(`<rect x="${cx - rx}" y="${cy + 14 + i * 18}" width="${rx * 2}" height="5" fill="#efe0c4" opacity=".85"/>`)
  } else if (t.id === 'lemon') {
    for (let x = cx - rx + 8; x < cx + rx; x += 12) costado.push(`<rect x="${x}" y="${cy + 18}" width="3" height="${alto - 18}" fill="#c08c4e"/>`)
    costado.push(`<rect x="${cx - rx}" y="${cy}" width="${rx * 2}" height="18" fill="#f3d24f"/>`)
  } else if (t.id === 'cheesecake') {
    costado.push(`<rect x="${cx - rx}" y="${base - 14}" width="${rx * 2}" height="14" fill="#b98a57"/>`)
  } else if (t.id === 'selva') {
    for (let i = 0; i < 70; i++) {
      const x = cx - rx + r() * rx * 2
      const y = cy + 8 + r() * (alto - 10)
      costado.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="5" height="2" rx="1" fill="${i % 3 ? '#2a1610' : '#5a3426'}" transform="rotate(${(r() * 70 - 35).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`)
    }
  }

  // Adornos del borde de arriba (dejan libre el centro para la dedicatoria)
  const n = Math.round(14 * s + 2)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2
    const x = cx + Math.cos(a) * rx * 0.84
    const y = cy + Math.sin(a) * ry * 0.78
    if (t.id === 'lemon' || t.id === 'rogel') borde.push({ y, svg: beso(x, y + 5, 1.15 * s) })
    else if (t.id === 'selva') borde.push({ y, svg: `<path d="M${x - 7} ${y + 3} q7 -12 14 0 q-7 5 -14 0z" fill="#fffaf2" stroke="#e7d8c2"/>${i % 2 ? `<circle cx="${x}" cy="${y - 3}" r="4.6" fill="#9b1028"/><circle cx="${x - 1.4}" cy="${y - 4.6}" r="1.2" fill="#fff" opacity=".7"/>` : ''}` })
    else if (t.id === 'cheesecake') borde.push({ y, svg: `<circle cx="${x}" cy="${y}" r="4" fill="${i % 3 ? '#8f1630' : '#3b3a78'}"/><circle cx="${x + 5}" cy="${y + 2}" r="3" fill="#d23d5e"/>` })
    else borde.push({ y, svg: `<ellipse cx="${x}" cy="${y}" rx="7" ry="3" fill="#2b1813"/><ellipse cx="${x}" cy="${y - 1}" rx="5" ry="1.8" fill="#4a2c22"/>` })
  }
  const bordeOrdenado = borde.sort((a, b) => a.y - b.y).map((b) => b.svg).join('')

  const lineas = renglones(dedicatoria)
  const vacia = !lineas.length
  const textos = vacia ? ['tu dedicatoria'] : lineas
  const largo = Math.max(...textos.map((l) => [...l].length))
  const fs = Math.min(textos.length > 1 ? 34 : 40, (rx * 1.3) / (largo * 0.43))
  const alturaLinea = fs * 0.95
  const y0 = -((textos.length - 1) * alturaLinea) / 2
  const texto = textos
    .map((l, i) => `<text x="0" y="${(y0 + i * alturaLinea).toFixed(1)}" dominant-baseline="central">${esc(l)}</text>`)
    .join('')

  return `<svg viewBox="0 0 320 250" role="img" aria-label="${esc(`${t.nombre} de ${porciones} porciones${vacia ? ', sin dedicatoria' : `, con la dedicatoria: ${lineas.join(' ')}`}`)}">
    <ellipse cx="${cx}" cy="230" rx="70" ry="10" fill="#000" opacity=".12"/>
    <path d="M${cx - 26} 228 q26 -10 52 0 l-8 -30 h-36z" class="pie-dorado"/>
    <ellipse cx="${cx}" cy="${base + 10}" rx="${rx + 24}" ry="${ry * 0.6 + 12}" class="bandeja"/>
    <ellipse cx="${cx}" cy="${base + 6}" rx="${rx + 22}" ry="${ry * 0.6 + 10}" class="bandeja-arriba"/>
    <path d="M${cx - rx} ${cy} V${base} A${rx} ${ry} 0 0 0 ${cx + rx} ${base} V${cy}Z" fill="${t.costado}"/>
    <clipPath id="clip-costado"><path d="M${cx - rx} ${cy} V${base} A${rx} ${ry} 0 0 0 ${cx + rx} ${base} V${cy}Z"/></clipPath>
    <g clip-path="url(#clip-costado)">${costado.join('')}<rect x="${cx - rx}" y="${cy}" width="${rx * 2}" height="${alto + ry}" fill="url(#sombra-costado)"/></g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${t.tope}"/>
    ${t.id === 'chocotorta' ? Array.from({ length: 60 }, () => { const a = r() * Math.PI * 2; const d = Math.sqrt(r()); return `<circle cx="${(cx + Math.cos(a) * d * rx * 0.95).toFixed(1)}" cy="${(cy + Math.sin(a) * d * ry * 0.95).toFixed(1)}" r="${(0.6 + r()).toFixed(1)}" fill="#8a5a3c"/>` }).join('') : ''}
    ${t.id === 'cheesecake' ? `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#fbf1dc" stroke-width="3"/>` : ''}
    <g class="dedicatoria${vacia ? ' dedicatoria--vacia' : ''}" transform="translate(${cx} ${cy}) scale(1 0.56)" fill="${t.tinta}" font-size="${fs.toFixed(1)}">${texto}</g>
    ${bordeOrdenado}
  </svg>`
}

export const DEFS_TORTA = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="sombra-costado" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity=".08"/><stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
</defs></svg>`
