# ELEVARI SCENE SYSTEM (v2)

**Fuente de verdad:** `scripts/scene/` · **Salidas generadas:** no se editan a mano

Paisaje vectorial del valle Elevari (cordilleras, río, pradera, domos de glamping, una familia y una reunión de amigos, sol, luna y estrellas), sin fotografías ni recursos externos, en la paleta terracota/crema. Se dibuja una sola vez, con **la misma composición** en tres momentos del día: **Día**, **Tarde** (hora dorada) y **Noche**. Como el dibujo no cambia entre temas, un cambio de tema se interpola (colores, luz, sombras, sol y luna) en lugar de cortarse.

## 0. Estado por plataforma

| Superficie | Estado | Detalle |
|------------|--------|---------|
| Web (`/`, `/auth/*`, catálogo, bandas del home) | **v2** | Héroe interactivo del home con selector Día · Tarde · Noche |
| PWA («web app») | **v2** | Es la misma web |
| App móvil (Android + iOS) | v1 | `mobile/lib/scene-data.ts` sigue siendo la copia v1 y **ya no la regenera** `scene:generate`. Etapa 2 |
| Correo | v1 | `public/brand/email/banner.jpg` es el render v1 y tampoco lo regenera el generador. Etapa 2 |

Etapa 2 (PR aparte): renderizador móvil sobre los mismos datos generados, héroe y selector en el inicio de la app, y tres banners de correo (día / dorado / noche) elegidos por la hora de envío en America/Bogota. El compositor plano (`compose.mjs`, `preview.mjs`) ya existe para eso.

## 1. El cuadro

- **Día:** cinco cordilleras con bruma atmosférica, río sinuoso con destellos, pradera con flores, tres domos con deck y guirnaldas, una familia (dos adultos y dos niños), cinco personas brindando alrededor de una mesa y dos sentadas junto a la fogata, sol con resplandor y rayos, nubes a la deriva, aves y árboles que se mecen.
- **Tarde:** cielo ámbar-rosa, sol bajo detrás de la cordillera, sombras largas, río dorado, domos que empiezan a brillar, golondrinas y polen en el aire.
- **Noche:** cielo índigo, luna grande con halo, campo de estrellas y Vía Láctea con deriva lenta, estrellas fugaces ocasionales, cordilleras con luz de borde, destello lunar en el río, fogata con llamas, brasas y luz parpadeante sobre las personas y el domo más cercano, domos encendidos, luciérnagas y bruma.

Selección automática: **dorado** 5–6 h y 16–18 h, **día** 7–15 h, **noche** 19–4 h (hora local de la persona; constantes en `scripts/scene/themes.mjs` → `lib/scene/scene-data.ts`).

## 2. Generador (`scripts/scene/`)

| Archivo | Papel |
|---------|-------|
| `themes.mjs` | Tokens por tema: colores (hex) y números (opacidades, posiciones, escalas); horas, etiquetas y paradas del cielo |
| `geom.mjs`, `nodes.mjs`, `svg.mjs` | Geometría (cordilleras, abetos, nubes, hierba), nodos y renderizador (`css` para la web, plano para imágenes) |
| `people.mjs`, `camp.mjs` | Personas, domos, mesa, fogata, árbol y guirnaldas |
| `scene.mjs` | Composición: capas de atrás hacia delante, con `depth` (parallax) y animaciones por capa o nodo |
| `compose.mjs`, `preview.mjs` | Compositor plano y vista previa (`node scripts/scene/preview.mjs OUT [--themes a,b] [--crop x,y,w,h] [--svg]`); base del banner del correo |
| `generate-scene.mjs` | Escribe (y verifica) las salidas |

Salidas (se commitean):

- `lib/scene/scene-art.ts`: el SVG de 17 unidades de capa (las capas contiguas con la misma profundidad y animación se fusionan). Colores como variables CSS.
- `lib/scene/scene-data.ts`: nombres de tema, etiquetas en español, horas y `sceneForHour`.
- `components/scene/scene-themes.css`: variables por tema. Todo token numérico se registra con `@property <number>` y transición, por eso el cambio de tema se interpola.

```bash
npm run scene:generate   # tras cambiar el arte o los tokens; commitear las salidas
npm run scene:check      # falla si las salidas están desactualizadas (corre en CI y en ci:local)
```

Visibilidad: los tokens de opacidad que valen 0 en algún tema (`oSun`, `oRays`, `oMoon`…) generan además `--sc-v-<nombre>: hidden|visible` por tema y la clase `ov-<nombre>` en los grupos (y capas con `vis`) que los usan; ver §5.

