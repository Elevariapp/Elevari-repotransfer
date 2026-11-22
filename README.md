# wana-2026 / Waná 2026

Wana hospitality repo for connecting with VS Code and Nestlify / Repositorio de hospitalidad Wana para conectar con VS Code y Nestlify

## 📖 Descripción / Description

**Español:** Repositorio del backend de Waná, una plataforma de hospitalidad para gestión de reservas de propiedades (glamping, hoteles, casas vacacionales). Incluye disponibilidad, reservas, pagos, facturación (Alegra), sincronización de calendarios OTA (Airbnb/Booking.com) y envío de recordatorios de check-in.

**English:** Backend repository for Waná, a hospitality platform for managing property reservations (glamping, hotels, vacation rentals). Includes availability, bookings, payments, invoicing (Alegra), OTA calendar sync (Airbnb/Booking.com), and check-in reminder emails.

## 🚀 Inicio rápido / Quick Start

### Prerrequisitos / Prerequisites

- Node.js 22+
- PostgreSQL
- Redis
- MinIO (S3-compatible storage)

### Instalación / Installation

```bash
# Clonar el repositorio / Clone the repository
git clone https://github.com/Elevariapp/Elevari-repotransfer.git
cd Elevari-repotransfer

# Instalar dependencias del API / Install API dependencies
cd api
npm install

# Copiar variables de entorno / Copy environment variables
cp .env.example .env
# Editar .env con tus valores locales / Edit .env with your local values
```

### Ejecutar en desarrollo / Run in Development

```bash
cd api
npm run dev
```

La API escuchará en `http://localhost:4000` / The API will listen on `http://localhost:4000`

## 🧪 Verificación del Backend / Backend Testing

**Español:** Para validar el flujo completo de reserva (disponibilidad + inserción + pago):

1. Asegúrate de tener `TEST_USER_ID` definido en tu `.env.local`.
2. Ejecuta el siguiente comando:
   ```bash
   npx ts-node --compiler-options '{"allowImportingTsExtensions": true}' scripts/test-booking-flow.ts
   ```

**English:** To validate the full booking flow (availability + insertion + payment):

1. Make sure `TEST_USER_ID` is defined in your `.env.local`.
2. Run the following command:
   ```bash
   npx ts-node --compiler-options '{"allowImportingTsExtensions": true}' scripts/test-booking-flow.ts
   ```

## 🔧 Variables de entorno / Environment Variables

| Variable | Descripción / Description | Default |
|----------|--------------------------|---------|
| `NODE_ENV` | Entorno de ejecución / Execution environment | `development` |
| `PORT` | Puerto del servidor / Server port | `4000` |
| `HOST` | Host del servidor / Server host | `0.0.0.0` |
| `DATABASE_URL` | URL de conexión a PostgreSQL / PostgreSQL connection URL | - |
| `REDIS_URL` | URL de conexión a Redis / Redis connection URL | - |
| `JWT_SECRET` | Secreto para firmar JWT / JWT signing secret | - |
| `CORS_ORIGIN` | Origen permitido para CORS / Allowed CORS origin | `http://localhost:3000` |
| `PAYMENTS_MODE` | Modo de pagos (mock para desarrollo) / Payments mode (mock for dev) | `mock` |
| `PLATFORM_FEE_PERCENT` | Comisión de la plataforma / Platform fee percent | `15` |

Consulta `.env.example` para la lista completa / See `.env.example` for the full list.

## 📡 Endpoints de la API / API Endpoints

Todos los endpoints están bajo el prefijo `/api/v1` / All endpoints are under the `/api/v1` prefix:

- `GET /health` — Health check / Verificación de salud
- `POST /api/v1/properties` — Crear propiedad / Create property
- `GET /api/v1/properties` — Listar propiedades / List properties
- `POST /api/v1/bookings` — Crear reserva / Create booking
- `POST /api/v1/payments` — Procesar pago / Process payment
- `POST /api/v1/webhooks` — Webhooks de pagos / Payment webhooks

## 🗄️ Modelo de datos / Data Model

Modelos principales en `api/prisma/schema.prisma`:

- `User` — Usuario (guest, host, admin) / User (guest, host, admin)
- `Property` — Propiedad en alquiler / Rental property
- `Booking` — Reserva / Booking
- `Payment` — Pago / Payment
- `Review` — Reseña / Review
- `AvailabilityBlock` — Bloque de disponibilidad / Availability block

## 🛠️ Scripts disponibles / Available Scripts

| Script | Descripción / Description |
|--------|--------------------------|
| `npm run dev` | Ejecutar en modo desarrollo con watch / Run in dev mode with watch |
| `npm run build` | Compilar TypeScript / Compile TypeScript |
| `npm start` | Ejecutar en producción / Run in production |
| `prisma:generate` | Generar cliente Prisma / Generate Prisma client |
| `prisma:migrate` | Ejecutar migraciones de base de datos / Run database migrations |
| `db:seed` | Sembrar datos iniciales / Seed initial data |

## 🤝 Contribución / Contributing

1. Haz fork del repositorio / Fork the repository
2. Crea una rama para tu feature / Create a branch for your feature
3. Commit tus cambios / Commit your changes
4. Abre un Pull Request / Open a Pull Request

## 📄 Licencia / License

Private / Privado
