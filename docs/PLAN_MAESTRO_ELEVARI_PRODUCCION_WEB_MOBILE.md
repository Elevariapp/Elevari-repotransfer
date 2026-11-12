# Elevari — Plan maestro de producción, Web y Apps móviles

> **Estado:** propuesta de planificación; no certifica preparación para producción ni autoriza cambios de arquitectura.  
> **Fecha:** 2026-11-12  
> **Repositorio revisado:** `Elevariapp/Elevari-repotransfer`  
> **Marca del producto:** Elevari. Las menciones a “Waná” que aún aparezcan en código, infraestructura o documentos se consideran legado por reconciliar, no se cambian automáticamente en este plan.

## OBJETIVO

Definir una ruta incremental para preparar Elevari para producción y elevar la experiencia Web, coordinándola con aplicaciones móviles alojadas en repositorios separados, sin duplicar autenticación, pagos ni lógica de negocio.

El objetivo de calidad móvil es ofrecer una experiencia de alojamiento y reservas moderna, rápida, accesible y confiable, tomando como referencia el nivel de calidad percibida de productos líderes como Airbnb; no copiar su marca, diseño, funcionalidades privadas ni asumir paridad completa de alcance.

## JUSTIFICACIÓN

El repositorio documenta una base con Next.js, Fastify, Prisma, PostgreSQL, Docker Compose, Redis, MinIO y Nginx. El roadmap propone Expo/React Native para móvil consumiendo la API existente. Sin embargo, las fuentes contienen contradicciones (especialmente Admin/Supabase y el estado de producción) y no hay evidencia documental suficiente de pruebas operativas completas. Por ello, primero se debe estabilizar y validar el contrato y el entorno de la API; luego desarrollar Web y móvil sobre capacidades compartidas.

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

La revisión fue documental. No se inspeccionó ni ejecutó el entorno de producción.

## ESTADO Y DECISIONES DOCUMENTADAS

- La infraestructura describe una Web Next.js/React/TypeScript y una API REST Fastify en `api/`, con Prisma y PostgreSQL.
- `ROADMAP.md` propone aplicaciones Expo/React Native en una carpeta `apps/mobile` o `mobile/`, usando la misma API REST y JWT; el solicitante prevé repositorios separados. La topología final de repositorios debe aprobarse antes de separar código.
- La guía de infraestructura indica que el nuevo flujo usa la API Fastify y que el legado Supabase/server actions fue eliminado para ese flujo.
- `README_ADMIN.md` todavía prescribe acceso directo a Supabase. Esta contradicción bloquea nuevos cambios de Admin hasta verificar código y resolver la fuente vigente.
- El roadmap marca la Fase 6E como hecha en código, pero no aporta por sí solo evidencia de restauración probada, monitoreo, secretos, TLS y health checks de todos los servicios.
- Las referencias de documentación a Waná deben cotejarse y actualizarse de manera controlada a Elevari. No cambiar identificadores, dominios, variables o nombres internos sin análisis de compatibilidad.

## OBJETIVO DE TRABAJO: PREPARACIÓN PARA PRODUCCIÓN

### Fase P0 — Inventario y cierre de discrepancias

1. Confirmar con evidencia el estado real de servicios, rutas, autenticación, migraciones y despliegues.
2. Resolver la arquitectura Admin y el modelo efectivo de permisos; no trasladar automáticamente políticas RLS de Supabase a PostgreSQL/Prisma.
3. Comparar staging y producción, documentar diferencias intencionales y corregir las no aprobadas.
4. Acordar qué repositorio será fuente de verdad de cada componente y cuál documento gobierna los contratos compartidos.

**Salida:** inventario con estado `documentado / implementado / probado / validado`, responsables y evidencia por requisito.

### Fase P1 — Seguridad y fiabilidad operacional

