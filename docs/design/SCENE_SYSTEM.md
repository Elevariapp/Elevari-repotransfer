# ELEVARI SCENE SYSTEM

**Fuente de verdad:** `scripts/scene/` · **Salidas generadas:** no se editan a mano

Fondo vectorial del paisaje Elevari (cordilleras, lago, pinos, sol/luna), sin fotografías, en la paleta terracota/crema. Se dibuja una sola vez y lo consumen web, móvil y correo. Cambia con la hora local de la persona: **dorado** (5–6 h y 16–18 h), **día** (7–15 h) y **noche** (19–4 h).

---

## 1. Generador

| Archivo | Papel |
|---------|-------|
| `scripts/scene/themes.mjs` | Colores por tema (dorado, día, noche), horas y paradas del cielo |
| `scripts/scene/art.mjs` | Geometría (cordilleras, lago, pinos, estrellas, nubes, rayos) |
| `scripts/scene/compose.mjs` | Composición plana (sin variables) para el banner del correo |
| `scripts/scene/generate-scene.mjs` | Escribe todas las salidas |

Salidas: `lib/scene/scene-data.ts` y `mobile/lib/scene-data.ts` (idénticas), `components/scene/scene-themes.css` y `public/brand/email/banner.jpg`.

```bash
npm run scene:generate   # regenerar tras cambiar el arte o los colores; commitear las salidas
npm run scene:check      # falla si las salidas están desactualizadas (también corre en ci:local; no compara el JPEG)
```

## 2. Plataformas

**Web** (`components/scene/`)
- `ScenicBackground.tsx` (servidor) pinta el SVG; `variant="full"` (login, registro) o `"lite"` (franja de horizonte para bandas y héroes). `scrim` oscurece donde va el texto.
- `SceneController.tsx` (cliente) mantiene la hora, mueve el parallax con ratón/lápiz y pausa todo fuera de pantalla.
- `scene-themes.css` define las variables por tema; el cambio de tema se interpola. `scene.css` tiene las animaciones.
- `sceneInitScript` (`lib/scene/time-of-day.ts`, en `<head>` de `app/layout.tsx`) fija `data-elevari-scene` en `<html>` antes del primer pintado.
- Usos: `AuthShell` y `AuthPageFallback` (login, registro, recuperar y restablecer contraseña), `SceneBand` (home) y el héroe del catálogo.

**Móvil** (`mobile/components/scene/`)
- `ScenicBackground.tsx` con `react-native-svg` y `Animated` con driver nativo; `motion.ts` (movimiento reducido, app en segundo plano, parallax táctil ×0.35); `SceneScreen.tsx` es el contenedor de login y registro.
- Teléfono vertical: escena arriba y hoja crema debajo. Tablet y horizontal: tarjeta centrada sobre la escena.
- Requiere `react-native-svg` 15.16.0 (versión de Expo SDK 58).

**Correo** (`api/src/lib/email-templates/layout.ts`, `brand.ts`)
- Los clientes de correo no admiten SVG ni animación: se usa `banner.jpg` (1200×400) con el texto en HTML real encima.
- Capas: color sólido `#7C2D12` (imágenes bloqueadas) < `background-image` CSS < VML (Outlook para Windows).
- Se aloja en GitHub raw, igual que el logo, porque Cloudflare desafía a los proxies de imágenes de correo. El repositorio debe seguir siendo público.

## 3. Accesibilidad y movimiento

- Decorativo: `aria-hidden`, nunca recibe foco ni toques.
- Texto sobre la escena con contraste AA (≥ 4.5:1) en los tres temas y en todos los tamaños.
- `prefers-reduced-motion` (web) y «reducir movimiento» (móvil) dejan la escena quieta. También se pausa con la pestaña oculta, fuera de pantalla o con la app en segundo plano.

## 4. Al cambiar la escena

1. `npm run scene:generate && npm run scene:check`.
2. Web: ver `/auth/login` y `/auth/register` en los tres temas (`theme="night"` en el componente, o `document.documentElement.setAttribute('data-elevari-scene', 'night')`, que se restablece a la hora real en ≤ 60 s) en móvil y escritorio, y comprobar el contraste del texto.
3. Móvil: `cd mobile && npm run typecheck`; revisar en simulador o dispositivo (`theme` admite `'golden' | 'day' | 'night'`).
4. Correo: renderizar `welcome` y `bookingConfirmation` y revisar a 320, 375 y 600 px y con imágenes bloqueadas.

La fotografía de propiedades (`SearchHero`, tarjetas, galerías) es contenido de producto y no forma parte de este sistema.
