'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { route, HANDOFF_MS, FALLBACK_COOLDOWN_MS, UNSUPPORTED_COOLDOWN_MS } = require('../src/concierge');

const SITE = 'https://example.test';
const NOW = Date.parse('2025-01-15T15:00:00Z');
const MINUTE = 60 * 1000;

const ask = (text, extra = {}) => route({ text, now: NOW, siteUrl: SITE, ...extra });
const at = (now, text, state, extra = {}) => route({ text, now, state, siteUrl: SITE, ...extra });
const body = (result) => result.replies[0]?.body ?? '';

const TITLES = {
  es: ['Explorar y reservar', 'Mi reserva', 'Pagos y reembolsos', 'Ser anfitrión', 'Hablar con una persona'],
  en: ['Explore & book', 'My booking', 'Payments & refunds', 'Become a host', 'Talk to a person'],
};
const ROW_IDS = ['opt_explore', 'opt_booking', 'opt_payments', 'opt_host', 'opt_human'];

describe('welcome menu', () => {
  const greetings = [
    ['hola', 'es'],
    ['Hola!!', 'es'],
    ['buenas tardes', 'es'],
    ['menu', 'es'],
    ['MENÚ', 'es'],
    ['ayuda', 'es'],
    ['hi', 'en'],
    ['Hello there', 'en'],
    ['help', 'en'],
  ];

  for (const [text, lang] of greetings) {
    test(`${JSON.stringify(text)} gets the ${lang} interactive list`, () => {
      const result = ask(text);
      assert.equal(result.intent, 'welcome');
      assert.equal(result.replies.length, 1);
      assert.equal(result.state.lang, lang);

      const [reply] = result.replies;
      assert.equal(reply.type, 'list');
      assert.deepEqual(reply.rows.map((row) => row.id), ROW_IDS);
      assert.deepEqual(reply.rows.map((row) => row.title), TITLES[lang]);
    });
  }

  test('the plain-text fallback menu numbers the same five options', () => {
    const { fallbackText } = ask('hola').replies[0];
    TITLES.es.forEach((title, index) => assert.ok(fallbackText.includes(`${index + 1}. ${title}`), title));
  });

  test('fits WhatsApp interactive list limits in both languages, even with a very long profile name', () => {
    for (const text of ['hola', 'hello']) {
      const [reply] = ask(text, { name: `${'A'.repeat(100)} B` }).replies;
      assert.ok(reply.body.length <= 1024);
      assert.ok(reply.footer.length <= 60);
      assert.ok(reply.button.length <= 20);
      assert.ok(reply.sectionTitle.length <= 24);
      assert.ok(reply.rows.length <= 10);
      for (const row of reply.rows) assert.ok(row.title.length <= 24 && row.id.length <= 200, row.title);
    }
  });

  test('greets by first name only and cannot be abused to inject links or formatting', () => {
    const [named] = ask('hola', { name: 'María José' }).replies;
    assert.match(named.body, /María/);
    assert.doesNotMatch(named.body, /José/);

    const [hostile] = ask('hola', { name: '*Camila* https://evil.example/pay' }).replies;
    assert.match(hostile.body, /Camila/);
    assert.doesNotMatch(hostile.body, /evil|https?:|\*/);

    assert.doesNotMatch(ask('hola', { name: '😀😀' }).replies[0].body, /😀/);
  });
});

