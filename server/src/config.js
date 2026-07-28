// The one and only permanent admin wallet.
// Admin status is determined SOLELY by exact match against this address —
// never by connection order, and never by a database flag alone.
export const ADMIN_WALLET = (process.env.ADMIN_WALLET || "0x38e2F47D9b2Eb233c035Dcbc2D40857D9517933A").toLowerCase();

export function isAdminWallet(address) {
  return !!address && address.toLowerCase() === ADMIN_WALLET;
}
