'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { parseWebhook } = require('../src/webhook');
const {
  PHONE_NUMBER_ID,
  USER,
  textMessage,
  listReply,
  buttonReply,
  templateButton,
  mediaMessage,
  webhookPayload,
} = require('./helpers');

const parseOne = (message) => parseWebhook(webhookPayload([message]))[0];

describe('parseWebhook', () => {
  test('reads text messages with the sender, profile name and receiving number', () => {
    const [message] = parseWebhook(webhookPayload([textMessage({ body: 'Hola', id: 'wamid.A' })], { name: 'Camila' }));
    assert.deepEqual(message, {
      id: 'wamid.A',
      from: USER,
      type: 'text',
      kind: 'text',
      text: 'Hola',
      phoneNumberId: PHONE_NUMBER_ID,
      profileName: 'Camila',
    });
  });

  test('reads list and reply-button answers (id and visible title)', () => {
    const list = parseOne(listReply({ rowId: 'opt_payments', title: 'Pagos y reembolsos' }));
    assert.deepEqual([list.kind, list.buttonId, list.text], ['text', 'opt_payments', 'Pagos y reembolsos']);

    const button = parseOne(buttonReply({ buttonId: 'opt_host', title: 'Ser anfitrión' }));
    assert.deepEqual([button.kind, button.buttonId, button.text], ['text', 'opt_host', 'Ser anfitrión']);
  });

  test('reads quick-reply buttons of template messages', () => {
    const message = parseOne(templateButton({ payload: 'PAYLOAD_1', text: 'Stop promotions' }));
    assert.deepEqual([message.kind, message.buttonId, message.text], ['text', 'PAYLOAD_1', 'Stop promotions']);
  });

  test('flags media and other unreadable content so the bot can say it only reads text', () => {
    for (const type of ['audio', 'image', 'video', 'document', 'sticker', 'location', 'contacts']) {
      assert.equal(parseOne(mediaMessage({ type })).kind, 'unsupported', type);
    }
  });

  test('ignores reactions, system messages and unknown types', () => {
    for (const type of ['reaction', 'system', 'order', 'something_new']) {
      const message = parseOne({ from: USER, id: 'wamid.X', type, [type]: {} });
      assert.equal(message.kind, 'ignore', type);
    }
    assert.equal(parseOne({ from: USER, id: 'wamid.X', type: 'interactive', interactive: { type: 'nfm_reply' } }).kind, 'ignore');
  });

  test('ignores delivery/read statuses', () => {
    const payload = webhookPayload([], { statuses: [{ id: 'wamid.S', status: 'delivered', recipient_id: USER }] });
    assert.deepEqual(parseWebhook(payload), []);
  });

  test('collects messages across entries and changes, in order', () => {
    const first = webhookPayload([textMessage({ body: 'uno', id: 'wamid.1' })]);
    const second = webhookPayload([textMessage({ body: 'dos', id: 'wamid.2' }), textMessage({ body: 'tres', id: 'wamid.3' })]);
    first.entry.push(...second.entry);
    assert.deepEqual(parseWebhook(first).map((message) => message.text), ['uno', 'dos', 'tres']);
  });

  test('survives malformed payloads and bad sender ids', () => {
    for (const body of [undefined, null, 'x', 42, [], {}, { entry: 'x' }, { entry: [null, 1, { changes: 'x' }] }, { entry: [{ changes: [{ value: { messages: 'x' } }] }] }]) {
      assert.deepEqual(parseWebhook(body), [], JSON.stringify(body));
    }
    for (const from of [undefined, '', 'abc', '57 300', '1'.repeat(40), 573001234567]) {
      assert.deepEqual(parseWebhook(webhookPayload([{ from, id: 'wamid.B', type: 'text', text: { body: 'hola' } }])), [], String(from));
    }
  });

  test('caps very long text', () => {
    assert.equal(parseOne(textMessage({ body: 'a'.repeat(10_000) })).text.length, 1000);
  });
});
