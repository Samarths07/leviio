/**
 * Billing constants shared by the client (pricing UI) and the server
 * (Razorpay order amounts). No secrets here.
 */
export const PRO_PRICE_INR = 399;
export const CURRENCY = "INR";

/** Pro plan length granted per successful payment. */
export const PRO_PERIOD_DAYS = 30;

/**
 * Platform commission (%) Leviio keeps on each storefront sale via Razorpay
 * Route — plan-based: Pro creators pay 0% (perk of subscribing), Free creators
 * pay 2%. The creator's linked account receives the rest. Pro *subscription*
 * payments themselves are never split.
 */
export const PLATFORM_FEE_PRO = 0;
export const PLATFORM_FEE_FREE = 2;

export function platformFeePercent(plan?: string): number {
  return plan === "Pro" ? PLATFORM_FEE_PRO : PLATFORM_FEE_FREE;
}
