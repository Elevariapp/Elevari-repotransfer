/**
 * Occupancy Analytics Engine (server-side, Node.js compatible).
 *
 * Provides read-only occupancy metrics computed from in-memory booking data.
 * Safe to import in tests; no browser globals required.
 */

class _OccupancyAnalyticsEngine {
  constructor() {
    this._bookings = [];
    this._totalNights = 365;
  }

  _loadBookings() {
    return this._bookings;
  }

  async calculate() {
    const bookings = this._loadBookings();
    let nightsBooked = 0;
    for (const b of bookings) {
      nightsBooked += Number(b.nights || 1);
    }
    const occupancyRate = this._totalNights > 0 ? (nightsBooked / this._totalNights) * 100 : 0;
    return {
      occupancyRate,
      nightsBooked,
      totalNights: this._totalNights,
    };
  }

  async forProperty(propertyId) {
    const metrics = await this.calculate();
    metrics.propertyId = propertyId;
    return metrics;
  }
}

export const OccupancyAnalyticsEngine = new _OccupancyAnalyticsEngine();
export default OccupancyAnalyticsEngine;
