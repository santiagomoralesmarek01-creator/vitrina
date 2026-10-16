import '@fontsource/unbounded/500.css'
import '@fontsource/unbounded/800.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/jetbrains-mono/500.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { BICI_SVG } from './bici'
import { COLORES, MEDIOS, MODELOS, calcularAhorro, type Medio } from './ahorro'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches
const raiz = document.documentElement

$('hero-bici').innerHTML = BICI_SVG
$('visor-bici').innerHTML = BICI_SVG

// ---------- La bici del hero gira y avanza un poco al bajar ----------
if (!reducirMovimiento) {
  const bici = $('hero-bici')
  let pendiente = false
  addEventListener(
    'scroll',
    () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(() => {
        const k = Math.min(1, scrollY / innerHeight)
        bici.style.transform = `translateX(${k * 18}vw) rotate(${k * -6}deg) scale(${1 - k * 0.15})`
        bici.style.setProperty('--giro', `${scrollY * 0.8}deg`)
        pendiente = false
      })
    },
    { passive: true },
  )
}

// ---------- Números que cuentan al aparecer ----------
const contador = new IntersectionObserver(
  (entradas) =>
    entradas.forEach((e) => {
      if (!e.isIntersecting) return
      contador.unobserve(e.target)
      const el = e.target as HTMLElement
      const destino = Number(el.dataset.contar)
      if (reducirMovimiento) return void (el.textContent = String(destino))
      const inicio = performance.now()
      const paso = (t: number) => {
        const k = Math.min(1, (t - inicio) / 1200)
        el.textContent = String(Math.round(destino * (1 - (1 - k) ** 4)))
        if (k < 1) requestAnimationFrame(paso)
      }
      requestAnimationFrame(paso)
    }),
  { threshold: 0.6 },
)
document.querySelectorAll('[data-contar]').forEach((el) => contador.observe(el))

// ---------- Configurador ----------
let modelo: (typeof MODELOS)[number] = MODELOS[0]
let color: (typeof COLORES)[number] = COLORES[0]

$('modelos').innerHTML = MODELOS.map(
  (m, i) => `
  <label class="modelo">
    <input type="radio" name="modelo" value="${m.id}" ${i === 0 ? 'checked' : ''} />
    <span class="modelo-caja">
      <strong>${m.nombre.replace('Volta ', '')}</strong>
      <small>${m.autonomia} km · ${m.peso} kg · rodado ${m.rueda}</small>
    </span>
  </label>`,
).join('')

$('colores').innerHTML = COLORES.map(
  (c, i) => `
  <label class="color" title="${c.nombre}">
    <input type="radio" name="color" value="${c.id}" ${i === 0 ? 'checked' : ''} aria-label="${c.nombre}" />
    <span style="--muestra: ${c.valor}"></span>
  </label>`,
).join('')

function aplicarConfig() {
  raiz.style.setProperty('--cuadro', color.valor)
  $('visor-bici').dataset.modelo = modelo.id
  $('visor-nombre').textContent = `${modelo.nombre} · ${color.nombre}`
  $('precio').textContent = formatPesos(modelo.precio)
  $('cuotas').textContent = `o 12 cuotas de ${formatPesos(Math.round(modelo.precio / 12 / 100) * 100)} sin interés`
  calcular()
}

document.querySelector('.config-panel')!.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement
  if (input.name === 'modelo') modelo = MODELOS.find((m) => m.id === input.value)!
  if (input.name === 'color') color = COLORES.find((c) => c.id === input.value)!
  aplicarConfig()
})

// ---------- Calculadora ----------
const form = $<HTMLFormElement>('ahorro-form')
$('medios').innerHTML = (Object.keys(MEDIOS) as Medio[])
  .map(
    (m, i) => `
  <label class="medio">
    <input type="radio" name="medio" value="${m}" ${i === 0 ? 'checked' : ''} />
    <span>${MEDIOS[m].nombre}</span>
  </label>`,
  )
  .join('')

function calcular() {
  const datos = new FormData(form)
  const km = Number(datos.get('km'))
  const dias = Number(datos.get('dias'))
  const medio = datos.get('medio') as Medio
  const r = calcularAhorro(km, dias, medio, modelo.precio)

  $('km-valor').textContent = `${km} km`
  $('dias-valor').textContent = `${dias} ${dias === 1 ? 'día' : 'días'}`
  $('ahorro-mes').textContent = formatPesos(r.ahorroMes)
  $('actual-mes').textContent = formatPesos(r.actualMes)
  $('bici-mes').textContent = formatPesos(r.biciMes)
  const maximo = Math.max(r.actualMes, r.biciMes, 1)
  $('barra-actual').style.width = `${(r.actualMes / maximo) * 100}%`
  $('barra-bici').style.width = `${Math.max(2, (r.biciMes / maximo) * 100)}%`
  $('se-paga').innerHTML = r.mesesParaPagarla
    ? `La ${modelo.nombre} se paga sola en <strong>${r.mesesParaPagarla} ${r.mesesParaPagarla === 1 ? 'mes' : 'meses'}</strong>.`
    : 'Contanos cuánto viajás para calcularlo.'
  $('co2').innerHTML = `Y evitás <strong>${r.co2Mes} kg de CO₂</strong> por mes.`

  // El relleno de cada slider sigue al valor.
  form.querySelectorAll<HTMLInputElement>('input[type=range]').forEach((rango) => {
    const k = (Number(rango.value) - Number(rango.min)) / (Number(rango.max) - Number(rango.min))
    rango.style.setProperty('--relleno', `${k * 100}%`)
  })
}
form.addEventListener('input', calcular)

aplicarConfig()
botonVolver('oscuro')
