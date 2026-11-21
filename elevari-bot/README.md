# elevari-bot

Bot Concierge IA de Elevari — Atención al cliente unificada para Web, App y WhatsApp Business.

## Stack
- **LLM:** Ollama (`llama3.1:8b`) self-hosted
- **Embeddings:** Ollama (`nomic-embed-text`)
- **Vector DB:** PGVector (PostgreSQL existente)
- **Backend:** Node.js + Fastify
- **Canales:** Web (Next.js), App (Expo), WhatsApp Business (Meta Cloud API)
- **Pagos:** Wompi (integración existente)
- **Facturación:** API de Elevari existente

## Estructura
```
elevari-bot/
├── src/
│   ├── bot/           # Ollama client, system prompt, RAG
│   ├── routes/        # Endpoints: /chat, /webhook/whatsapp, /health
│   ├── tools/         # Integración con API de Elevari (reservas, pagos, facturas, etc.)
│   ├── middleware/    # Auth, validación, idempotencia
│   └── config/        # Variables de entorno
├── tests/
├── prisma/            # Schema de base de datos
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

## Variables de entorno (.env)
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
DATABASE_URL=postgresql://...
WHATSAPP_TOKEN=tu_token_meta
WHATSAPP_PHONE_NUMBER_ID=tu_id
WHATSAPP_VERIFY_TOKEN=tu_verify_token
WOMPI_SECRET_KEY=tu_llave_privada_wompi
PORT=3001
```

## Instalación rápida
```bash
npm install
cp .env.example .env
# Editar .env con tus valores
npm run dev
```

## Ollama en el servidor
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

## Licencia
Private — Elevari