describe('options', () => {
  const links = {
    explore: `${SITE}/properties`,
    booking: `${SITE}/account`,
    payments: `${SITE}/legal/refund`,
    host: `${SITE}/host`,
  };
  const cases = [
    // digits and "option N"
    [{ text: '1' }, 'explore'],
    [{ text: '2' }, 'booking'],
    [{ text: '3' }, 'payments'],
    [{ text: '4' }, 'host'],
    [{ text: 'opción 3' }, 'payments'],
    [{ text: 'option 2' }, 'booking'],
    // option titles typed by hand, in either language
    [{ text: 'Explorar y reservar' }, 'explore'],
    [{ text: 'mi reserva' }, 'booking'],
    [{ text: 'Pagos y reembolsos' }, 'payments'],
    [{ text: 'Ser anfitrión' }, 'host'],
    [{ text: 'Become a host' }, 'host'],
    [{ text: 'My booking' }, 'booking'],
    // interactive replies carry the row id (title is what WhatsApp shows the user)
    [{ text: 'Explorar y reservar', buttonId: 'opt_explore' }, 'explore'],
    [{ text: 'Payments & refunds', buttonId: 'opt_payments' }, 'payments'],
    [{ text: '', buttonId: 'opt_host' }, 'host'],
    // natural phrases
    [{ text: 'quiero reservar una cabaña' }, 'explore'],
    [{ text: 'I want to book a cabin' }, 'explore'],
    [{ text: 'cómo cancelo mi reserva' }, 'booking'],
    [{ text: 'cancelar reserva' }, 'booking'],
    [{ text: 'política de cancelación' }, 'payments'],
    [{ text: 'where is my refund' }, 'payments'],
    [{ text: 'quiero ser anfitrión' }, 'host'],
  ];

  for (const [input, key] of cases) {
    test(`${JSON.stringify(input.buttonId ?? input.text)} → ${key} link`, () => {
      const result = ask(input.text, { buttonId: input.buttonId });
      assert.equal(result.intent, `option_${key}`);
      assert.equal(result.replies.length, 1);
      assert.equal(result.replies[0].type, 'text');
      assert.ok(body(result).includes(links[key]), body(result));
      assert.match(body(result), /\*menu\*/);
    });
  }

  test('payments option says the cancellation policy lives on the refund page', () => {
    assert.match(body(ask('3')), /pol[ií]tica de cancelaci[oó]n[^]*\/legal\/refund/i);
    assert.match(body(ask('refunds')), /cancellation policy[^]*\/legal\/refund/i);
  });

  test('a trailing slash on the site URL never produces a double slash', () => {
    const text = body(ask('1', { siteUrl: 'https://example.test///' }));
    assert.ok(text.includes('https://example.test/properties'), text);
    assert.ok(!text.includes('//properties'), text);
  });

  test('a stale or unknown button id falls back to what the user typed', () => {
    assert.equal(ask('Mi reserva', { buttonId: 'old_button' }).intent, 'option_booking');
  });
});

describe('language', () => {
  test('defaults to Spanish and detects English from the message', () => {
    assert.equal(ask('xyzzy').state.lang, 'es');
    assert.equal(ask('do you have pets allowed?').state.lang, 'en');
    assert.match(body(ask('how do I pay')), /Payments, refunds/);
    assert.match(body(ask('cómo pago')), /Pagos, reembolsos/);
  });

  test('is sticky for neutral input and switches back when the user does', () => {
    const english = ask('hello').state;
    assert.match(body(at(NOW, '3', english)), /Payments, refunds/);
    assert.equal(at(NOW, 'quiero pagar', english).state.lang, 'es');
  });
});

describe('human handoff', () => {
  for (const text of ['5', 'humano', 'Quiero hablar con un asesor', 'agent', 'I need a human please', 'talk to a person', 'persona']) {
    test(`${JSON.stringify(text)} hands off`, () => {
      const result = ask(text);
      assert.equal(result.intent, 'handoff');
      assert.equal(result.replies.length, 1);
      assert.match(body(result), /reserve@elevari\.live/);
      assert.match(body(result), /horario de atención|business hours/);
    });
  }

  test('counting guests is not a handoff request', () => {
    for (const text of ['para una persona', '2 personas', 'somos 4 personas', 'one person please']) {
      assert.notEqual(ask(text).intent, 'handoff', text);
    }
  });

  test('stays quiet for 12 hours, except for menu and stop', () => {
    const { state } = ask('humano');
    assert.equal(state.handoffUntil, NOW + HANDOFF_MS);

    for (const text of ['hola', 'gracias', '1', 'asdf qwer', 'help', 'humano', 'persona']) {
      const quiet = at(NOW + HANDOFF_MS - 1, text, state);
      assert.equal(quiet.intent, 'silent_handoff', text);
      assert.deepEqual(quiet.replies, [], text);
    }
    assert.equal(at(NOW + HANDOFF_MS, 'hola', state).intent, 'welcome');
  });

  test('menu ends the silence and shows the menu', () => {
    const { state } = ask('humano');
    const result = at(NOW + MINUTE, 'menu', state);
    assert.equal(result.intent, 'welcome');
    assert.equal(result.state.handoffUntil, 0);
    assert.equal(at(NOW + 2 * MINUTE, '1', result.state).intent, 'option_explore');
  });

  test('stop during the silence still opts out', () => {
    const { state } = ask('humano');
    const result = at(NOW + MINUTE, 'stop', state);
    assert.equal(result.intent, 'opt_out');
    assert.equal(result.state.handoffUntil, 0);
  });
});

