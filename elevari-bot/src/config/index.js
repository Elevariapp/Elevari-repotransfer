const config = {
  whatsapp: {
    phoneNumber: '+57 3232688534',
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    webhookEndpoint: '/webhook/whatsapp',
    chatEndpoint: '/chat',
  },
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
  },
};

module.exports = config;