export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";
export const ADSENSE_PUBLIC_SLOT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_PUBLIC_SLOT_ID ?? "";
export const ADSENSE_DASHBOARD_SLOT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT_ID ?? "";

export function isAdsenseConfigured() {
  return (
    /^ca-pub-\d{16}$/.test(ADSENSE_CLIENT_ID) &&
    /^\d+$/.test(ADSENSE_PUBLIC_SLOT_ID) &&
    /^\d+$/.test(ADSENSE_DASHBOARD_SLOT_ID)
  );
}
