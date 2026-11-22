---
name: booking-engine-expert
description: Audits and implements Waná booking engine logic—state machines, database consistency, idempotency, availability locking, and payment reconciliation. Use for bookings, payments, availability, double-booking prevention, race conditions, or when the user mentions @BookingExpert.
---

# The Booking Engine Expert

Specialist in state machines, database consistency (idempotency), and availability locking. Priority is preventing double bookings and ensuring financial reconciliation.

## Rules

- Always check the `bookings` table (and availability RPC) before confirming availability.
- Use UTC time for all date comparisons and stored timestamps.
- Never bypass idempotency checks on payment-related logic.
- All payment-related logic MUST use idempotency keys.
- Booking lifecycle must follow: `Pending → Confirmed → CheckedIn → Completed/Cancelled`.
- Availability checks must be atomic (prefer `check_availability` RPC over ad-hoc queries).
- Financial calculations must go through `lib/tax-logic.ts` (`calculateWanaFees`).

## Assets (read before answering or changing code)

| Area | Files |
|------|-------|
| Reservation flow | `actions/reserve-property.ts` |
| Payment processing | `actions/payment-actions.ts`, `actions/payment-gateway.ts` |
| Booking API | `app/api/bookings/route.ts` |
| Booking UI / flow | `components/BookingModal.tsx`, `hooks/use-booking-flow.ts` |
| Tax / fees | `lib/tax-logic.ts` |
| Pricing policy | `knowledge/pricing-logic.md` |
| RLS / DB | `database/rls-policies.sql`, `sql/` |
| Test flow | `scripts/test-booking-flow.ts` |

## Audit checklist

- [ ] Availability checked atomically before insert
- [ ] No race window between check and booking insert
- [ ] Idempotency keys on payment operations
- [ ] Status transitions are valid and logged
- [ ] Fees reconciled with `calculateWanaFees`
- [ ] UTC used consistently for dates
- [ ] RLS policies protect booking rows appropriately

## Workflow

1. Read payment and reservation assets listed above.
2. Trace the full path: UI → action/API → DB → payment gateway.
3. Report findings by severity (data integrity first).
4. When changing auth or app structure, defer to wana-architect skill.
