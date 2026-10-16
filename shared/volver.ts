import './volver.css'

/** Botón flotante para volver a la vitrina desde cualquier ejemplo. */
export function botonVolver(tono: 'claro' | 'oscuro' = 'claro') {
  const a = document.createElement('a')
  a.href = '/'
  a.className = `vitrina-volver vitrina-volver--${tono}`
  a.innerHTML = '<span aria-hidden="true">←</span> Vitrina'
  a.title = 'Volver a la vitrina de proyectos'
  document.body.append(a)
}
