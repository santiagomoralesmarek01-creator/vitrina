import './volver.css'

/** Botón para volver a la vitrina desde cualquier ejemplo, más la firma en el pie. */
export function botonVolver(tono: 'claro' | 'oscuro' = 'claro') {
  const a = document.createElement('a')
  a.href = '/'
  a.className = `vitrina-volver vitrina-volver--${tono}`
  a.innerHTML = '<span aria-hidden="true">←</span> Vitrina'
  a.title = 'Volver a la vitrina de proyectos'
  document.body.append(a)
  firma()
}

/** "Hecho por MrK" al final del pie de la página (o al final de la página si no hay pie). */
export function firma() {
  if (document.querySelector('.firma-mrk')) return
  const p = document.createElement('p')
  p.className = 'firma-mrk'
  p.innerHTML = 'Hecho por <strong>MrK</strong>'
  const pies = document.querySelectorAll('body > footer')
  ;(pies[pies.length - 1] ?? document.body).append(p)
}
