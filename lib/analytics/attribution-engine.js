/**
 * Attribution Engine (server-side, Node.js compatible).
 *
 * Attributes revenue to acquisition channels based on in-memory booking data.
 * Safe to import in tests; no browser globals required.
 */

class _AttributionEngine {
  constructor() {
    this._bookings = [];
  }

  _loadBookings() {
    return this._bookings;
  }

  async calculate() {
    const bookings = this._loadBookings();
    const byChannelMap = {};
    let totalRevenue = 0;

    for (const b of bookings) {
      const channel = b.channel || 'direct';
      const amount = Number(b.amount || 0);
      totalRevenue += amount;
      if (!byChannelMap[channel]) {
        byChannelMap[channel] = { channel, revenue: 0, bookings: 0 };
      }
      byChannelMap[channel].revenue += amount;
      byChannelMap[channel].bookings += 1;
    }

    const byChannel = Object.values(byChannelMap);
    return { totalRevenue, byChannel };
  }
}

export const AttributionEngine = new _AttributionEngine();
export default AttributionEngine;
