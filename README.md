# GALAXY IMPACT

Videojuego arcade horizontal en HTML5 Canvas, JavaScript ES6 y CSS. Sin frameworks, imágenes externas, descargas ni compilación.

## Jugar

Descarga y descomprime los archivos en una misma carpeta. Abre `index.html` con Chrome, Opera o Edge en una computadora o celular. Pulsa **INICIAR JUEGO** o **Enter**. No necesitas instalar Node, paquetes ni un servidor.

- **WASD / flechas:** movimiento diagonal normalizado.
- **Espacio:** mantener para disparar.
- **Shift:** impulso de 0,2 segundos; recarga de 3 segundos.
- **P / Escape:** pausa y continuación.
- **Enter:** iniciar o reiniciar después de terminar.
- **SONIDO:** activar o silenciar los efectos. El audio se habilita tras una interacción.

## Celulares

Abre el enlace de GitHub Pages en el navegador del teléfono. Los dispositivos táctiles muestran joystick analógico, DISPARAR, IMPULSO y PAUSA superpuestos al escenario, con fondos transparentes. Arrastra el joystick y mantén DISPARAR con dos dedos para moverte y atacar simultáneamente. El escenario se adapta automáticamente al ancho y alto disponibles al girar el celular, conserva la proporción 16:9 y utiliza bandas cuando la pantalla tiene otra proporción. Recomendado: orientación horizontal. El botón PANTALLA activa pantalla completa cuando el navegador lo admite; en otros navegadores se aprovecha el espacio disponible sin ocultar sus barras. Al girar el celular o cambiar de aplicación, la partida se pausa; pulsa CONTINUAR. No es necesario instalar una aplicación.

Validación adicional: Chromium con emulación táctil a 390 × 844 y 844 × 390; movimiento y disparo simultáneos, liberación de botones, toque breve del impulso, pausa y continuación, ausencia de desplazamiento al tocar y controles dentro de la pantalla horizontal. Sin errores de JavaScript. Pendiente comprobar en dispositivos físicos Android/iPhone.

## Misión Aether

Sobrevive a la llegada (60 segundos) y la invasión (90 segundos). Tras una advertencia de 5 segundos aparece el Destructor Omega. Su núcleo cambia al bajar al 50 % de vida y combina abanicos con disparos frontales. El tiempo total previsto es de 3 a 5 minutos, según cuánto aciertes al jefe.

Empiezas con 3 vidas y 100 puntos de escudo por vida. Los impactos causan daño y conceden invulnerabilidad temporal. Evita naves, cristales del suelo y proyectiles. Las torretas se desplazan con el terreno.

Los drones, interceptores y torretas otorgan 100, 200 y 300 puntos. La tercera destrucción garantiza una mejora de disparo; después hay un 24 % de probabilidad de obtener una mejora por enemigo destruido:

- **II:** doble disparo durante 16 segundos.
- **III:** abanico triple durante 16 segundos; sustituye el doble.
- **O:** barrera que absorbe daño durante 12 segundos.
- **+:** reparación de 40 puntos, hasta el máximo de 100.

La victoria concede 5000 puntos y 1000 por vida restante. El récord se guarda al terminar mediante `localStorage`. Si el navegador bloquea almacenamiento local, se puede jugar y el récord permanece durante esa sesión; su persistencia depende de la configuración del navegador, especialmente con archivos locales.

## Archivos y arquitectura

- `index.html`: estructura, Canvas lógico de 480 × 270 e interfaz exterior.
- `style.css`: presentación, menús y escalado nítido hasta 960 × 540.
- `game.js`: clases `Game`, `Player`, `Enemy`, `Bullet`, `Particle`, `PowerUp`, `Obstacle`, `Boss`, `Background`, `UI` y `AudioManager`.

Los métodos `draw()` concentran el arte procedural para permitir sustituirlo por sprites. `Game.update(dt)` gestiona simulación y colisiones; `requestAnimationFrame` calcula un delta limitado para evitar saltos tras bloquear la pestaña. La pérdida de foco pausa la partida. Los proyectiles y entidades fuera de pantalla se eliminan; las partículas se limitan a 240. Los listeners se registran una sola vez.

Para ajustar la dificultad, modifica `Player.speed`, la cadencia en `Player.update`, la vida del jefe en `Boss` y los tiempos de oleadas en `Game.update`. Los estados son `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER` y `VICTORY`.

## Validación realizada

Se comprobó la sintaxis con `node --check game.js`. Se ejecutó Chromium con Playwright sobre un servidor HTTP local temporal: menú y controles, movimiento real mediante teclado, disparo mantenido, pausa, daño, pérdida de vidas, cuatro power-ups, destrucción de enemigos por colisión con disparos, advertencia y aparición del jefe, segunda fase, derrota del jefe, victoria, persistencia del récord, reinicio y Game Over. No se detectaron errores de JavaScript.

