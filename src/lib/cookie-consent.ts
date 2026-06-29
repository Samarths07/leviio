"use client";

// Lightweight cookie/consent preference store. Choices persist in localStorage
// and broadcast a "leviio:consent" event so any future analytics/marketing
// scripts can load only with permission. "necessary" cookies are always on
// (they're required for login/sessions and carry no tracking).

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of when the choice was made. */
  decidedAt: string;
}

const KEY = "leviio_cookie_consent";
export const CONSENT_EVENT = "leviio:consent";

export function getConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decidedAt: parsed.decidedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function setConsent(prefs: { analytics: boolean; marketing: boolean }): ConsentPreferences {
  const value: ConsentPreferences = {
    necessary: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {
    /* ignore storage failures */
  }
  return value;
}

export function hasDecided(): boolean {
  return getConsent() !== null;
}
