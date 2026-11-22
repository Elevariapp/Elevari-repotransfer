# ELEVARI BRAND GUIDE

**Fase:** 3 — Elevari Experience System
**Versión:** 1.0
**Fuente de verdad de tokens:** `app/globals.css` (`@theme`) + `lib/design-tokens.ts`

---

## 1. Posicionamiento

Elevari no es un marketplace de reservas. Es una plataforma para descubrir escapes excepcionales.

Ideas núcleo: naturaleza · desconexión · bienestar · exploración · alojamientos únicos · experiencias memorables.

**Promesa:** el huésped ve el precio total antes de pagar, reserva con anfitriones verificados y recibe confirmación clara.

---

## 2. Personalidad

Amable · Premium · Confiable · Natural · Moderna · Serena · Humana.

Nunca corporativa, nunca fría, nunca agresiva.

**Premium sin lujo:** evitamos el lenguaje visual de casinos, joyería, finanzas o productos black/gold.

---

## 3. Principios de calidad

| Principio | Implicación operativa |
|-----------|----------------------|
| Clarity First | Precio, disponibilidad y estado de reserva siempre explícitos |
| Trust Before Conversion | Cada pantalla suma confianza (anfitrión verificado, pago seguro, soporte) |
| Photography Dominates | 90% destino, 10% interfaz; la UI nunca compite con la foto |
| Mobile First | Todo flujo debe sentirse nativo en un teléfono |
| Simplicity Wins | Menos opciones, menos carga cognitiva, menos fricción |
| Speed Equals Quality | Performance es parte del producto |
| Consistency Everywhere | Un solo lenguaje visual en web y futuras apps |
| Premium Without Luxury | Calidez y credibilidad, no ostentación |

---

## 4. Paleta

| Rol | Token | Hex | Uso |
|-----|-------|-----|-----|
| Primario | `--elevari-forest` | `#2F6B4F` | CTA principal, header, marca |
| Primario profundo | `--elevari-forest-deep` | `#1E4835` | Header, footer, hover de CTA |
| Secundario | `--elevari-fresh` | `#5FA76A` | Isotipo, acentos naturales, éxito suave |
| Acento | `--elevari-amber` | `#E9A820` | Estrellas, badges, destacados |
| Acento texto | `--elevari-amber-ink` | `#7A4A00` | Texto sobre fondos ámbar suaves |
| Fondo | `--elevari-ivory` | `#F7F4EC` | Fondo general |
| Superficie | `--elevari-surface` | `#FFFFFF` | Tarjetas y formularios |
| Arena | `--elevari-sand` | `#E8E3D5` | Separadores, estados inactivos |
| Texto | `--elevari-slate` | `#22313F` | Texto principal |
| Texto tinta | `--elevari-ink` | `#16222C` | Títulos de máximo contraste |
| Texto secundario | `--elevari-muted` | `#5C6B65` | Texto de apoyo |
| Borde | `--elevari-border` | `#E2DCCC` | Bordes y divisores |

**Feedback:** success `#2F6B4F` · warning `#7A4A00` · error `#B3261E` (cada uno con su variante `-soft`).

### Reglas de contraste (WCAG 2.2 AA)

| Combinación | Ratio | Veredicto |
|-------------|-------|-----------|
| Slate sobre Ivory | 12.10 | ✅ Texto normal |
| Blanco sobre Forest | 6.29 | ✅ CTA y header |
| Blanco sobre Forest Deep | 10.33 | ✅ |
| Slate sobre Amber | 6.39 | ✅ Botón acento |
| Forest sobre Ivory | 5.73 | ✅ Enlaces |
| Muted sobre Ivory | 5.10 | ✅ Texto secundario |
| Amber sobre Ivory | 1.89 | ❌ Nunca para texto |

> Regla dura: el ámbar `#E9A820` es **decorativo** (estrellas, iconos, fondos). Para texto sobre claro usar `amber-ink` o `slate`.

---

## 5. Tipografía

| Rol | Familia | Peso | Token |
|-----|---------|------|-------|
| Logo y titulares | Plus Jakarta Sans | 600–700 | `font-display` |
| Interfaz y cuerpo | Inter | 400–600 | `font-sans` |
| Dashboard | Inter | 400–600 | `font-sans` |

Sin fuentes decorativas. Sin serif.

Escala: `--text-hero`, `--text-heading`, `--text-body`, `--text-caption`, `--text-button`.
Las clases `.wana-display-hero`, `.wana-display-section`, `.wana-display-page` y `.wana-section-title` consumen la familia display.

---

## 6. Voz y tono

- Español neutro colombiano, cercano y claro.
- Frases cortas. Sin jerga técnica en la interfaz.
- Hablar de la experiencia, no del sistema.
- Errores: explicar qué pasó y qué hacer, nunca culpar al usuario.

Ejemplos:
- ✅ "Precio total antes de pagar."
- ✅ "Estas fechas no están disponibles. Prueba otro rango."
- ❌ "Transacción rechazada por el gateway."

---

## 7. Fotografía

- Luz natural, hora dorada, paisaje protagonista.
- Personas de espaldas o de perfil; nunca poses de catálogo.
- Mezcla obligatoria: plano amplio del entorno + detalle de refugio + experiencia (fogata, desayuno, cielo).
- Prohibido: renders, stock genérico, saturación excesiva, tipografía quemada en la imagen.
- Overlay de legibilidad: gradiente negro 45–90% solo donde hay texto.

Ver `docs/brand/ELEVARI_MOODBOARD.md`.

---

## 8. Aplicación por plataforma

| Plataforma | Regla |
|------------|-------|
| Web | Header forest, fondo ivory, tarjetas blancas, CTA forest |
| Email | Fondo ivory, cabecera forest con wordmark blanco, CTA forest |
| App (futuro) | Mismos tokens; navegación nativa, no copiar el header web |
| Social | Isotipo forest + acento ámbar; foto siempre protagonista |

---

## 9. Gobernanza

1. Todo valor visual nuevo entra primero como token en `app/globals.css`.
2. Ningún componente usa hex directo (excepto SVG de marca documentados).
3. Los tokens `wana-*` son **legacy**: se mantienen como alias hasta completar la migración (`docs/design/UI_MIGRATION_PLAN.md`).
4. Cambios de paleta requieren pasar la tabla de contraste de este documento.
