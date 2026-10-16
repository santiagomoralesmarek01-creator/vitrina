const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

/** 12500 → "$ 12.500" */
export function formatPesos(monto: number): string {
  return pesos.format(monto).replace(/ /g, ' ')
}
