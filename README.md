# Vitrina

Cartas de restaurante, landings y apps de ejemplo. **Ninguna comparte diseño:** cada
una tiene su tipografía, su paleta y sus propias interacciones. Están pensadas
como trabajos para clientes ficticios.

| Ejemplo | Tipo | Estilo | Interacciones |
|---|---|---|---|
| [Bodegón Don Ernesto](bodegon/) | Carta de parrilla | Pizarra y papel madera, serif clásica y letra a mano | Pestañas que siguen el scroll, filtros sin TACC / veggie, pedido con total y envío por WhatsApp |
| [nube](nube/) | Carta de café de especialidad | Minimalista, dibujos de línea, modo noche | Tarjetas de origen que se dan vuelta, precios según tamaño y leche, modo día / noche recordado |
| [Pulso](pulso/) | Landing de estudio de yoga | Formas orgánicas animadas, serif en cursiva | Respiración guiada 4-4-6, horarios filtrables con reserva, carrusel, planes mensual / trimestral |
| [Volta](volta/) | Landing de bicis eléctricas | Oscura, acento neón que cambia con el configurador | Configurador de color y modelo (SVG), calculadora de ahorro, números que cuentan al aparecer |
| [Tano](tano/) | Carta de pizzería napolitana | Cartel de neón viejo, mantel a cuadros, serif display | Armador de pizza en SVG con mitad y mitad, precio en vivo, pedido copiable |
| [Neblina](neblina/) | Carta de bar de tragos | Art déco nocturno, dorado sobre negro | Test que recomienda un trago, perfil de sabor en radar SVG, cuenta regresiva del happy hour |
| [Filo](filo/) | App: turnero de barbería | Sobria, blanco y negro con acento ámbar | Reserva en 5 pasos con horarios ocupados, "Mis turnos" guardados, descarga del evento `.ics` |
| [Mercadito Verde](mercadito/) | App: panel de ventas | Dashboard limpio con modo claro y oscuro | KPIs vs. período anterior, gráfico con cruz y tooltip (o vista de tabla), filtro 7/30/90 días, tabla ordenable con búsqueda |
| [Kaze](kaze/) | Carta de sushi y nikkei | Editorial japonés: washi, tinta sumi y sello bermellón | Combinado que llena la bandeja pieza por pieza, filtros crudo / cocido / veggie, omakase con lugares |
| [Polo Sur](polo/) | Carta de heladería | Pastel y redondeada, con pingüino de mascota | Bochas que se apilan con el color de cada sabor, envases con límite de sabores, filtros sin TACC y veganos |
| [Miga](miga/) | App: tortas por encargo | Pastelería editorial en rosa y chocolate | Configurador que dibuja la torta en vivo, calendario de retiro con 48 h de aviso, seña del 50 % |
| [Bunker](bunker/) | Carta de hamburguesería | Neo-brutalista callejera: mostaza, negro y ketchup | Burger que crece capa por capa, medidor de altura y calorías, combos y "las de la casa" precargadas |
| [Domingo](domingo/) | App: brunch y reservas | Salvia, crema y durazno, serif en cursiva | Reserva eligiendo la mesa en el plano del salón, carta dulce / salada, combos |
| [Lúpulo](lupulo/) | Carta de cervecería | Etiqueta artesanal: kraft, tinta y cobre | Vasos con el color real de cada cerveza, filtros por amargor y alcohol, vuelo de degustación de 4 |
| [Raíz](raiz/) | Landing de restaurante de autor | Alta cocina en blanco hueso, Didone y dibujos de una línea | Menú de siete pasos que se revela al bajar, maridaje y versiones vegetariana / sin TACC, reserva con seña |
| [La Norteña](nortena/) | Carta de empanadas | Folclore norteño: guardas de aguayo en CSS | Docena mixta que llena la bandeja, mejor precio entre docenas / medias / sueltas, zonas de envío |

La página de inicio es una galería: al pasar el mouse por cada tarjeta se
recorre la captura completa de la página, y se puede filtrar por tipo.

## Cómo está hecho

- **HTML, CSS y TypeScript, sin frameworks**, con Vite en modo de varias
  páginas (`vite.config.ts`). Cada ejemplo vive en su carpeta con su propio
  `index.html`, `main.ts` y `style.css`.
- **Tipografías propias** con Fontsource (sin depender de Google Fonts).
- **Lógica separada de la interfaz y con tests** (Vitest): el pedido del
  bodegón, los precios del café, los horarios y planes de Pulso, la
  calculadora de Volta, la pizza de Tano, las recomendaciones de Neblina, los
  turnos de Filo y los cálculos del panel de Mercadito Verde.
- **Accesibilidad:** navegación con teclado, `aria-pressed` / `role="radio"`
  en los controles, diálogos nativos y `prefers-reduced-motion` respetado en
  todas las animaciones.

## Correrlo

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run build
```

Los negocios, las personas y los precios son ficticios. Hecho por **MrK**.