Tokens «portrait» (`sunXp/Yp/Kp`, `moonXp/Yp/Kp`): en una caja alta y estrecha (teléfono, `aspect-ratio ≤ 0.8`) el sol y la luna pasan a la esquina libre junto al titular.

Peso del arte: ≈ 135 KB sin comprimir (gzip ≈ 34 KB, brotli ≈ 24 KB); la variante `lite` (cielo y cordilleras: 9 de las 17 unidades) pesa ≈ 41,6 KB (gzip ≈ 10 KB). `scene-themes.css` pesa ≈ 27,7 KB (gzip ≈ 5 KB).

## 3. Web (`components/scene/`, `components/home/`, `lib/scene/`)

- `ScenicBackground.tsx` (servidor) pinta el SVG en línea: sin salto de maquetación y con muy poco JS. Props: `variant` (`full` | `lite`), `theme` (`auto` | `day` | `golden` | `night`), `scrim` (`hero` | `auth` | `center` | `none`), `idPrefix` (único por escena en la página), `focus` y `interactive`.
- `SceneController.tsx` (cliente, mínimo): mantiene el tema al día, pausa las animaciones fuera de pantalla, con la pestaña oculta o con movimiento reducido (`data-paused`), y carga bajo demanda `scene-interactions.ts` y, en las escenas completas, el gobernador de calidad (`lib/scene/scene-quality.ts`, ver §5).
- `scene-interactions.ts`: parallax con ratón/lápiz y reacciones del héroe (ver §4).
- `SceneSwitcher.tsx`: selector **Día · Tarde · Noche** (`radiogroup`).
- `lib/scene/scene-state.ts`: estado de la página. `lib/scene/time-of-day.ts` define `sceneInitScript`, que corre en `<head>` (`app/layout.tsx`) y fija `data-elevari-scene` en `<html>` **antes del primer pintado**, de modo que el HTML del servidor nunca muestra un tema equivocado.
- `scene.css`: ajuste tipo `cover` (el cielo se recorta en cajas anchas; en teléfonos entra la ventana del campamento), scrims, movimiento, reacciones y reglas de movimiento reducido. `scene-switcher.css`: el selector. `components/home/home-hero.css`: el héroe.
- Usos: `HomeHero` (`app/page.tsx`: escena completa, `scrim="hero"`, `interactive`), `SceneBand` del home (versión `lite`), `AuthShell` y `AuthPageFallback` (`scrim="auth"`), héroe del catálogo (`lite`).
- `SearchHero.tsx` conserva titular, chips, ids y flujo de datos de la búsqueda; solo perdió la foto. `scripts/certification/measure-hero.mjs` depende de `#buscar`, `#buscar h1`, `#buscar ul`, `.elevari-search-luxury` y `.elevari-btn-primary`: no los cambies.

### Qué tema se ve (precedencia)

1. La elección de la persona con el selector (`sessionStorage` `elevari-scene`, solo esa pestaña; se comparte con todas las escenas de la página).
2. Tema del sitio explícitamente **oscuro** (botón ☀ ☾ ◐ del encabezado) → **Noche**.
3. La hora local.

Al usar el botón del encabezado se descarta la elección del selector, para que el botón nunca parezca ignorado (oscuro → Noche; claro o sistema → la hora). El selector solo cambia el paisaje, nunca el tema del sitio. La hora se revisa cada minuto y al volver a la pestaña.

## 4. Interacción (héroe del home)

| Gesto | Respuesta |
|-------|-----------|
| Mover el puntero (ratón/lápiz) | Parallax por capas (desplazamiento proporcional a la profundidad; ≈ 30 px en el primer plano) y los rayos del sol giran unos grados siguiendo el puntero |
| Pasar o tocar la fogata (Tarde, Noche) | La llama se aviva y salen brasas |
| Pasar o tocar el sol (Día, Tarde) | El sol y su resplandor se hinchan |
| Pasar o tocar la luna o las estrellas (Noche) | La luna se hincha, las estrellas centellean y cruza una estrella fugaz |
| Selector Día · Tarde · Noche | Cambia el paisaje con fundido; flechas, Inicio y Fin cambian de opción |

Las zonas sensibles ignoran los controles (`a`, `button`, `input`, `[role=radio]`…): nunca roban un clic al buscador. En pantallas táctiles solo reaccionan los toques; el parallax es para ratón y lápiz.

## 5. Accesibilidad, movimiento y rendimiento

