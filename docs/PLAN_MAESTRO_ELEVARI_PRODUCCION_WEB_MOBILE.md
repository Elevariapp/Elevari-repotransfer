# Elevari — Plan maestro por fases: producción, Web y Apps móviles

> **Estado:** propuesta canónica de planificación; no certifica preparación para producción ni autoriza cambios de arquitectura.  
> **Fecha:** 2026-11-12  
> **Repositorio de referencia:** `Elevariapp/Elevari-repotransfer`  
> **Marca:** Elevari. Las menciones a “Waná” en código/documentos son legado por reconciliar; no se cambiarán automáticamente.  
> **Criterio:** se incorporan del material de apoyo solo elementos compatibles con la arquitectura y las decisiones documentadas del repositorio.

## OBJETIVO

Preparar Elevari para operar en producción y evolucionar Web y aplicaciones móviles mediante fases con entregables y gates verificables. La calidad UX se inspira en atributos asociados a Palantir, Apple y Airbnb —claridad para tareas complejas, pulido y consistencia, confianza y facilidad de reserva—, pero se medirá con criterios propios de Elevari. No significa copiar sus interfaces, asumir su escala ni replicar todas sus funciones.

## JUSTIFICACIÓN

El repositorio documenta Next.js, React, TypeScript, Fastify, Prisma, PostgreSQL, Docker Compose, Redis, MinIO y Nginx. El roadmap propone Expo/React Native consumiendo la API existente. El material de apoyo incluye propuestas útiles —inventario, protección ante reservas concurrentes, pruebas por entorno, publicación móvil, atención al cliente y documentación operativa— y también ideas no respaldadas por la arquitectura vigente, como adoptar cloud/IaC o nuevos servicios sin aprobación. Este plan selecciona lo compatible y marca decisiones abiertas sin inventar tecnología.

## DOCUMENTOS CONSULTADOS

- `INFRASTRUCTURE.md`
- `ROADMAP.md`
- `README_ADMIN.md`
- `docker-compose.prod.yml`
- `docker-compose.staging.yml`
- `docker-compose.yml`
- `package.json`
- `tsconfig.json`
- `deploy/DEPLOYMENT_PRODUCTION.md`
- `deploy/scripts/backup-db.sh`
- `deploy/scripts/verify-health.sh`
- `deploy/nginx/nginx.conf`
- `deploy/nginx/nginx.staging.conf`
- `docs/QUALITY_FRAMEWORK_GO_NO_GO.md`

La revisión fue documental; no se ejecutó el código ni se inspeccionó producción.

## ESTADO Y DECISIONES DOCUMENTADAS

- La infraestructura describe Web Next.js/React/TypeScript, API REST Fastify en `api/`, Prisma y PostgreSQL.
- La infraestructura existente incluye Docker Compose, PostgreSQL, Redis, MinIO y Nginx. No se propone cambiar proveedores ni introducir Kubernetes, serverless, Terraform/Pulumi, GraphQL, microservicios u otros servicios sin aprobación explícita.
- `ROADMAP.md` propone Expo/React Native para móvil con la misma API REST y JWT; el solicitante prevé repositorios separados. Se debe confirmar framework, repositorios y ownership antes de mover o crear código.
- La documentación de infraestructura indica que los nuevos flujos usan Fastify y que el legado Supabase/server actions fue eliminado para el nuevo flujo.
- `README_ADMIN.md` prescribe Supabase directo. La contradicción bloquea cambios de Admin hasta verificar código y resolver la fuente vigente.
- El roadmap marca Fase 6E como hecha en código, pero no aporta evidencia de restauración probada, monitoreo, secretos, TLS y health checks de todos los servicios.
- El roadmap marca Marketing (Fase 4) y Alegra (Fase 6B) como completados; se deben validar en el código/entorno, no rehacer por asumir que faltan.
- La documentación no demuestra que la prevención de reservas concurrentes o la idempotencia de pagos estén probadas. Se tratarán como capacidades a inspeccionar y validar, no como defectos confirmados.

## PRINCIPIOS NO NEGOCIABLES

