# Formulario "Seguridad de los datos" (Data safety) — Elevari Android

Respuestas para Play Console → Contenido de la app → Seguridad de los datos. Reflejan lo que la app hace **en esta versión**. Si se activan notificaciones push o la carga de fotos para anfitriones, hay que actualizar el formulario.

## Preguntas generales
| Pregunta | Respuesta |
|---|---|
| ¿Recopila o comparte tipos de datos del usuario? | Sí |
| ¿Todos los datos se cifran en tránsito? | Sí (HTTPS/TLS; Cloudflare) |
| ¿Ofrece una forma de solicitar la eliminación de datos? | Sí — `https://elevari.live/legal/account-deletion` |
| ¿Sigue las Políticas de familias? | No (público 18+) |
| ¿Datos vendidos? | No |

## Datos recopilados
| Categoría → tipo | Recopilado | Compartido | Obligatorio | Finalidad |
|---|---|---|---|---|
| Información personal → **Nombre** | Sí | No | Sí | Funcionalidad de la app, administración de la cuenta |
| Información personal → **Dirección de correo** | Sí | No | Sí | Funcionalidad de la app, administración de la cuenta, comunicaciones |
| Información financiera → **Historial de compras** (reservas y estado de pago) | Sí | No | Sí | Funcionalidad de la app |
| Actividad en la app → **Interacciones con la app** | Sí | No | No | Análisis (Firebase Analytics) |
| Identificadores de dispositivo u otros → **ID de dispositivo o de otro tipo** (ID de instancia de Firebase) | Sí | No | No | Análisis |

## Datos que NO se recopilan
- Ubicación (aproximada o precisa): la app no solicita permisos de ubicación.
- Datos de tarjeta o información de pago: el pago ocurre en la página alojada de Wompi; Elevari no los recibe ni los almacena.
- Contactos, mensajes, fotos y videos, audio, archivos, calendario, salud y estado físico, navegación web.
- Registros de fallos y diagnóstico (no se usa Crashlytics).

## Notas para la revisión
- "Compartido = No" porque los terceros (Wompi para el pago, Resend para el correo transaccional, Google/Firebase para analítica) actúan como **proveedores de servicio** en nombre de Elevari. Si en el futuro se usan para fines propios, cambiar a Sí.
- Permisos de Android declarados: solo `INTERNET` y `VIBRATE`. Se bloquean explícitamente `RECORD_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE` y `SYSTEM_ALERT_WINDOW`.
