import { GUSTOS, type Gusto } from './gustos'

export interface Pregunta {
  /** El gusto que hay que adivinar por su repulgue. */
  correcta: string
  /** Tres ids, mezclados. */
  opciones: string[]
}

export interface Puntaje {
  aciertos: number
  jugadas: number
  racha: number
  mejorRacha: number
}

export const puntajeInicial = (): Puntaje => ({ aciertos: 0, jugadas: 0, racha: 0, mejorRacha: 0 })

/** Mezcla de Fisher-Yates con un azar inyectable (para poder testear). */
export function mezclar<T>(lista: T[], azar: () => number = Math.random): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Una pregunta nueva, evitando repetir el gusto anterior. */
export function nuevaPregunta(azar: () => number = Math.random, anterior?: string, gustos: Gusto[] = GUSTOS): Pregunta {
  const candidatos = gustos.filter((g) => g.id !== anterior)
  const correcta = candidatos[Math.floor(azar() * candidatos.length)].id
  const otras = mezclar(
    gustos.filter((g) => g.id !== correcta).map((g) => g.id),
    azar,
  ).slice(0, 2)
  return { correcta, opciones: mezclar([correcta, ...otras], azar) }
}

export function responder(p: Puntaje, pregunta: Pregunta, elegida: string): { acierto: boolean; puntaje: Puntaje } {
  const acierto = elegida === pregunta.correcta
  const racha = acierto ? p.racha + 1 : 0
  return {
    acierto,
    puntaje: {
      aciertos: p.aciertos + (acierto ? 1 : 0),
      jugadas: p.jugadas + 1,
      racha,
      mejorRacha: Math.max(p.mejorRacha, racha),
    },
  }
}

/** Un título según cómo te va, para darle un poco de gracia. */
export function titulo(p: Puntaje): string {
  if (p.jugadas === 0) return 'Sin jugar todavía'
  if (p.racha >= 6) return 'Maestra o maestro repulguero'
  if (p.racha >= 3) return 'Ojo de empanadero'
  const tasa = p.aciertos / p.jugadas
  if (tasa >= 0.6) return 'Vas bien'
  return 'Hay que comer más empanadas'
}