- Decorativo: `aria-hidden`, sin foco ni eventos. El selector es un `radiogroup` con `aria-label` en español, un solo punto de tabulación (tabindex itinerante), foco visible y objetivos de ≥ 44 px.
- Contraste AA: el texto del héroe se midió muestreando píxeles tras el texto real en los tres temas (percentil 95: 1440×900 ≥ 5,7:1; 390×844 y 360×640 ≥ 4,9:1). Cada tema tiene su scrim; en teléfono una pequeña ventana en el scrim deja brillar el sol o la luna sin tocar el brillo junto al texto. Si cambias nubes, rayos o posiciones de sol/luna, vuelve a medir.
- `prefers-reduced-motion`: sin animaciones ni parallax (el cuadro queda quieto y completo). También se pausa fuera de pantalla y con la pestaña oculta.
- Solo `translate`/`scale`/`opacity` en el compositor y recuentos de partículas acotados; sin canvas ni bucles de JS. **No hay giros de capas a pantalla completa** (rotar una capa del tamaño del viewport era lo más caro de componer: los rayos respiran con opacidad y el cielo se desplaza, solo el puntero inclina los rayos unos grados).
- **Lo invisible no cuesta:** cada grupo cuya opacidad vale 0 en algún tema (sol, rayos, luna, estrellas, Vía Láctea, fugaces, aves, golondrinas, polen, luciérnagas, fogata, resplandor, ventanas, sombras) recibe una clase `ov-<nombre>` y el generador emite `--sc-v-<nombre>: hidden|visible` por tema. `visibility` se anima con `linear` en 1,8 s: se queda visible durante el fundido y pasa a `hidden` al final.
- **Sin `backdrop-filter` sobre la escena:** desenfocar arte animado se recalcula en cada fotograma (la cabecera, la tarjeta de acceso, el buscador, los chips y el selector tenían desenfoques sin efecto visible y se quitaron).
- **Gobernador de calidad** (`lib/scene/scene-quality.ts`): con la página asentada (carga + 1,5 s) mide durante ≈ 2,4 s los fotogramas reales de una escena completa. Si la mediana pasa de 38 ms (< 26 fps; un tope de 30 Hz por ahorro de batería pasa) baja de nivel: `data-scene-q="calm"` en `<html>` (solo se mueven nubes, bruma y fuego) y, si sigue lento, `"still"` (imagen fija, como con movimiento reducido). El veredicto se guarda en `sessionStorage` (`elevari-scene-q`) y `sceneInitScript` lo aplica antes del primer pintado; `Save-Data` arranca en `calm`. Mide solo con la pestaña visible y la escena en pantalla. Para depurar: `sessionStorage.setItem('elevari-scene-q','still')` y recargar, o quitar la clave.
- Presupuesto (`PERFORMANCE_BASELINE.md`): la escena es HTML del servidor; el cliente solo carga el buscador, el selector y el controlador. La foto del héroe anterior ya no se descarga.
- Limitación conocida: en WebKit (Safari) los degradados cuyos puntos dependen de variables CSS pueden no repintarse a mitad del fundido y saltar al valor final; el resultado final es el correcto.

## 6. Móvil y correo (etapa 2; hoy v1)

**Móvil** (`mobile/components/scene/`): `ScenicBackground.tsx` con `react-native-svg` 15.16 (SDK 58) y `Animated` con driver nativo; `motion.ts` (movimiento reducido, app en segundo plano, parallax táctil); `SceneScreen.tsx` para login y registro. Sigue usando la copia v1 de los datos.

**Correo** (`api/src/lib/email-templates/layout.ts`, `brand.ts`): los clientes de correo no admiten SVG ni animación, así que se usa un JPEG de 1200×400 con el texto en HTML real encima. Capas: color sólido `#7C2D12` (imágenes bloqueadas) < `background-image` CSS < VML (Outlook para Windows). Se aloja en GitHub raw como el logo (Cloudflare desafía a los proxies de imágenes de correo); **un archivo nuevo solo es accesible en `raw.githubusercontent.com` cuando llega a `b-main`**. El repositorio debe seguir siendo público.

## 7. Al cambiar la escena

1. `npm run scene:generate && npm run scene:check`.
2. Web: `/` en los tres temas a 1440×900, 768×1024 y 390×844 (clic en el selector, o `document.documentElement.setAttribute('data-elevari-scene','night')`; la hora real vuelve en ≤ 60 s); `/auth/login`, `/auth/register` y `/properties`. Comprueba contraste, solapes, foco del selector y consola sin errores.
3. `npm run typecheck`, y un build de producción (`npx next build --webpack`, como el Dockerfile).
4. Móvil: `cd mobile && npm run typecheck`; revisar en dispositivo cuando exista el renderizador v2.

La fotografía de propiedades (tarjetas, galerías, fichas) es contenido de producto y no forma parte de este sistema.