1. No inventar arquitectura ni declarar funcionalidades implementadas o validadas sin evidencia.
2. La API Fastify es la autoridad para las reglas de negocio, permisos, reservas y pagos, una vez comprobada su vigencia en el código.
3. Web y móvil consumen la misma API oficial; no crean backends ni pagos paralelos.
4. Resolver contradicciones documentales antes de implementar el área afectada.
5. Mantener separados los estados **documentado**, **implementado**, **probado** y **validado en el entorno objetivo**.
6. Cada fase requiere entregables verificables y una puerta de salida. No hay GO solo por calendario, promedio de métricas o calidad visual percibida.
7. Los repositorios separados comparten contratos versionados y estándares; no comparten secretos.
8. Seguridad, privacidad, accesibilidad, rendimiento, localización y operación se consideran desde el diseño.
9. No se asignan estimaciones de duración sin conocer alcance, equipo y capacidad disponibles.

## FORMATO OBLIGATORIO ANTES DE CADA CAMBIO

Antes de modificar código o configuración, presentar: **OBJETIVO, JUSTIFICACIÓN, DOCUMENTOS CONSULTADOS, ARCHIVOS AFECTADOS, RIESGOS, PLAN DE IMPLEMENTACIÓN, PRUEBAS y ROLLBACK**. Para cambios documentales, indicar explícitamente que no se alteran código/servicios ni se ejecutan pruebas de aplicación.

# PLAN DE FASES

Las fases tienen dependencias. La documentación, investigación UX y el saneamiento operacional pueden avanzar en paralelo cuando no dependan de una decisión arquitectónica pendiente. Una fase se cierra con su gate, no por una fecha estimada.

## FASE 0 — Inventario, fuente canónica y decisiones

**Objetivo:** establecer qué existe realmente y quién es responsable.

**Trabajo:**
- Inventariar repositorios, carpetas, paquetes, servicios, dependencias, migraciones, workflows CI/CD, despliegues y entornos.
- Comparar documentos con el código para API, auth, reservas, pagos, Admin, medios y marketing.
- Resolver la contradicción Admin/Supabase vs. API Fastify/Prisma.
- Definir dónde viven los documentos canónicos, contratos API y sistema de diseño; enlazarlos desde otros repositorios.
- Mantener matriz de estado `documentado / implementado / probado / validado`, con evidencia, responsable y bloqueos.
- Acordar alcance del MVP huésped y qué se excluye.

**Entregables:** mapa del ecosistema, inventario de riesgos, registro de decisiones, ownership por repositorio y matriz de capacidades.

**Gate de salida:** arquitectura efectiva y repositorios de trabajo conocidos; contradicciones relevantes resueltas o explícitamente bloqueadas; alcance MVP aprobado.

## FASE 1 — Base operacional y preparación de producción

**Objetivo:** validar la infraestructura documentada sin reemplazarla por una arquitectura no aprobada.

**Trabajo:**
- Validar Docker Compose local y staging; cotejar staging/producción y marcar diferencias intencionales.
- Revisar secretos, acceso mínimo, rotación y separación de configuración por entorno; comprobar que no haya credenciales versionadas.
- Verificar puertos expuestos, firewall, TLS y recorrido Cloudflare–origen para el entorno real.
- Revisar exposición/lectura anónima de MinIO frente a la clasificación de objetos.
- Verificar health checks de PostgreSQL, Redis, MinIO, API, Web y proxy; distinguir liveness/readiness donde aplique.
- Definir logs estructurados, trazabilidad entre peticiones, métricas/alertas y responsables operativos usando soluciones compatibles ya aprobadas.
- Definir frecuencia, retención y ubicación protegida de backups; restaurar una copia reciente en entorno aislado y conservar evidencia.
- Aprobar objetivos RPO/RTO y runbooks de despliegue, incidente, rollback y recuperación.

**Entregables:** comparación de entornos; matriz de exposición/secretos; evidencia de health checks y restauración; runbooks.

**Gate de salida:** restauración comprobada, secretos y red revisados, checks reproducibles, staging operativo y rollback probado. No equivale por sí solo a GO de producción.

## FASE 2 — Integridad de dominio y contrato de la API

**Objetivo:** asegurar que la lógica compartida se mantenga en el backend y sea consumible por Web y móvil.

