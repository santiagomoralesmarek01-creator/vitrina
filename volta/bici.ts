/** Bici eléctrica en SVG. El color del cuadro sale de --cuadro y el tamaño de rueda de --rueda. */
export const BICI_SVG = `
<svg class="bici" viewBox="0 0 420 250" role="img" aria-label="Bicicleta eléctrica Volta">
  <defs>
    <filter id="brillo" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
  <g class="rueda rueda--atras"><circle cx="95" cy="178" r="58" /><circle cx="95" cy="178" r="12" class="motor" /></g>
  <g class="rueda rueda--adelante"><circle cx="325" cy="178" r="58" /><circle cx="325" cy="178" r="4" /></g>
  <g class="cuadro" filter="url(#brillo)">
    <path d="M95 178 L180 178 L262 92 L160 92 Z" />
    <path d="M160 92 L148 56 M128 54 h40" />
    <path d="M262 92 L325 178 M262 92 L276 62 l26 -6" />
    <path d="M180 178 L160 92" />
  </g>
  <rect class="bateria" x="196" y="118" width="58" height="16" rx="6" transform="rotate(-46 225 126)" />
  <circle class="pedal" cx="180" cy="178" r="9" />
</svg>`