Las pruebas de fases tardías avanzaron el reloj y prepararon situaciones de combate de forma controlada; no equivalen a completar manualmente una partida de varios minutos ni a medir 60 FPS. Se revisó visualmente una captura del menú. La política del Chromium administrado bloqueó las URL `file:`: por eso la ejecución directa local está implementada sin módulos ni peticiones de recursos remotos, pero no pudo comprobarse en este entorno. Opera, Edge y la reproducción audible necesitan comprobación manual.

Actualización de adaptación móvil: controles superpuestos semitransparentes, área con altura dinámica `100dvh`, ajuste sin deformar mediante `object-fit: contain` y márgenes seguros para recortes de pantalla. Verificado en Chromium móvil emulado: escenario de 844 × 390 tras rotación, botones con alfa 0,333, entradas multitáctiles y regresión de combate. No comprobado en teléfonos físicos.

### Safari en iPhone: versión MÓVIL · 4

La detección utiliza capacidad táctil, dimensiones de ventana y un botón manual **ACTIVAR CONTROLES TÁCTILES**. La ventana se mide también con `visualViewport` para adaptarse a la rotación y las barras de Safari. Los recursos CSS y JavaScript están versionados para evitar combinaciones antiguas en caché. En el menú los controles se muestran atenuados; se activan al iniciar la partida.

Si Safari no gira, desactiva el bloqueo de orientación del Centro de control del iPhone y gira físicamente el teléfono. El juego no puede anular ese bloqueo. El modo de pantalla completa depende de la versión de Safari; no es necesario para usar los controles ni para ajustar el escenario al área disponible.

Validado en Chromium con dimensiones de iPhone 11 Pro (375 × 812 y 812 × 375), entradas simultáneas y regresión de combate. Safari/WebKit y un iPhone físico no están disponibles en este entorno; se requiere confirmación en el dispositivo.

### JOYSTICK · 5

El pulgar izquierdo controla un joystick circular transparente con movimiento de 360 grados. Un desplazamiento pequeño mueve lentamente; llevar la palanca al borde alcanza la velocidad máxima. La zona muerta central evita movimientos accidentales. Soltar o cancelar el toque, pausar y girar la pantalla centran la palanca. Con otro dedo puedes disparar o activar el impulso. El teclado conserva su funcionamiento.

Entrada móvil independiente: `jugar-joystick-5.html`; la dirección anterior `jugar-movil-4.html` también contiene la actualización. Ambas incluyen los estilos y el código para funcionar sin recursos adicionales. Al modificar el juego deben regenerarse desde los tres archivos principales.

Validación: movimiento diagonal sin exceso de velocidad, disparo simultáneo, velocidad intermedia, zona muerta, cancelación y liberación, ajuste horizontal y regresión de combate en Chromium emulado. Sin errores JavaScript. Pendiente prueba en Safari/iPhone físico.

### HANGAR · 6: naves y poderes

Desde el menú principal pulsa **HANGAR / CAMBIAR NAVE**, elige una nave y pulsa JUGAR. La elección se guarda localmente cuando el navegador permite almacenamiento.

| Nave | Disparo | Velocidad | Poder especial |
| --- | --- | --- | --- |
| AX-01 Falcon | Cian, 1 daño | 115 | Sobrecarga: cadencia doble durante 5 segundos; disparos blancos durante el efecto. |
| NX-02 Nova | Naranja, 2 daño | 105 | Pulso solar: elimina proyectiles hostiles, causa 8 de daño a enemigos y 35 al jefe. |
| VX-03 Spectre | Violeta, 1 daño | 140 | Velo: barrera de 6 segundos y reparación de 20 puntos, hasta 100. |

Activa el poder con **E** en teclado o **PODER** en celular. Todas las habilidades tienen 12 segundos de recarga; el HUD muestra el nombre y el tiempo restante. Los disparos dobles y triples conservan el color y daño de la nave seleccionada. Las naves tienen siluetas y paletas diferentes y están disponibles sin desbloqueos.

La entrada independiente actual es `jugar-hangar-6.html`. Las dos entradas móviles anteriores también se actualizaron. Las definiciones están en `SHIPS` y los poderes en `Player.activatePower`.

Validación automatizada en Chromium: selección desde el hangar, persistencia tras recargar, color y daño de las tres armas, activación y bloqueo durante recarga, sobrecarga, pulso contra enemigos/proyectiles/jefe, barrera y reparación, reinicio por nave. Además pasaron las pruebas de joystick, rotación, combate, vidas, mejoras, victoria y Game Over. No se observaron errores JavaScript. Pendiente probar en Safari de un iPhone físico.
