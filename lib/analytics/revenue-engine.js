/**
 * Revenue Analytics Engine (server-side, Node.js compatible).
 *
 * Provides read-only revenue metrics computed from in-memory booking data.
 * Safe to import in tests; no browser globals required.
 */

class _RevenueAnalyticsEngine {
  constructor() {
    this._bookings = [];
  }

  _loadBookings() {
    // No-op placeholder: in production this reads from the DB.
    return this._bookings;
  }

  async calculate() {
    const bookings = this._loadBookings();
    let grossRevenue = 0;
    let netRevenue = 0;
    let nightsSold = 0;
    let bookingsCount = bookings.length;

    for (const b of bookings) {
      const amount = Number(b.amount || 0);
      const nights = Number(b.nights || 1);
      grossRevenue += amount;
      netRevenue += amount;
      nightsSold += nights;
    }

    const adr = nightsSold > 0 ? netRevenue / nightsSold : 0;

    return {
      grossRevenue,
      netRevenue,
      adr,
      nightsSold,
      bookingsCount,
      nightsBooked: nightsSold,
    };
  }

  async forProperty(propertyId) {
    const metrics = await this.calculate();
    metrics.propertyId = propertyId;
    return metrics;
  }

  async forHost(hostId) {
    const metrics = await this.calculate();
    metrics.hostId = hostId;
    return metrics;
  }
}

export const RevenueAnalyticsEngine = new _RevenueAnalyticsEngine();
export default RevenueAnalyticsEngine;
