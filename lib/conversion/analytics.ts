export type AnalyticsEvent = {
  name: string;
  payload?: Record<string, unknown>;
  timestamp: number;
};

const queue: AnalyticsEvent[] = [];

export function track(eventName: string, payload?: Record<string, unknown>) {
  const ev: AnalyticsEvent = { name: eventName, payload, timestamp: Date.now() };
  queue.push(ev);
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({ event: eventName, ...payload });
  }
}

export function getEvents() {
  return [...queue];
}

export function clearEvents() {
  queue.length = 0;
}
