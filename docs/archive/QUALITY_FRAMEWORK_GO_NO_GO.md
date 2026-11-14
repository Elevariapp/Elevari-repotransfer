# Elevari — Framework verificable de calidad y decisión GO / NO-GO

> **Estado:** propuesta de estándar operativo; requiere aprobación de responsables de producto, ingeniería, diseño y operación antes de aplicarse como política de release.  
> **Propósito:** decidir con evidencia si un release de Elevari puede avanzar a staging, beta o producción.  
> **Principio:** la calidad visual y funcional se inspira en los niveles de exigencia asociados a Palantir, Apple y Airbnb, pero se evalúa con criterios propios de Elevari; no implica copiar productos ni asumir su escala.

## 1. Regla de decisión

Un release solo es **GO** cuando:

1. Todos los gates obligatorios aplicables al tipo de release tienen evidencia registrada y vigente.
2. No hay defectos bloqueantes abiertos.
3. Cada riesgo residual tiene responsable, mitigación y aceptación explícita de la persona autorizada.
4. Se ha probado el plan de rollback o recuperación que corresponda.
5. Las personas responsables de producto, ingeniería y operación han registrado su decisión.

La decisión **NO-GO** es obligatoria si falta evidencia de un gate, existe un bloqueante, el riesgo excede lo aprobado o no se puede recuperar de un fallo crítico. Un promedio o puntuación alta no compensa el incumplimiento de un gate obligatorio.

## 2. Estados y alcance de evaluación

Cada criterio se registra como uno de estos estados:

- **N/A:** no aplica; incluir justificación y aprobador.
- **Pendiente:** falta implementar, probar o recopilar evidencia.
- **Fallido:** evidencia demuestra incumplimiento.
- **Aprobado:** cumple y tiene evidencia reproducible.
- **Aceptado con excepción:** desviación documentada, mitigación, responsable, vencimiento y aprobación explícita. Nunca se permite excepción para un gate clasificado como no eximible.

La revisión distingue el artefacto y entorno: Web, API, infraestructura, móvil iOS y móvil Android pueden tener decisiones separadas. Un GO de staging no equivale a GO de producción ni a aprobación de publicación en tiendas.

## 3. Severidad de defectos

- **S0 — Crítico:** exposición o pérdida de datos, acceso no autorizado, cobro/reserva incorrectos a escala, secreto comprometido, corrupción de datos o indisponibilidad total sin recuperación conocida. **Bloquea cualquier release afectado.**
- **S1 — Alto:** falla de un flujo central, riesgo material de seguridad/privacidad, pérdida de reservas, imposibilidad significativa de completar una tarea principal o inaccesibilidad grave. **Bloquea producción.**
- **S2 — Medio:** degradación con alternativa razonable, alcance limitado y sin impacto material de seguridad/datos. Puede aceptarse solo con mitigación, dueño y fecha, según aprobación.
- **S3 — Bajo:** problema cosmético o menor sin impacto sustancial en tareas, accesibilidad, seguridad o comprensión. Se registra y prioriza.

El equipo debe clasificar defectos por impacto real y no bajar severidad para cumplir una fecha. Toda vulnerabilidad de seguridad se evalúa además con el proceso de seguridad del proyecto.

## 4. Gates obligatorios de producción

### G1 — Producto y experiencia de usuario

**Criterios verificables:**

- Los journeys incluidos en el release están identificados, tienen responsable y criterios de aceptación antes del desarrollo.
- Los flujos críticos se prueban con usuarios representativos o con una evaluación de usabilidad aprobada; se registran tareas, problemas, severidad y decisiones.
- La persona usuaria puede entender precio total, disponibilidad, políticas, estado de reserva/pago y siguiente paso antes/después de confirmar.
- Cada flujo tiene estados diseñados y probados: carga, éxito, vacío, error, reintento, pérdida de red, sesión expirada y doble acción cuando aplique.
- UI Web y móvil respetan el sistema de diseño de Elevari; cualquier desviación se justifica y se revisa visualmente en tamaños/dispositivos acordados.
- No se utilizan marcas, recursos o diseños de referencia sin autorización; las referencias de Palantir, Apple y Airbnb se traducen en atributos evaluables: claridad, consistencia/pulido, confianza y facilidad de completar tareas.

