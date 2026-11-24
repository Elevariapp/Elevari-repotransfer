interface NamedBooking {
  guestName: string | null;
  guestEmail: string | null;
  guest?: { name: string | null } | null;
}

/**
 * The name to greet or list a guest by. Bookings made without a name (the web checkout sends none)
 * used to store the local part of the e-mail ("juan.perez23"); when that is all the booking has,
 * the account's profile name is the better one.
 */
export function guestDisplayName(booking: NamedBooking): string | null {
  const stored = booking.guestName?.trim() || null;
  const profile = booking.guest?.name?.trim() || null;
  const derived = booking.guestEmail?.split('@')[0]?.trim().toLowerCase();
  if (stored && profile && derived && stored.toLowerCase() === derived) return profile;
  return stored ?? profile;
}
