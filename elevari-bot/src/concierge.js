'use strict';

// Pure, side-effect-free conversation logic for the WhatsApp concierge.
//   route({ text, buttonId, type, now, state, name, siteUrl }) -> { replies, state, intent }
// `replies` holds at most ONE reply (the bot only ever answers an inbound message) and `state`
// is the new per-sender state (the input is never mutated). Persisting the state is the caller's job.

const DEFAULT_SITE_URL = 'https://elevari.live';
const SUPPORT_EMAIL = 'reserve@elevari.live';

const HANDOFF_MS = 12 * 60 * 60 * 1000;
const FALLBACK_COOLDOWN_MS = 5 * 60 * 1000;
const UNSUPPORTED_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_TEXT_LENGTH = 1000;

const OPTIONS = [
  { n: 1, key: 'explore', id: 'opt_explore', title: { es: 'Explorar y reservar', en: 'Explore & book' } },
  { n: 2, key: 'booking', id: 'opt_booking', title: { es: 'Mi reserva', en: 'My booking' } },
  { n: 3, key: 'payments', id: 'opt_payments', title: { es: 'Pagos y reembolsos', en: 'Payments & refunds' } },
  { n: 4, key: 'host', id: 'opt_host', title: { es: 'Ser anfitrión', en: 'Become a host' } },
  { n: 5, key: 'human', id: 'opt_human', title: { es: 'Hablar con una persona', en: 'Talk to a person' } },
];
const HUMAN = OPTIONS[4];

const COPY = {
  es: {
    hello: '¡Hola! 👋 Soy el asistente virtual de Elevari.',
    helloNamed: (name) => `¡Hola, ${name}! 👋 Soy el asistente virtual de Elevari.`,
    ask: '¿En qué te ayudo? Elige una opción:',
    menuButton: 'Ver opciones',
    sectionTitle: 'Opciones',
    footer: 'Escribe STOP para no recibir más mensajes',
    numberedHint: 'Responde con el número o el nombre de la opción.',
    moreHint: 'Escribe *menu* para ver más opciones.',
    explore: (site) => `Explora nuestras propiedades y reserva en línea:\n${site}/properties`,
    booking: (site) => `Mira tus reservas, termina un pago pendiente o cancela desde tu cuenta:\n${site}/account`,
    payments: (site) => `Pagos, reembolsos y política de cancelación (todo en esta página):\n${site}/legal/refund`,
    host: (site) => `Publica tu propiedad y empieza a recibir huéspedes:\n${site}/host`,
    handoff: (email) =>
      `Listo, una persona del equipo te responderá en horario de atención. También puedes escribirnos a ${email}.\n\nMientras tanto no te enviaré más mensajes automáticos. Escribe *menu* si quieres volver al menú.`,
    optOut: 'Listo, no te enviaremos más mensajes. Si quieres volver a hablar con nosotros, escribe *menu*.',
    fallback:
      'No estoy seguro de haberte entendido. Escribe *menu* para ver las opciones o *humano* para hablar con una persona.',
    unsupported: 'Por ahora solo puedo leer mensajes de texto. Escribe *menu* para ver las opciones.',
  },
  en: {
    hello: "Hi! 👋 I'm Elevari's virtual assistant.",
    helloNamed: (name) => `Hi, ${name}! 👋 I'm Elevari's virtual assistant.`,
    ask: 'How can I help? Pick an option:',
    menuButton: 'See options',
    sectionTitle: 'Options',
    footer: 'Send STOP to opt out of messages',
    numberedHint: 'Reply with the number or the name of the option.',
    moreHint: 'Send *menu* for more options.',
    explore: (site) => `Explore our properties and book online:\n${site}/properties`,
    booking: (site) => `See your bookings, finish a pending payment or cancel from your account:\n${site}/account`,
    payments: (site) => `Payments, refunds and cancellation policy (it's all on this page):\n${site}/legal/refund`,
    host: (site) => `List your property and start welcoming guests:\n${site}/host`,
    handoff: (email) =>
      `Got it, a person from our team will reply during business hours. You can also email us at ${email}.\n\nI won't send any more automated messages meanwhile. Send *menu* to come back to the menu.`,
    optOut: "Done, we won't message you again. If you change your mind, send *menu* anytime.",
    fallback: "I'm not sure I understood. Send *menu* to see the options or *human* to talk to a person.",
    unsupported: 'I can only read text messages for now. Send *menu* to see the options.',
  },
};