**Evidencia:** criterios de aceptación; prototipo o especificación; informe de prueba de usabilidad; enlaces/capturas de QA visual; lista de defectos y resolución.

### G2 — Accesibilidad e inclusión

**Criterios verificables:**

- Los journeys críticos se revisan contra WCAG 2.2 AA como objetivo de conformidad Web y principios/plataformas de accesibilidad aplicables en iOS/Android.
- Pruebas manuales cubren navegación por teclado en Web, foco, lector de pantalla en clientes soportados, ampliación/tamaño de texto, contraste y movimiento reducido cuando corresponda.
- Controles, campos, errores y estados tienen etiquetas y mensajes comprensibles; no dependen solo de color o gesto.
- No hay defectos S0/S1 de accesibilidad abiertos en flujos críticos. Los hallazgos restantes tienen severidad y plan aprobados.

**Evidencia:** versión de checklist, combinación de navegador/dispositivo/tecnología de asistencia, resultados automáticos y manuales, incidencias y correcciones. Una herramienta automática por sí sola no certifica accesibilidad.

### G3 — Funcionalidad, datos y contratos

**Criterios verificables:**

- Pruebas unitarias, integración y E2E requeridas por el cambio terminan exitosamente en el commit candidato.
- Los recorridos críticos de navegación, autenticación, búsqueda, reserva, pago de prueba, confirmación y webhook aplicables pasan en staging.
- Web y móvil usan la API documentada; las reglas de negocio, permisos y estado financiero se validan en servidor.
- Reintentos, concurrencia, idempotencia y doble envío se prueban para operaciones que puedan crear reservas, pagos o facturas.
- Migraciones se prueban sobre una copia representativa; el cambio mantiene compatibilidad o tiene secuencia/rollback aprobado.
- No hay discrepancia conocida entre contrato publicado y comportamiento del backend sin decisión documentada.

**Evidencia:** URL del CI y commit, reportes de pruebas, contrato/versiones, resultados de migraciones y smoke tests con datos no productivos.

### G4 — Seguridad, privacidad y permisos

**Criterios no eximibles:**

- No hay secretos en el repositorio ni en bundles cliente; credenciales de producción se gestionan por el mecanismo aprobado y con acceso mínimo.
- Autenticación y autorización se verifican en servidor para todas las operaciones sensibles; no se confía en ocultar controles del cliente.
- Se prueban roles permitidos y denegados en endpoints/recursos afectados.
- No hay vulnerabilidades críticas/altas sin tratamiento aprobado en dependencias, imágenes y código dentro del alcance del release.
- TLS, firewall, puertos expuestos, CORS, cookies/tokens, webhooks y exposición de almacenamiento se revisan para el entorno real.
- Logs y telemetría no almacenan tokens, secretos ni datos personales innecesarios; existe justificación y retención para datos registrados.
- Se revisan políticas aplicables de privacidad, consentimiento y retención antes de publicar nuevas analíticas o notificaciones.

**Evidencia:** revisión de permisos, resultados de escaneo, lista de puertos, configuración de entorno sin mostrar valores secretos, pruebas negativas de autorización y revisión de privacidad.

### G5 — Rendimiento y confiabilidad

**Criterios verificables:**

- Se acuerdan SLO/umbrales para endpoints y journeys críticos antes de la aceptación; se basan en línea base, tráfico esperado, dispositivos/redes objetivo y necesidades del producto.
- Se registran resultados de rendimiento reproducibles para Web/API y, en móvil, arranque y operaciones centrales en dispositivos objetivo.
- Se verifican timeouts, errores, carga, límites, caché y degradación ante fallos de dependencias según el alcance.
- No hay regresión material de rendimiento contra la línea base sin aceptación documentada.
- Los checks de salud distinguen servicio vivo y capacidad de atender trabajo; se monitorean PostgreSQL, Redis, MinIO, API, Web y proxy según arquitectura vigente.

**Evidencia:** metodología, entorno, muestra, percentiles/errores, build y comparación con línea base. No se asignan umbrales universales en este documento; se deben aprobar antes de la prueba de release.

### G6 — Operación, backup y recuperación

**Criterios no eximibles para producción con datos persistentes:**

