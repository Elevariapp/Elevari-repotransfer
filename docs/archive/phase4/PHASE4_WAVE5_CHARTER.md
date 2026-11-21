> HISTÓRICO — no canónico. Ver ARCHITECTURE.md / docs/HANDOVER.md

# PHASE 4 · WAVE 5 - Revenue & Occupancy Optimization

## Charter Técnico

**Objetivo:** Construir Revenue Analytics, Occupancy Analytics, Attribution, Property Performance, Executive Dashboard e insights comerciales auditable, y certificar Wave 5.

**Fecha de inicio:** 14/11/2026
**Estado:** En progreso

---

## Workstreams REV-1 a REV-6

### REV-1: Revenue Analytics Engine
**Objetivo:** Calcular métricas de ingresos trazables desde Booking/Payment/PaymentRefund

**Acceptance Criteria:**
- [ ] Cálculo de Gross Revenue por propiedad, host, período
- [ ] Cálculo de Net Revenue (descontando refunds)
- [ ] Cálculo de Revenue per Available Room (RevPAR)
- [ ] Cálculo de Average Daily Rate (ADR)
- [ ] Trazabilidad completa: cada métrica debe poder auditarse a bookings y payments específicos
- [ ] API endpoint `/api/analytics/revenue` con filtros por fecha, propiedad, host

**Métricas:**
- Gross Revenue: SUM(payment.amount) WHERE status = 'succeeded'
- Net Revenue: Gross Revenue - SUM(refunds.amount)
- RevPAR: Net Revenue / (días disponibles * propiedades)
- ADR: Net Revenue / noches vendidas

### REV-2: Occupancy Analytics Engine
**Objetivo:** Calcular métricas de ocupación desde Booking/AvailabilityBlock

**Acceptance Criteria:**
- [ ] Cálculo de Occupancy Rate por propiedad y período
- [ ] Cálculo de Nights Booked vs Nights Available
- [ ] Identificación de gaps de disponibilidad
- [ ] API endpoint `/api/analytics/occupancy` con filtros por fecha, propiedad, host

**Métricas:**
- Occupancy Rate: noches ocupadas / noches disponibles
- Nights Booked: COUNT de noches en bookings confirmados
- Nights Available: días en rango - días bloqueados

### REV-3: Attribution Engine
**Objetivo:** Atribuir ingresos a fuentes de tráfico y canales

**Acceptance Criteria:**
- [ ] Tracking de UTM parameters en bookings
- [ ] Atribución de revenue por canal (orgánico, paid, referral, direct)
- [ ] Atribución de bookings por fuente
- [ ] API endpoint `/api/analytics/attribution`

**Métricas:**
- Revenue by Channel
- Bookings by Channel
- Conversion Rate by Channel

### REV-4: Property Performance Score
**Objetivo:** Score compuesto de performance por propiedad

**Acceptance Criteria:**
- [ ] Score basado en: ocupación, revenue, reviews, tiempo de respuesta
- [ ] Normalización de métricas a escala 0-100
- [ ] Ranking de propiedades por host
- [ ] API endpoint `/api/analytics/property-performance`

**Fórmula:**
```
Performance Score = 
  0.35 * Occupancy Rate (normalizado) +
  0.35 * RevPAR (normalizado) +
  0.20 * Review Score (normalizado) +
  0.10 * Response Time (normalizado)
```

### REV-5: Executive Dashboard
**Objetivo:** Dashboard ejecutivo en /host y /admin con métricas trazables

**Acceptance Criteria:**
- [ ] Dashboard en `/host/analytics` con métricas del host
- [ ] Dashboard en `/admin/analytics` con métricas globales
- [ ] Métricas trazables y reproducibles
- [ ] Export a CSV
- [ ] Filtros por fecha, propiedad
- [ ] Gráficos de tendencia

### REV-6: Revenue Insights Engine
**Objetivo:** Insights automáticos y recomendaciones comerciales

**Acceptance Criteria:**
- [ ] Detección de propiedades underperforming
- [ ] Recomendaciones de pricing
- [ ] Alertas de ocupación baja
- [ ] Insights de temporada
- [ ] API endpoint `/api/analytics/insights`

---

## Arquitectura

### Capas
1. **Data Layer:** Prisma queries con trazabilidad
2. **Engine Layer:** Cálculos puros y testeables
3. **API Layer:** Endpoints REST con autenticación
4. **Presentation Layer:** Dashboards React

### Principios
- **Trazabilidad:** Cada métrica debe poder auditarse a registros fuente
- **Reproducibilidad:** Mismos inputs = mismos outputs
- **Auditabilidad:** Logs de cálculos y cambios
- **Performance:** Caching de métricas agregadas

---

## Dependencias
- Prisma schema existente (Booking, Payment, PaymentRefund, AvailabilityBlock, Property)
- API routes existentes
- Autenticación existente

## Riesgos
- Datos históricos incompletos
- Performance con grandes volúmenes
- Complejidad de cálculos de ocupación con múltiples fuentes

## Métricas de Éxito
- 100% de métricas trazables a registros fuente
- Tests de certificación pasando
- Dashboard cargando < 2s
- Centinela controls pasando