// All keyword sets below hold normalized tokens (lowercase, no accents or punctuation).
const ES_WORDS = new Set([
  'hola', 'ola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'quiero', 'necesito', 'quisiera', 'puedo',
  'reserva', 'reservas', 'reservar', 'mi', 'mis', 'cuenta', 'pago', 'pagos', 'pagar', 'reembolso', 'reembolsos',
  'ayuda', 'gracias', 'favor', 'cabana', 'cabanas', 'propiedad', 'propiedades', 'anfitrion', 'anfitriona', 'humano',
  'persona', 'asesor', 'hablar', 'explorar', 'ser', 'baja', 'parar', 'cancelar', 'cancelacion', 'como', 'donde',
  'cuando', 'cuanto', 'con', 'una', 'un', 'el', 'los', 'las', 'por', 'para', 'que', 'precio', 'precios', 'inicio',
  'mas', 'mensajes', 'mensaje', 'tienen', 'hay', 'tengo', 'de', 'en', 'la', 'y', 'es', 'tu', 'su',
]);
const EN_WORDS = new Set([
  'hi', 'hello', 'hey', 'help', 'booking', 'bookings', 'book', 'my', 'payment', 'payments', 'refund', 'refunds',
  'host', 'human', 'agent', 'person', 'talk', 'speak', 'please', 'thanks', 'thank', 'cancel', 'cancellation', 'how',
  'where', 'when', 'what', 'want', 'need', 'explore', 'become', 'the', 'to', 'you', 'is', 'are', 'with', 'and', 'i',
  'can', 'could', 'would', 'like', 'about', 'your', 'account', 'reservation', 'reserve', 'price', 'prices',
  'available', 'availability', 'properties', 'property', 'unsubscribe', 'morning', 'afternoon', 'evening', 'start',
  'more', 'messages', 'message', 'have', 'do', 'does', 'it', 'of', 'in', 'for', 'on', 'this', 'there', 'any',
]);

const SALUTATIONS = new Set([
  'hola', 'ola', 'hi', 'hello', 'hey', 'buenas', 'buenos', 'morning', 'afternoon', 'evening', 'start', 'inicio',
  'empezar', 'comenzar',
]);
const MENU_WORDS = new Set(['menu', 'ayuda', 'help', 'opciones', 'options']);
const THANKS = new Set(['gracias', 'thanks', 'thank', 'thx', 'grax']);
const ACKNOWLEDGEMENTS = new Set([
  'ok', 'okay', 'vale', 'listo', 'perfecto', 'genial', 'excelente', 'super', 'dale', 'entendido', 'bien', 'bye',
  'chao', 'adios', 'si', 'yes', 'no', 'nada',
]);
// Only these exact messages bring an opted-out sender back (a stray "hi" must not re-subscribe).
const RESUBSCRIBE = new Set(['menu', 'hola', 'start', 'inicio']);

const OPT_OUT_EXACT = new Set(['stop', 'baja', 'parar', 'unsubscribe', 'baja por favor']);
const OPT_OUT_PHRASES = [
  'cancelar suscripcion', 'cancelar la suscripcion', 'cancelar mi suscripcion', 'cancel subscription',
  'cancel my subscription', 'darme de baja', 'no mas mensajes', 'no more messages', 'no quiero mas mensajes',
  'no quiero recibir mensajes', 'no me escribas', 'no me escriban', 'para de escribirme', 'deja de escribirme',
  'dejen de escribirme', 'stop messaging', 'stop texting', 'stop sending', 'stop contacting',
];

const HANDOFF_WORDS = new Set([
  'humano', 'humana', 'asesor', 'asesora', 'agente', 'agent', 'human', 'representante', 'representative',
]);
// "persona"/"person" is also how guests are counted ("para una persona"), so it only means
// "let me talk to someone" when it is the whole message or comes with a speaking cue.
const PERSON_WORDS = new Set(['persona', 'person']);
const PERSON_CUES = new Set([
  'hablar', 'habla', 'hablo', 'comunicar', 'comunicarme', 'contactar', 'atienda', 'atiende', 'atencion', 'pasar',
  'pasame', 'conectar', 'conectame', 'real', 'viva', 'talk', 'speak', 'chat', 'connect', 'live',
]);

