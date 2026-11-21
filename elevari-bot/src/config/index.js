export const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  },

  wompi: {
    secretKey: process.env.WOMPI_SECRET_KEY,
    integrationKey: process.env.WOMPI_INTEGRATION_KEY,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
  },
};