- Backup automatizado con frecuencia, retención, ubicación protegida, permisos y alertas documentados.
- Restauración ejecutada en entorno aislado para una copia reciente; se valida integridad y capacidad de iniciar servicios dependientes.
- RPO/RTO objetivo aprobado por negocio/operación y compatible con el procedimiento probado.
- Despliegue reproducible desde documentación, configuración de staging/prod comparada y migraciones controladas.
- Runbooks para despliegue, incidente, rollback, backup/restauración y escalamiento están disponibles a responsables.
- Se verifican logs, trazabilidad, métricas/alertas y responsable de guardia o respuesta; un endpoint público aislado no sustituye monitoreo de dependencias.

**Evidencia:** fecha/ID de backup, registro de restauración sin incluir secretos ni datos personales, versión, tiempos, checks post-restauración y enlace a runbooks.

### G7 — Compatibilidad y release Web/móvil

**Web:** navegadores y tamaños soportados definidos; pruebas responsive y visuales de journeys críticos; errores de hidratación/cliente y enlaces se revisan.

**Móvil:** builds firmados y verificables; pruebas en versiones/dispositivos objetivo de iOS y Android; login seguro, deep links, push con consentimiento, expiración de sesión y reanudación tras interrupción; requisitos de tienda y privacidad comprobados.

**Evidencia:** matriz de dispositivos/navegadores, builds identificados, reportes de pruebas y estado de publicación. Un release Web no implica aprobación móvil y viceversa.

### G8 — Soporte, analítica y preparación de negocio

- Canales de ayuda y procedimiento para incidencias/reembolsos del alcance están definidos.
- Eventos analíticos corresponden a objetivos aprobados y respetan consentimiento/privacidad.
- Mensajes de error y contenido crítico están revisados en idioma/mercado soportado.
- Equipos de soporte/operación conocen cambios, limitaciones, escalamiento y comunicaciones del release.

**Evidencia:** checklist de soporte, catálogo de eventos, revisión de contenido y responsable de comunicación.

## 5. Umbrales de producto y rendimiento

Los umbrales numéricos de conversión, latencia, disponibilidad, crash-free sessions, accesibilidad y satisfacción se establecen así:

1. Capturar línea base con entorno, población y periodo claramente identificados.
2. Definir junto con producto/operación objetivos y ventanas de medición antes del release.
3. Especificar método, muestra, herramienta, exclusiones y tolerancia a regresión.
4. Registrar aprobador y versión de los objetivos.
5. Cambiar umbrales solo mediante decisión documentada, nunca después de ver un resultado fallido para convertirlo retroactivamente en aprobado.

Los objetivos de accesibilidad y seguridad obligatorios no se reducen por un promedio de métricas comerciales.

## 6. Matriz de decisión GO / NO-GO

| Gate | Web | API/infraestructura | Móvil iOS/Android | Evidencia obligatoria | Bloquea GO si falta/falla |
|---|---|---|---|---|---|
| G1 Producto/UX | Sí | Según cambio | Sí | Criterios, QA visual, usabilidad | Sí en flujo crítico |
| G2 Accesibilidad | Sí | N/A según cambio | Sí | Evaluación manual y automática | Sí ante S0/S1 |
| G3 Funcional/datos | Sí | Sí | Sí | CI, contrato, integración/E2E | Sí |
| G4 Seguridad/privacidad | Sí | Sí | Sí | permisos, escaneo, configuración | Sí para hallazgo crítico/alto no aprobado |
| G5 Rendimiento/confiabilidad | Sí | Sí | Sí | resultados con método y umbrales | Sí ante SLO incumplido sin mitigación |
| G6 Operación/recuperación | Sí | Sí | N/A o aplicable | backup/restauración, runbooks | Sí para producción persistente |
| G7 Compatibilidad/release | Sí | Según cambio | Sí | matriz y artefactos | Sí para plataforma que se lanza |
| G8 Soporte/negocio | Sí | Según cambio | Sí | soporte, contenido, analítica | Sí cuando el servicio no pueda operarse con seguridad |

**Resultado:** todos los gates aplicables aprobados = candidato a GO sujeto a aprobación humana autorizada. Cualquier otro resultado = NO-GO o release limitado a entorno no productivo.

## 7. Registro obligatorio de decisión de release

Cada decisión debe guardar:

