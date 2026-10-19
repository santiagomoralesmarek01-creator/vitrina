// Dibujos del helado en SVG (texto): bochas, cucurucho y potes. viewBox 0 0 300 340.
import type { EnvaseId, Sabor } from './helado'

const TINTA = '#4a2f5c'

/** Una bocha con su "pollerita" ondulada abajo. */
export function bocha(s: Sabor, cx: number, cy: number, r: number, opciones: { cara?: boolean; nueva?: boolean } = {}): string {
  const ondas = 5
  const w = (2 * r) / ondas
  let d = `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`
  for (let k = 0; k < ondas; k++) d += ` a${w / 2} ${w / 2.6} 0 0 1 ${-w} 0`
  d += 'Z'
  // Sombra un poco más oscura en la base, hecha con el mismo color.
  let s2 = `<path d="${d}" fill="${s.color}" stroke="${TINTA}" stroke-opacity=".14" stroke-width="2"/>`
  s2 += `<path d="M${cx - r * 0.9} ${cy + r * 0.05} q${r * 0.9} ${r * 0.35} ${r * 1.8} 0" stroke="${TINTA}" stroke-opacity=".08" stroke-width="${r * 0.18}" fill="none" stroke-linecap="round"/>`
  if (s.chispas) {
    const pts = [
      [-0.45, -0.35, 20],
      [0.1, -0.6, -30],
      [0.5, -0.25, 50],
      [-0.1, -0.1, 80],
      [0.35, 0.05, -10],
      [-0.6, 0.0, 40],
      [-0.25, -0.65, -60],
    ]
    for (const [x, y, g] of pts) {
      s2 += `<rect x="${(cx + x * r - 3).toFixed(1)}" y="${(cy + y * r - 1.5).toFixed(1)}" width="6" height="3" rx="1.5" fill="${s.chispas}" transform="rotate(${g} ${(cx + x * r).toFixed(1)} ${(cy + y * r).toFixed(1)})"/>`
    }
  }
  s2 += `<ellipse cx="${cx - r * 0.42}" cy="${cy - r * 0.48}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity=".55" transform="rotate(-35 ${cx - r * 0.42} ${cy - r * 0.48})"/>`
  if (opciones.cara) {
    const ey = cy - r * 0.08
    s2 += `<g class="cara"><circle cx="${cx - r * 0.28}" cy="${ey}" r="${r * 0.075}" fill="${TINTA}"/><circle cx="${cx + r * 0.28}" cy="${ey}" r="${r * 0.075}" fill="${TINTA}"/>`
    s2 += `<path d="M${cx - r * 0.12} ${ey + r * 0.14} q${r * 0.12} ${r * 0.14} ${r * 0.24} 0" stroke="${TINTA}" stroke-width="${Math.max(2, r * 0.05)}" fill="none" stroke-linecap="round"/>`
    s2 += `<ellipse cx="${cx - r * 0.5}" cy="${ey + r * 0.14}" rx="${r * 0.12}" ry="${r * 0.07}" fill="#ff7a9a" opacity=".45"/><ellipse cx="${cx + r * 0.5}" cy="${ey + r * 0.14}" rx="${r * 0.12}" ry="${r * 0.07}" fill="#ff7a9a" opacity=".45"/></g>`
  }
  return `<g class="bocha${opciones.nueva ? ' cae' : ''}">${s2}</g>`
}

function fantasma(cx: number, cy: number, r: number): string {
  return `<g class="fantasma"><circle cx="${cx}" cy="${cy - r * 0.15}" r="${r}" fill="none" stroke="${TINTA}" stroke-opacity=".25" stroke-width="3" stroke-dasharray="8 8"/><path d="M${cx - 10} ${cy - r * 0.15}h20M${cx} ${cy - r * 0.15 - 10}v20" stroke="${TINTA}" stroke-opacity=".3" stroke-width="4" stroke-linecap="round"/></g>`
}

const CONO = `
  <defs><pattern id="oblea" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#f4c27a"/><path d="M0 0v16M0 0h16" stroke="#d99a4c" stroke-width="3"/></pattern></defs>
  <path d="M96 196 L150 330 L204 196 Z" fill="url(#oblea)" stroke="#c98a3e" stroke-width="3" stroke-linejoin="round"/>
  <path d="M92 192 h116 a6 6 0 0 1 0 12 h-116 a6 6 0 0 1 0-12z" fill="#e9b064"/>`

const ANCHO_POTE: Record<Exclude<EnvaseId, 'cucurucho'>, number> = { cuarto: 178, medio: 206, kilo: 236 }