**Trabajo:**
- Documentar el contrato real: rutas, validaciones, errores, paginación, auth, permisos, idempotencia, límites y webhooks.
- Revisar el ciclo de reserva existente y verificar reglas de disponibilidad para el mismo alojamiento/unidad y fechas.
- Inspeccionar restricciones de base de datos, transacciones Prisma/PostgreSQL y flujo de estados antes de diseñar cambios; no introducir bloqueo o modelo de habitaciones sin requerimiento confirmado.
- Probar carreras de solicitudes para fechas coincidentes: el resultado debe impedir dos reservas confirmadas incompatibles. Validar cancelación/liberación y re-reserva con las reglas de negocio reales.
- Comprobar idempotencia de creación de reservas y callbacks/webhooks de pago; reintentos no deben duplicar reservas, cobros ni facturas.
- Versionar el contrato y establecer compatibilidad/deprecación, con pruebas automatizadas para cambios incompatibles.
- Confirmar autorización en servidor, no en controles visuales del cliente.

**Entregables:** especificación/versionado API, modelo de estados aprobado, pruebas de concurrencia/idempotencia y plan de compatibilidad.

**Gate de salida:** Web y móvil pueden integrar sin lógica de negocio duplicada; flujos de reserva/pago tienen pruebas de integridad en staging.

## FASE 3 — Investigación UX y sistema de diseño Elevari

**Objetivo:** dar base verificable a una UI/UX robusta y distintiva.

**Trabajo:**
- Identificar huéspedes/anfitriones objetivo y tareas prioritarias mediante investigación disponible.
- Mapear explorar → comparar → detalle → precio/disponibilidad → checkout → confirmación; incluir cuenta y soporte según alcance.
- Registrar línea base de conversión, errores, abandono y rendimiento si hay datos disponibles; respetar consentimiento y privacidad.
- Definir principios visuales, tokens, tipografía, espaciado, color, iconografía, movimiento, componentes y estados.
- Especificar comportamiento responsive Web y convenciones nativas móviles, sin forzar una interfaz idéntica donde la plataforma requiera otra interacción.
- Diseñar estados de carga, vacío, éxito, error, reintento, pérdida de red, sesión expirada y doble acción.
- Incorporar accesibilidad con objetivo Web WCAG 2.2 AA y prácticas equivalentes de iOS/Android; validar manualmente teclado, foco, lector de pantalla, contraste y ampliación.
- Probar prototipos de tareas críticas con usuarios o evaluación de usabilidad aprobada.

**Entregables:** mapa de journeys, línea base/hipótesis, sistema de diseño, especificaciones y resultados de pruebas de usabilidad/accesibilidad.

**Gate de salida:** tareas prioritarias y estados definidos, defectos críticos de UX/accesibilidad identificados y sistema visual revisado por producto/diseño. No exige rediseñar toda la plataforma de una vez.

## FASE 4 — Web: flujo principal de alto nivel

**Objetivo:** mejorar conversión, confianza, claridad y rendimiento basándose en la investigación.

**Trabajo:**
- Priorizar discovery, filtros disponibles en API, resultados y estados vacíos.
- Mejorar detalle de propiedad, contenido, ubicación, disponibilidad, políticas, precio total y confianza.
- Simplificar checkout y confirmar claramente el estado real de reserva/pago y próximos pasos.
- Implementar componentes aprobados; revisar tamaños/navegadores objetivo, teclado y estados de error.
- Ejecutar pruebas unitarias/integración/E2E de journeys críticos y regresión.
- Medir con presupuesto acordado desde línea base. No adoptar Lighthouse >90/95 u otros números arbitrarios sin fijar dispositivo, metodología, alcance y aprobación.
- Revisar PWA/offline solo si investigación y requisitos lo justifican; no confirmar reservas/pagos sin validación del servidor.

**Entregables:** Web iterada por journeys; pruebas E2E; QA visual/accesible; medición pre/post y defectos priorizados.

**Gate de salida:** journeys Web incluidos pasan QA en staging, sin S0/S1 abiertos, y las métricas/umbrales aprobados se cumplen o tienen NO-GO documentado.

## FASE 5 — Aplicación móvil: plataforma y MVP huésped

**Objetivo:** construir una experiencia iOS/Android de calidad usando la API actual.

**Decisión previa:** el roadmap propone Expo/React Native. Confirmar esa opción y los repositorios móviles antes de crear/mover código.