- Producto y componentes incluidos; entorno y mercados.
- Commit/tag/build exactos de Web, API, infraestructura y móvil.
- Fecha, responsables y tipo de release.
- Estado/evidencia de cada gate; criterios N/A justificados.
- Defectos abiertos por severidad y riesgos aceptados con fecha de vencimiento.
- Resultado de pruebas y ubicación de reportes.
- Resultado de backup/restauración y rollback cuando aplique.
- Decisión **GO** o **NO-GO**, motivación y aprobadores.
- Monitoreo posterior, ventana de observación y condición de rollback.

## 8. Roles y autoridad

Los responsables concretos deben nombrarse antes del primer release. Como mínimo, registrar aprobaciones de:

- **Producto:** alcance, journeys, riesgos de experiencia y métricas.
- **Diseño/UX:** sistema visual, usabilidad, accesibilidad y QA visual.
- **Ingeniería:** contratos, código, pruebas y compatibilidad.
- **Seguridad/privacidad:** controles, hallazgos y excepciones pertinentes.
- **Operación/Release:** infraestructura, backups, monitoreo, rollback y go/no-go operativo.

Una persona no debe aprobar por sí sola los controles que implementó cuando el riesgo requiera revisión independiente. Las excepciones tienen vencimiento y no pueden convertir silenciosamente NO-GO en GO.

## 9. Checklist de release

### Antes de staging
- [ ] Commit/build identificados y reproducibles.
- [ ] Contrato API y migraciones revisados.
- [ ] CI, pruebas requeridas y smoke tests completados.
- [ ] Flujos críticos probados; defectos clasificados.
- [ ] Revisión de accesibilidad y QA visual adjuntas.
- [ ] Secretos, permisos y configuración revisados.
- [ ] Rollback del entorno y migraciones definido.

### Antes de producción
- [ ] Gates G1–G8 aplicables aprobados o N/A justificados.
- [ ] Cero S0/S1 abiertos en componentes/journeys afectados.
- [ ] Restauración de backup reciente comprobada.
- [ ] Health checks, alertas, logs y responsables operativos confirmados.
- [ ] TLS, firewall, puertos y almacenamiento revisados en entorno objetivo.
- [ ] Soporte, comunicación y ventana de observación preparados.
- [ ] Decisión GO/NO-GO firmada por responsables autorizados.
- [ ] Condiciones de rollback y umbrales de activación acordados.

### Después del despliegue
- [ ] Smoke tests ejecutados contra producción sin operaciones destructivas.
- [ ] Errores, latencia y salud de dependencias observados en la ventana acordada.
- [ ] Sin regresiones críticas; si aparecen, ejecutar rollback según procedimiento.
- [ ] Resultado, incidencias y acciones de seguimiento registrados.

## 10. Aplicación inicial al estado conocido

Según la revisión documental disponible del repositorio:

- **No se asigna GO de producción.** La revisión fue documental y no prueba ejecución.
- La existencia de `backup-db.sh` no prueba restauración ni retención.
- Los archivos Compose revisados no muestran los mismos health checks para todos los servicios en staging y producción.
- La configuración de Nginx y la guía de Cloudflare requieren verificación en el entorno real para confirmar TLS y exposición de red.
- La descarga anónima configurada en el inicializador MinIO requiere confirmar alcance y clasificación de los objetos.
- La arquitectura Admin sigue en conflicto entre documentación de Supabase y API Fastify.
- Métricas numéricas de rendimiento y UX todavía requieren línea base y aprobación; no se inventan.

Estos puntos son preguntas/bloqueos a validar, no afirmaciones de vulnerabilidad explotable ni certificación de que los controles estén ausentes en otros componentes o en el proveedor de infraestructura.

## 11. Formato obligatorio antes de cualquier cambio que implemente este framework

- **OBJETIVO**
- **JUSTIFICACIÓN**
- **DOCUMENTOS CONSULTADOS**
- **ARCHIVOS AFECTADOS**
- **RIESGOS**
- **PLAN DE IMPLEMENTACIÓN**
- **PRUEBAS**
- **ROLLBACK**

## 12. Validación y rollback de este documento

**Realizado:** definición documental propuesta.  
**No realizado:** CI, pruebas de aplicación, pruebas de seguridad, pruebas UX con usuarios, despliegue o restauración de backup.  
**Rollback:** revertir el commit que añade este archivo; no hay cambios de código ni efecto operativo.