describe('opt-out', () => {
  const optOuts = [
    'stop',
    'STOP',
    'Baja',
    'parar',
    'unsubscribe',
    'cancelar suscripción',
    'cancelar suscripcion',
    'quiero darme de baja',
    'no more messages',
    'por favor para de escribirme',
  ];

  for (const text of optOuts) {
    test(`${JSON.stringify(text)} confirms once and records the opt-out`, () => {
      const result = ask(text);
      assert.equal(result.intent, 'opt_out');
      assert.equal(result.replies.length, 1);
      assert.equal(result.state.optedOut, true);
    });
  }

  test('ordinary sentences that merely contain those words are not opt-outs', () => {
    for (const text of ['cancelar reserva', 'baja temporada', 'bus stop near the cabin', 'quiero dar de baja mi reserva', 'parar en la finca']) {
      assert.notEqual(ask(text).intent, 'opt_out', text);
    }
  });

  test('is silent afterwards, even for another stop or for help', () => {
    const { state } = ask('stop');
    for (const text of ['stop', 'gracias', '1', 'hi', 'ayuda', 'help', 'humano', 'asdf']) {
      const result = at(NOW + 24 * 60 * MINUTE, text, state);
      assert.equal(result.intent, 'silent_opted_out', text);
      assert.deepEqual(result.replies, [], text);
      assert.equal(result.state.optedOut, true, text);
    }
  });

  test('only menu, hola, start or inicio opt the sender back in', () => {
    const { state } = ask('stop');
    for (const text of ['menu', 'Menú', 'hola', 'start', 'inicio']) {
      const result = at(NOW + MINUTE, text, state);
      assert.equal(result.intent, 'opt_in', text);
      assert.equal(result.replies[0].type, 'list', text);
      assert.equal(result.state.optedOut, false, text);
    }
  });
});

describe('fallback and unsupported messages', () => {
  test('unknown text gets one short pointer to the menu per 5 minutes', () => {
    const first = ask('qwerty zxcv');
    assert.equal(first.intent, 'fallback');
    assert.match(body(first), /\*menu\*/);

    const second = at(NOW + MINUTE, 'otra cosa rara', first.state);
    assert.equal(second.intent, 'fallback_throttled');
    assert.deepEqual(second.replies, []);

    // the cooldown only applies to the fallback itself
    assert.equal(at(NOW + MINUTE, 'hola', first.state).intent, 'welcome');

    assert.equal(at(NOW + FALLBACK_COOLDOWN_MS - 1, 'otra', first.state).intent, 'fallback_throttled');
    assert.equal(at(NOW + FALLBACK_COOLDOWN_MS, 'otra', first.state).intent, 'fallback');
  });

  test('thanks, acknowledgements and emoji-only messages get no reply', () => {
    for (const text of ['gracias', 'thanks', 'ok', 'listo', '👍', '😀']) {
      assert.deepEqual(ask(text).replies, [], text);
    }
  });

  test('media gets a single "text only" note per 5 minutes, in the sender language', () => {
    const first = ask('hello').state;
    const note = at(NOW, '', first, { type: 'unsupported' });
    assert.equal(note.intent, 'unsupported');
    assert.match(body(note), /only read text/);

    const again = at(NOW + MINUTE, '', note.state, { type: 'unsupported' });
    assert.equal(again.intent, 'unsupported_throttled');
    assert.deepEqual(again.replies, []);
    assert.equal(at(NOW + UNSUPPORTED_COOLDOWN_MS, '', note.state, { type: 'unsupported' }).intent, 'unsupported');
  });

  test('media is ignored while handed off or opted out', () => {
    for (const text of ['humano', 'stop']) {
      const { state } = ask(text);
      assert.deepEqual(at(NOW + MINUTE, '', state, { type: 'unsupported' }).replies, []);
    }
  });
});

describe('purity', () => {
  test('never mutates the state it is given and never returns more than one reply', () => {
    const state = Object.freeze({ lang: 'es', optedOut: false, handoffUntil: 0, lastFallbackAt: null, lastUnsupportedAt: null });
    const inputs = ['hola', 'stop', 'humano', 'asdf', '3', 'gracias', '', '   ', 'MENU', 'cancelar', 'hi', '🙂', '5', 'x'.repeat(5000)];
    for (const text of inputs) {
      const result = route({ text, now: NOW, state, siteUrl: SITE });
      assert.ok(result.replies.length <= 1, text);
    }
    assert.deepEqual(state, { lang: 'es', optedOut: false, handoffUntil: 0, lastFallbackAt: null, lastUnsupportedAt: null });
  });

  test('copes with missing or corrupt state', () => {
    assert.equal(route({ text: 'hola', now: NOW, state: null }).intent, 'welcome');
    assert.equal(route({ text: 'hola', now: NOW, state: { handoffUntil: 'x', lang: 42 } }).intent, 'welcome');
    assert.equal(route().replies.length, 0);
  });
});
