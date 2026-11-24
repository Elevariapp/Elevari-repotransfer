import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  accountDeleted,
  bookingCancellation,
  bookingConfirmation,
  checkInReminder,
  hostBookingCancelled,
  hostNewBooking,
  invoiceReceipt,
  passwordChanged,
  passwordReset,
  welcome,
} from '../src/lib/email-templates/index.js';
import { previewName } from '../src/lib/email-templates/layout.js';
import { htmlToText } from '../src/lib/email.js';

const SITE = 'https://elevari.live';
const LONG_TITLE =
  'Domo Geodésico Aurora con jacuzzi privado, vista a la montaña y desayuno incluido para dos personas en el páramo';
const HOSTILE = '<script>alert(1)</script> "Domo" & Co';

const PREFERENCES_URL = `${SITE}/account/notifications`;

const base = { bookingId: 'bk_123', propertyName: LONG_TITLE, guestName: 'Ana' };
const stay = { checkIn: new Date('2030-03-10T00:00:00Z'), checkOut: new Date('2030-03-12T00:00:00Z') };

const templates: Record<string, () => string> = {
  welcome: () => welcome({ guestName: 'Ana', ctaUrl: `${SITE}/properties` }),
  'welcome (host)': () => welcome({ guestName: 'Ana', ctaUrl: `${SITE}/host`, isHost: true }),
  'password-reset': () => passwordReset({ guestName: 'Ana', resetUrl: `${SITE}/auth/reset-password#token=abc` }),
  'password-changed': () =>
    passwordChanged({ guestName: 'Ana', changedAt: new Date(), secureUrl: `${SITE}/auth/forgot-password` }),
  'account-deleted': () => accountDeleted({ guestName: 'Ana' }),
  'booking-confirmation': () =>
    bookingConfirmation({ ...base, ...stay, guests: 2, total: 640000, bookingUrl: `${SITE}/account` }),
  'booking-cancellation': () =>
    bookingCancellation({
      ...base,
      refundAmount: 100000,
      reason: HOSTILE,
      exploreUrl: `${SITE}/properties`,
    }),
  'booking-cancellation (expired)': () =>
    bookingCancellation({ ...base, expiredUnpaid: true, exploreUrl: `${SITE}/properties` }),
  'host-new-booking': () =>
    hostNewBooking({
      ...base,
      hostName: 'Luis',
      ...stay,
      guests: 2,
      hostReceives: 544000,
      dashboardUrl: `${SITE}/host`,
      preferencesUrl: PREFERENCES_URL,
    }),
  'host-booking-cancelled': () =>
    hostBookingCancelled({
      ...base,
      hostName: 'Luis',
      ...stay,
      dashboardUrl: `${SITE}/host`,
      preferencesUrl: PREFERENCES_URL,
    }),
  'check-in-reminder': () =>
    checkInReminder({ ...base, checkIn: stay.checkIn, bookingUrl: `${SITE}/account`, preferencesUrl: PREFERENCES_URL }),
  'invoice-receipt': () =>
    invoiceReceipt({ ...base, invoiceId: 'FE-1001', total: 640000, billingUrl: `${SITE}/account/billing` }),
  'invoice-receipt (pending)': () => invoiceReceipt({ ...base, total: 640000, billingUrl: `${SITE}/account/billing` }),
};

function preheaderOf(html: string): string {
  const match = html.match(/<div style="display:none[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(match, 'the email has a hidden preheader');
  return match[1].replace(/&#8204;|&nbsp;/g, '').trim();
}

describe('email templates', () => {
  for (const [name, render] of Object.entries(templates)) {
    describe(name, () => {
      const html = render();

      it('keeps the preview line short enough to read in an inbox, English half included', () => {
        const preheader = preheaderOf(html);
        assert.ok(Array.from(preheader).length <= 150, `preheader is ${preheader.length} characters`);
        assert.match(preheader, / · /, 'Spanish and English halves are both there');
      });

      it('only links to https pages or a mailto', () => {
        const links = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
        assert.ok(links.length > 0);
        for (const href of links) {
          assert.ok(href.startsWith('https://') || href.startsWith('mailto:'), `unexpected link: ${href}`);
        }
      });

      it('has a plain-text alternative with the links and without markup or the hidden preview', () => {
        const text = htmlToText(html);
        assert.ok(text.length > 80);
        assert.doesNotMatch(text, /<\/?(?:p|a|td|tr|table|div|br|img|h[1-6]|span|body|html)\b/i);
        assert.doesNotMatch(text, /&(?:nbsp|amp|#\d+);|\u200c/);
        assert.match(text, /\(https:\/\/\S+\)/);
      });
    });
  }

  it('shortens long stay names in the preview without cutting emoji in half', () => {
    const long = `Cabaña ${'🌿'.repeat(60)}`;
    const short = previewName(long);
    assert.ok(Array.from(short).length <= 34);
    assert.ok(short.endsWith('…'));
    assert.doesNotMatch(short, /[\ud800-\udbff](?![\udc00-\udfff])/);
    assert.equal(previewName('  Domo   Aurora '), 'Domo Aurora');
  });

  it('puts the shortened name, not the full title, in the preview of booking emails', () => {
    for (const name of ['booking-confirmation', 'host-new-booking', 'host-booking-cancelled', 'check-in-reminder']) {
      const preheader = preheaderOf(templates[name]!());
      assert.ok(preheader.includes('…'), `${name}: ${preheader}`);
      assert.ok(!preheader.includes('desayuno incluido'), `${name} leaks the full title into the preview`);
    }
  });

  it('escapes whatever a guest or host typed', () => {
    const html = templates['booking-cancellation']!();
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &quot;Domo&quot; &amp; Co/);
    const preview = preheaderOf(
      checkInReminder({ ...base, propertyName: HOSTILE, checkIn: stay.checkIn, bookingUrl: `${SITE}/account` }),
    );
    assert.doesNotMatch(preview, /<script>/);
  });

  describe('notification preferences link', () => {
    const optional = ['host-new-booking', 'host-booking-cancelled', 'check-in-reminder'];

    it('is on the emails that can be switched off, with the reason they were sent', () => {
      for (const name of optional) {
        const html = templates[name]!();
        assert.ok(html.includes(`href="${PREFERENCES_URL}"`), `${name} links to the preferences`);
        assert.match(html, /Gestionar notificaciones/);
        assert.match(html, /Manage notifications/);
        assert.match(htmlToText(html), /Gestionar notificaciones \(https:\/\/elevari\.live\/account\/notifications\)/);
      }
    });

    it('is left out when the sender gives no link, rather than promising a way out that is not there', () => {
      const html = checkInReminder({ ...base, checkIn: stay.checkIn, bookingUrl: `${SITE}/account` });
      assert.doesNotMatch(html, /Gestionar notificaciones/);
    });

    it('is not on the emails the guest cannot switch off', () => {
      const always = Object.keys(templates).filter((name) => !optional.includes(name));
      for (const name of always) {
        assert.doesNotMatch(templates[name]!(), /Gestionar notificaciones/, name);
      }
    });
  });
});