**Trabajo:**
- Definir pipeline, signing, distribución interna, configuración por ambiente y proceso de release.
- Implementar auth JWT con almacenamiento seguro de credenciales apropiado a plataforma; nunca incluir secretos de servidor.
- Implementar explorar/buscar, detalle, disponibilidad, reserva y checkout a través de la API/proveedores existentes.
- Resolver estados de sesión expirada, red, reintento, operación duplicada, deep links y retorno de pago.
- Añadir push con consentimiento y contrato servidor aprobado; manejar preferencias y permisos del SO.
- Probar en dispositivos/simuladores iOS y Android objetivo, accesibilidad y rendimiento percibido.
- Documentar requisitos de privacidad, contenido, metadata y preparación para revisión de App Store/Google Play. Preparar publicación no significa que las tiendas ya hayan aprobado la app.

**Entregables:** app instalable/beta, builds identificados, matriz de dispositivos, recorrido integrado de reserva y documentación de publicación.

**Gate de salida:** login y ciclo principal validados contra staging en ambas plataformas; pruebas de accesibilidad y errores superadas; el servidor conserva autoridad sobre reserva y pago.

## FASE 6 — Marketing, adquisición y analítica

**Objetivo:** comprobar y extender capacidades de marketing sin duplicar lo que el roadmap declara completado.

**Trabajo:**
- Auditar SEO, sitemap/robots, metadata, analítica, eventos, correo y CAPI existentes.
- Corregir brechas demostradas; verificar eventos de búsqueda, detalle, inicio de checkout y compra con deduplicación, consentimiento y minimización de datos.
- Acordar páginas/landing prioritarias por mercado y probar contenido/experimentos solo con hipótesis, métrica y revisión de privacidad.
- Revisar calidad de datos en reportes antes de tomar decisiones de inversión.

**Entregables:** inventario verificado, tracking plan, QA de eventos, mejoras priorizadas y reporte de resultados.

**Gate de salida:** eventos críticos probados extremo a extremo, sin duplicación conocida, y analítica conforme a decisiones de privacidad.

## FASE 7 — Atención al cliente: automatización y WhatsApp (exploratoria)

**Objetivo:** mejorar soporte sin permitir que automatización comprometa reservas, pagos o privacidad.

**Precondiciones:** confirmar demanda, owner de soporte, proveedor/canal aprobado, requisitos legales/consentimiento, base documental, datos permitidos y mecanismo de transferencia a persona.

**Primera etapa:** FAQ y ayuda con respuestas basadas en contenido aprobado; identificar cuándo la respuesta no es confiable y escalar a humano. No permitir que el asistente confirme disponibilidad, cambie/cancele una reserva, cobre o emita reembolsos sin endpoints y controles explícitos aprobados.

**WhatsApp:** evaluar integración oficial, consentimiento/opt-in, plantillas, retención y soporte humano. No elegir proveedor, LLM/RAG, framework ni construir servicio separado sin decisión documentada.

**Entregables:** decisión de factibilidad, mapa de riesgos, prototipo acotado y pruebas de respuestas/escalamiento antes de producción.

**Gate de salida:** revisión de seguridad/privacidad/negocio aprobada, respuestas y handoff probados, métricas y responsable de soporte definidos. Si no se cumplen precondiciones, fase queda en investigación, no en implementación.

## FASE 8 — Documentación, CI/CD y operación continua

**Objetivo:** asegurar que todo equipo pueda desarrollar, revisar, desplegar y responder a incidentes desde una fuente canónica.

**Trabajo continuo:**
- Mantener README de desarrollo/despliegue, arquitectura y decisiones (ADR), contrato API, esquema/migraciones, runbooks y políticas de seguridad.
- Documentar setup local, variables de ejemplo sin valores secretos y procedimiento de staging/prod.
- Verificar workflows existentes antes de crear otros: build, lint, test, Docker, migraciones, deploy y approvals.
- Definir staging automático y producción con aprobación si encaja con la política ya existente; rollback y compatibilidad DB explícitos.
- Mantener checklist de PR, release y evidencia GO/NO-GO.

**Entregables:** docs vigentes, CI reproducible, owners, checklist y reporte de release.

**Gate de salida:** una persona autorizada puede reproducir setup/deploy y ejecutar runbooks según evidencia registrada.

## FASE 9 — Integración, certificación y GO/NO-GO