// Checked in order. Cancelling a booking happens on the account page, so "cancelar reserva" lands on
// "Mi reserva"; questions about the policy, refunds and payments land on the refund page.
const TOPIC_RULES = [
  {
    key: 'booking',
    phrases: [
      'mi reserva', 'mis reservas', 'mi cuenta', 'cancelar reserva', 'cancelar la reserva', 'my booking',
      'my bookings', 'my reservation', 'my reservations', 'my account', 'cancel booking', 'cancel reservation',
      'cancel the booking',
    ],
  },
  {
    key: 'payments',
    words: [
      'politica', 'policy', 'pago', 'pagos', 'pagar', 'payment', 'payments', 'pay', 'reembolso', 'reembolsos',
      'refund', 'refunds', 'devolucion', 'cancelacion', 'cancelaciones', 'cancellation', 'factura', 'facturas',
      'invoice', 'invoices',
    ],
  },
  { key: 'booking', words: ['cancelar', 'cancelo', 'cancel'] },
  { key: 'host', words: ['anfitrion', 'anfitriona', 'anfitriones', 'host', 'hosts', 'hosting'] },
  {
    key: 'explore',
    words: [
      'reservar', 'reserva', 'reservas', 'reserve', 'reservation', 'reservations', 'book', 'booking', 'bookings',
      'explorar', 'explore', 'propiedad', 'propiedades', 'property', 'properties', 'glamping', 'cabana', 'cabanas',
      'alojamiento', 'alojamientos', 'disponibilidad', 'availability', 'precio', 'precios', 'price', 'prices',
      'tarifa', 'tarifas',
    ],
  },
];

