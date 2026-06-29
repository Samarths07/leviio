import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Cookie Policy — Leviio",
  description: "What cookies Leviio uses, why, and how you can control them.",
};

const sections: LegalSection[] = [
  {
    id: "what-are-cookies",
    heading: "What Are Cookies",
    content: (
      <>
        <p>
          Cookies are small text files stored on your device when you visit a
          website. We also use similar technologies such as <code>localStorage</code>{" "}
          to keep you signed in and remember your preferences. Together we refer
          to these as &ldquo;cookies&rdquo;.
        </p>
        <p>
          This policy should be read together with our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </>
    ),
  },
  {
    id: "categories",
    heading: "Categories We Use",
    content: (
      <>
        <p><strong>Essential.</strong> Required for the Service to function — keeping
        you logged in (Supabase auth session), securing forms, and remembering your
        cookie choice. These are always on and carry no tracking.</p>
        <p><strong>Analytics.</strong> Help us understand how Leviio is used so we can
        improve it. Loaded only with your consent.</p>
        <p><strong>Marketing.</strong> Used to personalise offers and measure campaigns.
        Loaded only with your consent.</p>
      </>
    ),
  },
  {
    id: "essential-list",
    heading: "Essential Cookies We Set",
    content: (
      <>
        <ul>
          <li><strong>Supabase auth session</strong> — keeps creators and clients signed in.</li>
          <li><strong>leviio_cookie_consent</strong> — remembers your cookie preferences.</li>
          <li><strong>Cart / rate-limit storage</strong> — pre-checkout cart and basic abuse protection.</li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party",
    heading: "Third-Party Services",
    content: (
      <>
        <p>
          When you make a payment, our processor <strong>Razorpay</strong> may set
          cookies needed to complete and secure the transaction. Payments are only
          initiated when you choose to check out.
        </p>
      </>
    ),
  },
  {
    id: "manage",
    heading: "Managing Your Choices",
    content: (
      <>
        <p>
          When you first visit Leviio we ask for your consent and let you accept,
          reject, or customise non-essential cookies. You can change your mind at
          any time by clearing your browser&rsquo;s site data for Leviio, which will
          prompt the consent banner again on your next visit.
        </p>
        <p>
          Most browsers also let you block or delete cookies in their settings.
          Blocking essential cookies may stop you from signing in or using parts of
          the Service.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    content: (
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:privacy@leviio.com">privacy@leviio.com</a>.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="What cookies Leviio uses, why we use them, and how you stay in control."
      updated="29 June 2026"
      sections={sections}
    />
  );
}