function pote(ancho: number, delante: boolean): string {
  const x0 = 150 - ancho / 2
  const x1 = 150 + ancho / 2
  const abajo = ancho * 0.1
  const alto = 78 + ancho * 0.16
  const top = 214
  if (!delante) return `<ellipse cx="150" cy="${top}" rx="${ancho / 2}" ry="12" fill="#d8c6f5"/>`
  const label = ancho > 160 ? `<text x="150" y="${top + alto * 0.55}" text-anchor="middle" class="pote-marca" font-size="${ancho * 0.12}">Polo Sur</text>` : `<text x="150" y="${top + alto * 0.55}" text-anchor="middle" class="pote-marca" font-size="16">Polo</text>`
  return `
    <path d="M${x0} ${top} L${x0 + abajo} ${top + alto - 12} Q${x0 + abajo} ${top + alto} ${x0 + abajo + 12} ${top + alto} L${x1 - abajo - 12} ${top + alto} Q${x1 - abajo} ${top + alto} ${x1 - abajo} ${top + alto - 12} L${x1} ${top} Z" fill="#fff" stroke="#c8b5ef" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${x0 + 4} ${top + 10} L${x1 - 4} ${top + 10}" stroke="#c9b6ff" stroke-width="8" stroke-linecap="round"/>
    <path d="M${x0 + abajo * 0.7 + 8} ${top + alto - 14} L${x1 - abajo * 0.7 - 8} ${top + alto - 14}" stroke="#ff9db0" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 12"/>
    ${label}
    <rect x="${x0}" y="${top - 6}" width="${ancho}" height="12" rx="6" fill="#ece3ff" stroke="#c8b5ef" stroke-width="3"/>`
}

/** Posición de cada bocha según el envase. */
export function lugares(envase: EnvaseId, max: number): { cx: number; cy: number; r: number }[] {
  if (envase === 'cucurucho') {
    return [
      { cx: 150, cy: 192, r: 58 },
      { cx: 150, cy: 126, r: 54 },
    ]
  }
  const w = ANCHO_POTE[envase]
  const r = w * 0.27
  const abajo = 198
  const arriba = abajo - r * 0.95
  const base = [
    { cx: 150 - w * 0.24, cy: abajo, r },
    { cx: 150 + w * 0.24, cy: abajo, r },
  ]
  if (max === 3) return [...base, { cx: 150, cy: arriba, r: r * 0.98 }]
  return [...base, { cx: 150 - w * 0.15, cy: arriba, r: r * 0.95 }, { cx: 150 + w * 0.17, cy: arriba - r * 0.1, r: r * 0.92 }]
}

export function dibujarHelado(envase: EnvaseId, max: number, sabores: Sabor[], nuevos: Set<string>): string {
  const pos = lugares(envase, max)
  const piso = `<ellipse cx="150" cy="332" rx="${envase === 'cucurucho' ? 40 : 110}" ry="7" fill="${TINTA}" opacity=".1"/>`
  const bochas = sabores
    .map((s, i) => bocha(s, pos[i].cx, pos[i].cy, pos[i].r, { cara: i === sabores.length - 1, nueva: nuevos.has(s.id) }))
    .join('')
  const vacio = sabores.length === 0 ? fantasma(pos[0].cx, pos[0].cy, pos[0].r) : ''
  if (envase === 'cucurucho') return piso + CONO + vacio + bochas
  const w = ANCHO_POTE[envase]
  return piso + pote(w, false) + vacio + bochas + pote(w, true)
}

/** Ícono chiquito para los botones de envase. */
export function iconoEnvase(envase: EnvaseId): string {
  if (envase === 'cucurucho')
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 22 L24 45 L33 22Z" fill="#f4c27a" stroke="#c98a3e" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="17" r="11" fill="#ffb3c7"/></svg>`
  const k = { cuarto: 0.7, medio: 0.85, kilo: 1 }[envase]
  const w = 40 * k
  const h = 30 * k
  const x = 24 - w / 2
  const y = 46 - h
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="${24 - w * 0.2}" cy="${y}" r="${w * 0.28}" fill="#b8f0dc"/><circle cx="${24 + w * 0.2}" cy="${y}" r="${w * 0.28}" fill="#ffe199"/><path d="M${x} ${y} L${x + w * 0.1} ${y + h} L${x + w * 0.9} ${y + h} L${x + w} ${y}Z" fill="#fff" stroke="#c8b5ef" stroke-width="2" stroke-linejoin="round"/></svg>`
}
