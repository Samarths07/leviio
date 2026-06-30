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
 * Route. The creator's linked account receives the rest. Pro subscription
 * payments are not split.
 */
export const PLATFORM_FEE_PERCENT = 10;