- Verificar secretos fuera de Git, rotación, permisos y configuración por entorno.
- Revisar puertos expuestos y tráfico Cloudflare–origen; demostrar TLS en el punto previsto y evitar asumirlo por el simple uso de Cloudflare.
- Revisar autorización y exposición de objetos MinIO, incluyendo si el acceso anónimo al bucket es deliberado y limitado a contenido publicable.
- Definir política de backups y retención, ubicación protegida y procedimiento de restauración; ejecutar una restauración en un entorno aislado y conservar evidencia.
- Probar health checks de PostgreSQL, Redis, MinIO, API y Web; no confundir disponibilidad HTTP de una ruta con salud de dependencias.
- Acordar formato de logs, trazabilidad entre petición/API y alertas operativas, usando herramientas compatibles con la infraestructura aprobada.

**Puerta de salida:** restauración probada, controles de secretos/red revisados, servicios críticos con comprobaciones reproducibles y runbook de incidente/rollback.

### Fase P2 — Release reproducible y go-live controlado

- Desplegar primero a staging con configuración representativa y datos de prueba.
- Ejecutar smoke tests de navegación, autenticación, búsqueda, reserva, pago de prueba, webhooks y recuperación ante fallos relevantes.
- Verificar migraciones y estrategia de recuperación antes de producción.
- Promover una versión identificable; observar salud y errores después del despliegue y documentar rollback.

**Puerta de salida:** despliegue reproducible desde documentación, smoke tests aprobados y responsable de go/no-go identificado.

## PLAN DE DESARROLLO WEB + MÓVIL

### Fase A — Contrato de plataforma compartido

- Definir y documentar el contrato oficial de la API (rutas, esquemas, errores, paginación, autenticación, permisos, idempotencia y límites).
- Mantener la API Fastify como única autoridad para reglas de negocio, reservas, pagos y permisos.
- Establecer compatibilidad/versionado y política de deprecación antes de que Web y móvil dependan de nuevos endpoints.
- Definir entornos, CORS, gestión de tokens y política de versiones mínimas del cliente. No guardar secretos de servidor en aplicaciones cliente.

**Aceptación:** Web y móvil pueden consumir el mismo contrato; validaciones automatizadas detectan cambios incompatibles.

### Fase B — Web: conversión, confianza y calidad

Priorizar por datos y pruebas, no por rediseño indiscriminado:

1. Auditar el recorrido explorar → detalle → disponibilidad/precio → checkout → confirmación en móvil y escritorio.
2. Mejorar búsqueda y filtros disponibles según API, estados vacíos, carga, errores y recuperación del checkout.
3. Aclarar precio total, políticas, disponibilidad, identidad/confianza y soporte antes de confirmar la reserva.
4. Medir rendimiento real, accesibilidad, errores y conversión; optimizar las páginas más visitadas y el flujo de reserva.
5. Mantener SEO y analítica documentados, con consentimiento y minimización de datos según los requisitos aplicables.

**Aceptación propuesta para aprobar:** pruebas E2E del flujo principal, presupuesto de rendimiento acordado, revisión de accesibilidad y errores de checkout monitorizados. Las métricas/umbrales se fijarán con datos base antes de declararlas como compromiso.

### Fase C — Móvil: MVP de alta calidad

La base propuesta por `ROADMAP.md` es Expo/React Native; confirmar antes de crear el repositorio móvil o elegir herramientas distintas.

Alcance inicial:

- Inicio de sesión JWT y almacenamiento seguro adecuado al sistema operativo.
- Explorar y buscar propiedades; detalle, ubicación y disponibilidad.
- Reserva y checkout a través de la API y los proveedores de pago existentes; no replicar la lógica de pagos.
- Estados fiables de reserva/pago, errores recuperables, enlaces profundos y notificaciones push con consentimiento.
- Diseño accesible y coherente con la identidad visual de Elevari; telemetría de fallos que no registre secretos ni datos sensibles innecesarios.

Calidad que debe sentirse “de primera”: navegación intuitiva, transiciones cuidadas sin bloquear tareas, búsqueda rápida, información de precio clara, recuperación al perder conectividad, compatibilidad probada en dispositivos reales y soporte para accesibilidad. La experiencia sin conexión no debe confirmar reservas ni pagos hasta que la API valide la operación.