function normalize(input) {
  return String(input ?? '')
    .slice(0, MAX_TEXT_LENGTH)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const OPTION_BY_ID = new Map(OPTIONS.map((option) => [option.id, option]));
const OPTION_BY_TITLE = new Map(
  OPTIONS.flatMap((option) => Object.values(option.title).map((title) => [normalize(title), option])),
);
const OPTION_NUMBER = /^(?:opcion |option |numero |number )?([1-5])$/;

const hasPhrase = (norm, phrase) => ` ${norm} `.includes(` ${phrase} `);
const hasAny = (tokens, words) => tokens.some((token) => words.has(token));

// Returns 'es' | 'en' | null (null = no signal, keep the sender's previous language).
function detectLanguage(tokens) {
  let es = 0;
  let en = 0;
  for (const token of tokens) {
    if (ES_WORDS.has(token)) es += 1;
    if (EN_WORDS.has(token)) en += 1;
  }
  if (en > es) return 'en';
  if (es > en) return 'es';
  return null;
}

function isOptOut(norm, tokens) {
  if (OPT_OUT_EXACT.has(norm)) return true;
  if (OPT_OUT_PHRASES.some((phrase) => hasPhrase(norm, phrase))) return true;
  if (tokens.includes('unsubscribe')) return true;
  // "stop" / "parar" inside a longer sentence ("bus stop near the cabin") is not an opt-out
  return (tokens.length <= 3 && tokens.includes('stop')) || (tokens.length <= 2 && tokens.includes('parar'));
}

function isHandoffRequest(tokens) {
  if (hasAny(tokens, HANDOFF_WORDS)) return true;
  if (!hasAny(tokens, PERSON_WORDS)) return false;
  const bare = tokens.length <= 2 && !tokens.some((token) => /^\d+$/.test(token));
  return bare || hasAny(tokens, PERSON_CUES);
}

function optionFromText(norm) {
  const digit = OPTION_NUMBER.exec(norm);
  if (digit) return OPTIONS[Number(digit[1]) - 1];
  return OPTION_BY_TITLE.get(norm) ?? null;
}

function topicFromText(norm, tokens) {
  for (const rule of TOPIC_RULES) {
    const matched =
      rule.phrases?.some((phrase) => hasPhrase(norm, phrase)) || (rule.words && rule.words.some((word) => tokens.includes(word)));
    if (matched) return OPTIONS.find((option) => option.key === rule.key);
  }
  return null;
}

// First word of the WhatsApp profile name, letters only: it is user-controlled text and must
// not be able to inject links or WhatsApp formatting (*bold*, _italic_) into our message.
function firstName(profileName) {
  const match = /\p{L}[\p{L}\p{M}'’-]{0,29}/u.exec(typeof profileName === 'string' ? profileName : '');
  return match ? match[0] : undefined;
}

function normalizeState(state) {
  const source = state && typeof state === 'object' ? state : {};
  return {
    lang: source.lang === 'en' ? 'en' : 'es',
    optedOut: source.optedOut === true,
    handoffUntil: Number.isFinite(source.handoffUntil) ? source.handoffUntil : 0,
    lastFallbackAt: Number.isFinite(source.lastFallbackAt) ? source.lastFallbackAt : null,
    lastUnsupportedAt: Number.isFinite(source.lastUnsupportedAt) ? source.lastUnsupportedAt : null,
  };
}

const textReply = (body) => ({ type: 'text', body });

// Interactive list; `fallbackText` is a numbered text menu the sender can use if WhatsApp rejects the list.
function welcomeReply(lang, name) {
  const copy = COPY[lang];
  const greeting = name ? copy.helloNamed(name) : copy.hello;
  const numbered = OPTIONS.map((option) => `${option.n}. ${option.title[lang]}`).join('\n');
  return {
    type: 'list',
    body: `${greeting}\n${copy.ask}`,
    footer: copy.footer,
    button: copy.menuButton,
    sectionTitle: copy.sectionTitle,
    rows: OPTIONS.map((option) => ({ id: option.id, title: option.title[lang] })),
    fallbackText: `${greeting}\n${copy.ask}\n\n${numbered}\n\n${copy.numberedHint}`,
  };
}

function route({ text, buttonId, type = 'text', now = Date.now(), state, name, siteUrl = DEFAULT_SITE_URL } = {}) {
  const previous = normalizeState(state);
  const norm = normalize(text);
  const tokens = norm ? norm.split(' ') : [];
  const lang = detectLanguage(tokens) ?? previous.lang;
  const current = { ...previous, lang };
  const copy = COPY[lang];
  const site = String(siteUrl).replace(/\/+$/, '');
  const handoffActive = current.handoffUntil > now;

  const respond = (intent, message, patch = {}) => ({
    intent,
    replies: message ? [message] : [],
    state: { ...current, ...patch },
  });
  const welcome = (intent, patch) => respond(intent, welcomeReply(lang, firstName(name)), patch);
  const optOut = () => respond('opt_out', textReply(copy.optOut), { optedOut: true, handoffUntil: 0 });

  if (type === 'unsupported') {
    if (current.optedOut) return respond('silent_opted_out');
    if (handoffActive) return respond('silent_handoff');
    if (current.lastUnsupportedAt !== null && now - current.lastUnsupportedAt < UNSUPPORTED_COOLDOWN_MS) {
      return respond('unsupported_throttled');
    }
    return respond('unsupported', textReply(copy.unsupported), { lastUnsupportedAt: now });
  }

  const id = typeof buttonId === 'string' ? buttonId.trim() : '';
  // Emoji-only messages ("👍") get no answer; text in other scripts still gets the fallback.
  if (!norm && !id && !/\p{L}/u.test(String(text ?? ''))) return respond('ignored');

  const wantsOptOut = isOptOut(norm, tokens);

  if (current.optedOut) {
    if (RESUBSCRIBE.has(norm)) return welcome('opt_in', { optedOut: false, handoffUntil: 0 });
    return respond('silent_opted_out');
  }

  if (handoffActive) {
    if (wantsOptOut) return optOut();
    if (norm === 'menu') return welcome('welcome', { handoffUntil: 0 });
    return respond('silent_handoff');
  }

  if (wantsOptOut) return optOut();

  const option =
    OPTION_BY_ID.get(id) ?? optionFromText(norm) ?? (isHandoffRequest(tokens) ? HUMAN : null) ?? topicFromText(norm, tokens);

  if (option === HUMAN) {
    return respond('handoff', textReply(copy.handoff(SUPPORT_EMAIL)), { handoffUntil: now + HANDOFF_MS });
  }
  if (option) {
    return respond(`option_${option.key}`, textReply(`${copy[option.key](site)}\n\n${copy.moreHint}`));
  }

  // Thanks and one-word acknowledgements are conversation closers, not questions
  if (hasAny(tokens, THANKS) && !hasAny(tokens, SALUTATIONS) && !tokens.includes('menu')) return respond('ack');
  if (hasAny(tokens, SALUTATIONS) || hasAny(tokens, MENU_WORDS)) return welcome('welcome');
  if (tokens.length > 0 && tokens.length <= 2 && tokens.every((token) => ACKNOWLEDGEMENTS.has(token))) {
    return respond('ack');
  }

  if (current.lastFallbackAt !== null && now - current.lastFallbackAt < FALLBACK_COOLDOWN_MS) {
    return respond('fallback_throttled');
  }
  return respond('fallback', textReply(copy.fallback), { lastFallbackAt: now });
}

module.exports = {
  route,
  normalize,
  detectLanguage,
  OPTIONS,
  HANDOFF_MS,
  FALLBACK_COOLDOWN_MS,
  UNSUPPORTED_COOLDOWN_MS,
  DEFAULT_SITE_URL,
  SUPPORT_EMAIL,
};