**Objetivo:** decidir si un release concreto puede ir a producción.

**Trabajo:**
- Ejecutar los gates del framework `docs/QUALITY_FRAMEWORK_GO_NO_GO.md` para cada componente/cliente afectado.
- Validar pruebas unitarias, integración, E2E, contratos, migraciones, concurrencia/idempotencia de reserva/pago y smoke tests.
- Revisar seguridad, accesibilidad, rendimiento, compatibilidad Web/móvil, salud, monitoreo, backup/restauración y soporte.
- Confirmar el commit/tag/build exactos, riesgos abiertos, dueños, ventana de observación y condición de rollback.
- Registrar aprobación humana explícita de responsables de producto, diseño, ingeniería, seguridad y operación según aplique.

**Gate:** cualquier evidencia faltante, S0/S1 abierto o recuperación crítica no demostrada implica **NO-GO**. Staging aprobado no equivale a producción aprobada.

## FASE 10 — Lanzamiento y mejora posterior

**Objetivo:** observar el comportamiento real, responder y mejorar de forma controlada.

**Trabajo:**
- Desplegar versión identificable y ejecutar smoke tests no destructivos.
- Observar salud de servicios, errores, rendimiento, reservas/pagos y soporte durante ventana aprobada.
- Activar rollback si se alcanzan condiciones definidas.
- Elaborar revisión posterior y priorizar correcciones/mejoras con datos de día 1, 7 y 30 si el equipo aprueba esas ventanas.
- Añadir funciones de anfitrión, mensajería, chatbot, crecimiento y limpieza legacy de forma separada y con su propio gate.

**Gate de salida:** estabilidad y acciones post-lanzamiento documentadas; las nuevas funcionalidades no se usan para evadir defectos del release inicial.

## ALCANCE SELECCIONADO DEL MATERIAL DE APOYO

**Se incorpora porque es útil y compatible:**
- Inventario de repositorio, dependencias, DB, migraciones, despliegue e issues cuando estén disponibles.
- Protección contra doble reserva y pruebas de concurrencia; idempotencia de webhooks y operaciones repetibles.
- Contrato API, pruebas de integración/E2E, health checks, backups y restauración.
- QA responsive/accesible y journeys de reserva.
- Preparación de publicación móvil y pruebas iOS/Android.
- SEO/analítica revisados contra lo ya documentado como implementado.
- Atención humana/automatizada como fase exploratoria condicionada.
- Documentación, CI/CD, rollback y operaciones mantenidos continuamente.

**No se adopta sin una decisión explícita o evidencia de necesidad:**
- Cambiar a AWS/GCP/Azure, agregar Terraform/Pulumi, Kubernetes o serverless; contradice la infraestructura actualmente documentada o introduce proveedor/tecnología nueva.
- GraphQL, servicios auth/booking/chatbot separados o dividir API en microservicios; la documentación vigente describe Fastify REST.
- Tablas `rooms`, `guests`, `chat_sessions` u otras entidades propuestas sin validar modelo y necesidades en Prisma.
- Reestructurar en el monorepo sugerido; el solicitante prevé repos separados y primero debe decidirse su topología.
- Elegir Zustand/Redux, PWA/offline, proveedor LLM, LangChain/LlamaIndex o WhatsApp provider por recomendación genérica.
- Aplicar puntuaciones Lighthouse fijas, AAA en todo el producto o cronogramas 12–20 semanas sin línea base, objetivo de conformidad, metodología ni capacidad aprobada.
- Usar Cypress/“Resurrectors” u otra herramienta por nombre sin verificar stack y compatibilidad; las herramientas de pruebas se eligen según repositorio existente.
- Tratar el chatbot como autoridad de reserva/pago o desplegar mensajes automáticos sin consentimiento, controles y handoff humano.

## ESTRATEGIA DE REPOSITORIOS

Propuesta pendiente de aprobación:

- **Plataforma/API:** Fastify, Prisma, migraciones y contrato publicado.
- **Web:** Next.js que consume la API oficial para datos de negocio.
- **Móvil:** Expo/React Native si se confirma; sin backend paralelo.
- **Documentación canónica:** un único origen autoritativo y enlaces desde los demás repositorios.
- **Sistema de diseño:** fuente y distribución definidas para Web/móvil sin duplicar tokens ni acoplar ciclos de despliegue indebidamente.