**Aceptación propuesta:** pruebas en iOS y Android, login y ciclo de reserva comprobados contra staging, manejo de expiración de sesión/red, deep links, push en escenarios autorizados, accesibilidad revisada y publicación/rollback documentados.

### Fase D — Evolución coordinada

Después de validar el MVP, priorizar con uso real: funciones de anfitrión, mensajería, calendario, notificaciones más completas y mejoras de descubrimiento. El roadmap ya identifica mensajería, búsqueda y limpieza de legado; no se considerarán parte del MVP móvil sin priorización explícita.

## ESTRATEGIA DE REPOSITORIOS

La separación en repositorios es una decisión del producto aún por concretar. Propuesta a validar:

- **Repositorio de API/plataforma:** backend, Prisma, migraciones y contrato publicado.
- **Repositorio Web:** frontend Next.js que consume exclusivamente la API oficial para datos de negocio.
- **Repositorio móvil:** cliente Expo/React Native, sin backend paralelo.
- **Documentación canónica:** decidir un único lugar autoritativo (repositorio de plataforma o repositorio de documentación); los demás enlazan a él y mantienen solo instrucciones locales.

No dividir el monorepo de manera mecánica. Antes de mover código, inventariar pipelines, variables, imágenes Docker, imports, versionado y responsables. Mantener el repositorio actual como fuente hasta aprobar migración, sincronización y estrategia de retorno. Los nombres/URLs de los otros repositorios no están especificados en esta línea base.

## ARCHIVOS AFECTADOS

En esta propuesta, ninguno. Si se aprueba documentarla en el repositorio, el único cambio inicial será este archivo. La implementación posterior requiere planes por cambio y revisión de las fuentes contradictorias.

## RIESGOS

- Dividir repositorios antes de definir contratos y ownership puede romper builds, despliegues o documentación.
- Dos clientes pueden divergir si reglas de negocio o permisos se implementan en Web/móvil en vez de la API.
- La contradicción sobre Supabase/Admin puede producir controles de acceso inconsistentes.
- “Nivel Airbnb” sin métricas acordadas puede convertirse en un alcance indefinido; se traduce aquí en calidad medible y validación con usuarios.
- Un backup no es una garantía de recuperación hasta que se restaure y verifique.
- Cambios de marca pueden romper URLs, cookies, variables, webhooks o activos si se hacen mediante reemplazo global.

## PLAN DE IMPLEMENTACIÓN

1. Aprobar esta ruta y aclarar arquitectura Admin, repositorios objetivo y alcance del MVP móvil.
2. Crear inventario de producción con evidencias y bloqueantes priorizados.
3. Cerrar primero los bloqueantes de seguridad, backup/restauración y health checks.
4. Publicar contrato de API y estrategia de compatibilidad.
5. Mejorar Web por flujo de conversión y métricas.
6. Preparar repositorio móvil y ejecutar MVP contra staging usando la API compartida.
7. Hacer revisión de release, despliegue gradual y monitoreo antes del go-live.

## PRUEBAS

**Realizadas:** revisión documental de las fuentes listadas.  
**No realizadas:** pruebas de código, Compose, CI, despliegue, backup/restauración, seguridad, Web ni dispositivos móviles.  
**Criterio:** no marcar ningún requisito como probado o validado hasta guardar evidencia reproducible del entorno correspondiente.

## ROLLBACK

Este plan no cambia servicios. Si se incorpora como documento, se revierte eliminando el archivo en un commit normal. Para implementaciones futuras, cada release debe definir rollback específico; en particular, migraciones de base de datos requieren plan compatible de restauración y reversión antes de producción.

## DECISIONES QUE REQUIEREN CONFIRMACIÓN

1. ¿Se confirma Expo/React Native como base del cliente móvil, conforme a `ROADMAP.md`?
2. ¿Cuáles son los nombres y enlaces de los repositorios separados (API, Web y móvil), y dónde residirá la documentación canónica?
3. ¿La plataforma Admin vigente debe migrar por completo al API Fastify/Prisma o existe una excepción aprobada de Supabase?
4. ¿Qué flujo y audiencia son prioridad del MVP y qué métricas de éxito se usarán para definir “a la altura de Airbnb”?
