const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/index');

const app = express();
const PORT = config.server.port;
const HOST = config.server.host;

const { whatsapp } = config;

app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(bodyParser.urlencoded({ extended: true }));

// GET /webhook/whatsapp — Meta Cloud API webhook verification
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === whatsapp.verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }
  res.status(400).send('Bad Request');
});

// POST /webhook/whatsapp — Meta Cloud API incoming messages
app.post('/webhook/whatsapp', (req, res) => {
  res.status(200).send('EVENT_RECEIVED');

  const entry = req.body?.entry ?? [];
  for (const e of entry) {
    const changes = e.changes ?? [];
    for (const change of changes) {
      const value = change.value ?? {};
      const messages = value.messages ?? [];
      for (const message of messages) {
        const from = message.from;
        const text = message.text?.body ?? '';
        console.log(`WhatsApp message from ${from}: ${text}`);
        // TODO: Integrate AI concierge response logic here
      }
    }
  }
});

// POST /chat — Chat endpoint for AI concierge
app.post('/chat', async (req, res) => {
  try {
    const { message, phoneNumber } = req.body;
    if (!message || !phoneNumber) {
      return res.status(400).json({ error: 'message and phoneNumber are required' });
    }

    // Forward to WhatsApp Business via Meta Cloud API (placeholder)
    const whatsappUrl = `https://graph.facebook.com/v18.0/${whatsapp.phoneNumberId}/messages`;
    console.log(`Would send to ${phoneNumber}: ${message}`);

    res.status(200).json({ status: 'queued', to: phoneNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Elevari WhatsApp Bot listening on ${HOST}:${PORT}`);
  console.log(`WhatsApp number: ${whatsapp.phoneNumber}`);
  console.log(`Webhook: http://${HOST}:${PORT}${whatsapp.webhookEndpoint}`);
  console.log(`Chat: http://${HOST}:${PORT}${whatsapp.chatEndpoint}`);
});

module.exports = app;