No dividir el repositorio actual mecánicamente. Antes de mover código, inventariar pipelines, variables, imágenes, imports, versionado y responsables. Mantener el repositorio actual como fuente hasta aprobar migración y retorno.

## RIESGOS

- Separar repositorios antes de definir ownership y contratos puede romper builds/despliegues.
- Duplicar reglas de negocio en clientes puede producir reservas, pagos o permisos inconsistentes.
- La contradicción Admin/Supabase puede llevar a controles de acceso incoherentes.
- Asumir que la reserva está protegida contra concurrencia sin pruebas puede ocasionar doble booking; se debe comprobar en código y staging antes de afirmar el estado.
- Chatbot/WhatsApp sin consentimiento, fuentes confiables, privacidad y escalamiento humano puede comunicar información errónea o filtrar datos.
- Un backup no demuestra recuperación hasta ser restaurado y verificado.
- Cambios de marca globales pueden romper dominios, cookies, variables, webhooks y activos.
- Metas de calidad sin línea base ni método producen falsos GO/NO-GO.

## PLAN DE IMPLEMENTACIÓN DOCUMENTAL

1. Aprobar alcance, responsables, decisiones pendientes y fuente canónica.
2. Completar Fase 0 e inventario basado en código/documentación.
3. Cerrar primero bloqueos de seguridad, recuperación, health checks y contrato API.
4. Ejecutar investigación UX y validar sistema de diseño.
5. Mejorar Web por iteraciones; preparar móvil sobre la API cuando contrato y staging estén listos.
6. Auditar marketing existente y abrir investigación de soporte/WhatsApp solo con precondiciones.
7. Aplicar el framework GO/NO-GO por release y componente.

## PRUEBAS Y VALIDACIÓN

**Realizadas:** revisión documental de las fuentes listadas.  
**No realizadas:** inventario de issues, ejecución de CI, pruebas de código/Compose, carga, seguridad, concurrencia, despliegue, restauración de backup, investigación con usuarios, Web o dispositivos móviles.  
**Resultado:** plan actualizado; no se asigna GO de producción ni se afirma que la reserva concurrente esté probada.

## ROLLBACK

Esta actualización es solo documental. Revertir el commit de este archivo no tiene efectos en código, datos ni servicios. Todo cambio de implementación tendrá rollback propio; especialmente migraciones, reservas y pagos requieren compatibilidad y recuperación aprobadas.

## DECISIONES PENDIENTES PARA CERRAR FASE 0

1. Confirmar Expo/React Native como base móvil y proporcionar nombres/enlaces de repositorios separados.
2. Definir dónde reside la documentación canónica y el sistema de diseño.
3. Resolver arquitectura Admin vigente: API Fastify/Prisma o excepción aprobada de Supabase.
4. Confirmar alcance del MVP huésped, mercado e idiomas iniciales.
5. Nombrar responsables de producto, diseño, API, Web, móvil, seguridad y operación.
6. Acordar métricas/umbrales de UX, rendimiento y operación a partir de una línea base.
7. Aprobar el alcance de investigación para chatbot/WhatsApp; permanecerá fuera de producción hasta resolver consentimiento, proveedores y escalamiento.

## PUNTO DE INICIO DEL DESARROLLO

**Podemos empezar el desarrollo del primer incremento controlado cuando se cierre el Gate de Fase 0:** existe ownership claro, arquitectura aplicable confirmada para el área, alcance/criterios de aceptación aprobados, contrato API suficiente, staging utilizable y framework de calidad aceptado. No es necesario esperar que toda producción esté perfecta para trabajar en tareas seguras de desarrollo; sí es obligatorio mantener NO-GO para producción hasta aprobar los gates del framework.

Con la evidencia documental disponible hoy, el plan y el marco de calidad ya están establecidos, pero **Fase 0 no está cerrada**: faltan inventario del código/entornos, decisión de repositorios/Expo, resolución Admin y nombramiento de responsables. El próximo paso de desarrollo es completar ese inventario en el repositorio y validar el flujo de reserva concurrente en código/pruebas; después se puede declarar formalmente **“listos para empezar el primer incremento”**. No se afirma todavía que Elevari esté lista para producción.
