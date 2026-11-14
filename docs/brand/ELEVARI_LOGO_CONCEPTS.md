# ELEVARI LOGO CONCEPTS

**Fase:** 3 · **Estado:** propuestas implementadas como SVG en `public/brand/`

---

## Restricciones globales

Prohibido: montañas, cabañas, carpas, árboles, hojas, fogatas. Sin clichés turísticos.

El símbolo debe ser abstracto, reconocible a 16 px y a 1024 px, funcionar sin texto y adaptarse a App Store, Play Store, favicon, header web, redes y print.

Paleta de marca: forest `#2F6B4F`, forest deep `#1E4835`, fresh `#5FA76A`, amber `#E9A820`, amber soft `#F6E3B8`.

---

## Concepto 1 — ELEVARI HORIZON (preferido)

**Archivo:** `public/brand/logo-concept-1-horizon.svg`
**Tema:** elevación, horizonte, viaje.

Un arco continuo (elevación) con dos líneas horizontales (horizonte y luz) y un punto ámbar desplazado (el destino).

- Ya está implementado como isotipo oficial en `components/brand/EleveriMark.tsx`, `app/icon.svg` y `public/brand/eleveri-mark.svg`.
- Fortalezas: abstracto, legible a 16 px, no depende de color, no usa clichés.
- Riesgo: el arco puede leerse como letra "A" o "Λ"; aceptable porque no compite con el wordmark.

**Versión reducida (16 px):** conservar solo el arco y el punto ámbar; eliminar la segunda línea.

---

## Concepto 2 — ELEVARI PATH

**Archivo:** `public/brand/logo-concept-2-path.svg`
**Tema:** exploración, movimiento, destino.

Un trazo que asciende en dos quiebros suaves, con nodo de origen claro y destino ámbar.

- Fortalezas: sensación de recorrido, muy distintivo en tamaños medianos.
- Debilidades: a 16 px los quiebros se pierden; requiere versión simplificada a una sola curva.
- Uso sugerido: campañas de lanzamiento, ilustración editorial.

---

## Concepto 3 — ELEVARI NEST

**Archivo:** `public/brand/logo-concept-3-nest.svg`
**Tema:** confort, refugio, descanso.

Curva superior sólida + curva inferior atenuada (contención) con núcleo ámbar y línea de horizonte.

- Fortalezas: comunica refugio sin dibujar una casa.
- Debilidades: más cercano al imaginario "hogar" que al de naturaleza; menor diferenciación frente a competidores.
- Uso sugerido: submarca de alojamientos o sello de calidad.

---

## Sistema de icono de app

**Archivo maestro:** `public/brand/app-icon-master.svg` (1024 × 1024, radio 224)

| Requisito | Implementación |
|-----------|----------------|
| Reconocible a 16 px | Arco + punto ámbar; trazos de 72 px sobre 1024 |
| Reconocible a 1024 px | Misma geometría, sin detalles finos |
| Silueta única | Arco asimétrico con punto desplazado |
| Funciona sin texto | No contiene lettering |
| App Store / Play Store | Exportar PNG 1024 sin transparencia |
| Favicon | `app/icon.svg` (32 × 32, versión simplificada) |

**Zona de seguridad:** 12% del lado en todos los formatos.
**Fondo:** forest deep plano. No usar degradados en el icono de tienda.

---

## Wordmark

- `eleveri` en minúsculas, Plus Jakarta Sans SemiBold, tracking −0.03em.
- Descriptor secundario opcional: `ESCAPES NATURALES` en mayúsculas 10 px, tracking 0.22em.
- Sobre fondo oscuro: wordmark blanco + descriptor amber soft.
- Sobre fondo claro: wordmark ink + descriptor muted.

Implementación: `components/Logo.tsx`.

---

## Usos incorrectos

- No rotar, deformar ni añadir sombras al isotipo.
- No usar el ámbar como color de texto.
- No colocar el logo sobre fotos sin overlay de contraste.
- No recrear el arco con tipografía.

---

## Próximos pasos de marca

1. Validar el concepto 1 con 5–8 usuarios objetivo (reconocimiento y asociación).
2. Exportar set completo de PNG (16, 32, 48, 180, 192, 512, 1024) desde el maestro.
3. Registrar variante monocromo para grabados y prensa.
4. Congelar la versión 1.0 tras validación y actualizar este documento.
