import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { guestDisplayName } from '../src/lib/guest-name.js';

describe('guestDisplayName', () => {
  it('keeps the name the guest typed', () => {
    assert.equal(
      guestDisplayName({ guestName: 'Camila Rojas', guestEmail: 'camila@example.com', guest: { name: 'Cami' } }),
      'Camila Rojas',
    );
  });

  it('prefers the profile name when the booking only has the e-mail local part', () => {
    assert.equal(
      guestDisplayName({ guestName: 'juan.perez23', guestEmail: 'Juan.Perez23@example.com', guest: { name: 'Juan Pérez' } }),
      'Juan Pérez',
    );
  });

  it('falls back to the stored name when the account has no profile name', () => {
    assert.equal(
      guestDisplayName({ guestName: 'juan.perez23', guestEmail: 'juan.perez23@example.com', guest: { name: null } }),
      'juan.perez23',
    );
    assert.equal(guestDisplayName({ guestName: null, guestEmail: null, guest: { name: ' Juan ' } }), 'Juan');
  });

  it('has no name when nothing is known', () => {
    assert.equal(guestDisplayName({ guestName: '  ', guestEmail: null, guest: null }), null);
  });
});
