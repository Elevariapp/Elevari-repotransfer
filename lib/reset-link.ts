/**
 * The reset token is the only secret in the e-mailed link, so it travels in the URL fragment
 * (`#token=…`): browsers never send it to a server, which keeps it out of access logs, CDN logs
 * and analytics page URLs. `?token=…` is still read for links that were already in inboxes.
 */
export function readResetToken(location: { search: string; hash: string }): string {
  const fromHash = new URLSearchParams(location.hash.replace(/^#/, '')).get('token');
  const fromQuery = new URLSearchParams(location.search).get('token');
  return (fromHash || fromQuery || '').trim();
}
