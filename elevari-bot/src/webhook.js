'use strict';

// Message types that carry media/attachments the bot cannot read: answered once with a short note.
const UNSUPPORTED_TYPES = new Set([
  'audio',
  'image',
  'video',
  'document',
  'sticker',
  'location',
  'contacts',
  'unsupported',
]);

const MAX_TEXT_LENGTH = 1000;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = (value) => (Array.isArray(value) ? value : []);
const asString = (value) => (typeof value === 'string' ? value : '');

// Meta sends wa_id values as digits only (country code + number).
const WA_ID = /^\d{5,20}$/;

function parseMessage(message) {
  if (!isObject(message)) return null;
  const from = asString(message.from);
  if (!WA_ID.test(from)) return null;

  const base = { id: asString(message.id) || undefined, from };
  const type = asString(message.type) || (isObject(message.text) ? 'text' : '');

  switch (type) {
    case 'text':
      return { ...base, type, kind: 'text', text: asString(message.text?.body).slice(0, MAX_TEXT_LENGTH) };
    case 'interactive': {
      // button_reply (reply buttons) and list_reply (list rows) both carry { id, title }
      const reply = message.interactive?.button_reply ?? message.interactive?.list_reply;
      if (!isObject(reply)) return { ...base, type, kind: 'ignore' };
      return { ...base, type, kind: 'text', text: asString(reply.title).slice(0, MAX_TEXT_LENGTH), buttonId: asString(reply.id) };
    }
    case 'button':
      // quick-reply button of a template message
      return {
        ...base,
        type,
        kind: 'text',
        text: asString(message.button?.text).slice(0, MAX_TEXT_LENGTH),
        buttonId: asString(message.button?.payload),
      };
    default:
      // reactions, system notices, orders... are not conversations: ignore silently
      return UNSUPPORTED_TYPES.has(type)
        ? { ...base, type, kind: 'unsupported' }
        : { ...base, type: 'other', kind: 'ignore' };
  }
}

// Walks entry[].changes[].value of a WhatsApp Cloud API webhook and returns the inbound
// messages in arrival order. Delivery/read `statuses` are ignored; malformed input yields [].
function parseWebhook(body) {
  const inbound = [];
  for (const entry of asArray(body?.entry)) {
    for (const change of asArray(entry?.changes)) {
      const value = change?.value;
      if (!isObject(value)) continue;

      const phoneNumberId = asString(value.metadata?.phone_number_id) || undefined;
      const profileNames = new Map();
      for (const contact of asArray(value.contacts)) {
        if (isObject(contact) && asString(contact.wa_id)) {
          profileNames.set(contact.wa_id, asString(contact.profile?.name));
        }
      }

      for (const message of asArray(value.messages)) {
        const parsed = parseMessage(message);
        if (parsed) inbound.push({ ...parsed, phoneNumberId, profileName: profileNames.get(parsed.from) });
      }
    }
  }
  return inbound;
}

module.exports = { parseWebhook, parseMessage, UNSUPPORTED_TYPES };
