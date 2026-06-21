import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy — Leviio",
  description: "How Leviio collects, uses, shares, and protects your personal data.",
};

const sections: LegalSection[] = [
  {
    id: "intro",
    heading: "Introduction & Scope",
    content: (
      <>
        <p>
          This Privacy Policy explains how Leviio (&ldquo;Leviio&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, shares, and
          protects personal data when you use our website, dashboard,
          storefronts, and client portal (the &ldquo;Service&rdquo;).
        </p>
        <p>
          It applies to Creators, Clients, and visitors. By using the Service,
          you acknowledge the practices described here. This policy should be
          read together with our <a href="/terms">Terms of Service</a>.
        </p>
      </>
    ),
  },
  {
    id: "who-we-are",
    heading: "Who We Are & How to Contact Us",
    content: (
      <>
        <p>
          Leviio is the data controller for personal data we process about
          Creators and visitors. For personal data that Creators upload about
          their own Clients, Leviio generally acts as a data processor on the
          Creator&rsquo;s behalf (see &ldquo;Creator &amp; Client Data&rdquo;).
        </p>
        <p>
          You can reach us at{" "}
          <a href="mailto:privacy@leviio.com">privacy@leviio.com</a> for any
          privacy questions or to exercise your rights.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    heading: "Information We Collect",
    content: (
      <>
        <h3>Information you provide</h3>
        <ul>
          <li><strong>Account data</strong> — name, email, username, password, profile details, niche, and bio.</li>
          <li><strong>Client &amp; coaching data</strong> — names, contact details, goals, measurements, plans, sessions, and messages that Creators add.</li>
          <li><strong>Content</strong> — products, programs, meal plans, images, and files you upload.</li>
          <li><strong>Payment data</strong> — billing details processed by our payment provider; we receive limited information such as the last four digits and transaction status, not full card numbers.</li>
          <li><strong>Communications</strong> — messages you send through the Service and to our support.</li>
        </ul>
        <h3>Information we collect automatically</h3>
        <ul>
          <li><strong>Usage data</strong> — pages viewed, features used, and actions taken.</li>
          <li><strong>Device &amp; log data</strong> — IP address, browser type, device identifiers, and timestamps.</li>
          <li><strong>Cookies &amp; local storage</strong> — used to keep you signed in and remember preferences.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    heading: "How We Use Your Information",
    content: (
      <>
        <p>We use personal data to:</p>
        <ul>
          <li>provide, operate, and maintain the Service and your account;</li>
          <li>process subscriptions, transactions, and payouts;</li>
          <li>enable storefronts, client portals, messaging, and bookings;</li>
          <li>send service, security, and transactional communications;</li>
          <li>provide customer support and respond to requests;</li>
          <li>monitor, secure, debug, and improve the Service; and</li>
          <li>comply with legal obligations and enforce our Terms.</li>
        </ul>
        <p>
          Where required, our legal bases include performance of a contract,
          your consent, our legitimate interests in running the Service, and
          compliance with legal obligations. You may withdraw consent at any
          time where processing is based on consent.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies & Tracking",
    content: (
      <p>
        We use strictly necessary cookies and browser local storage to keep you
        signed in and to operate core features, and we may use limited analytics
        to understand usage. You can control cookies through your browser
        settings; disabling necessary cookies may affect functionality.
      </p>
    ),
  },
  {
    id: "sharing",
    heading: "How We Share Information",
    content: (
      <>
        <p>We do not sell your personal data. We share it only as needed with:</p>
        <ul>
          <li><strong>Service providers (sub-processors)</strong> who help us run the Service, such as hosting (Vercel), database and authentication (Supabase), payment processing (e.g. Razorpay), and email delivery (e.g. Resend);</li>
          <li><strong>Creators and Clients</strong> as required to complete transactions (for example, a Creator receives the details of a Client who purchases from them);</li>
          <li><strong>Authorities or third parties</strong> where required by law, to enforce our Terms, or to protect rights, safety, and security; and</li>
          <li><strong>Successors</strong> in connection with a merger, acquisition, or sale of assets, subject to this policy.</li>
        </ul>
      </>
    ),
  },
  {
    id: "creator-client",
    heading: "Creator & Client Data",
    content: (
      <p>
        When a Creator uploads or manages data about their Clients, the Creator
        is the controller of that data and is responsible for having a lawful
        basis and appropriate notices in place. Leviio processes that data on
        the Creator&rsquo;s instructions to provide the Service. Clients who have
        questions about how a particular Creator uses their data should contact
        that Creator directly.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "Data Retention",
    content: (
      <p>
        We retain personal data for as long as your account is active and as
        needed to provide the Service, then for the period required to comply
        with legal, tax, accounting, and dispute-resolution obligations. When
        data is no longer needed, we delete or anonymise it. You can request
        deletion as described below.
      </p>
    ),
  },
  {
    id: "security",
    heading: "Data Security",
    content: (
      <p>
        We use reasonable technical and organisational measures to protect
        personal data, including encryption in transit, access controls, and
        secure infrastructure. No method of transmission or storage is fully
        secure, so we cannot guarantee absolute security. You are responsible
        for keeping your credentials confidential.
      </p>
    ),
  },
  {
    id: "transfers",
    heading: "International Data Transfers",
    content: (
      <p>
        Our service providers may process data in countries other than your own.
        Where we transfer personal data internationally, we take steps to ensure
        an adequate level of protection consistent with applicable law (for
        example, contractual safeguards with our providers).
      </p>
    ),
  },
  {
    id: "your-rights",
    heading: "Your Rights",
    content: (
      <>
        <p>
          Subject to applicable law (including India&rsquo;s Digital Personal
          Data Protection Act and, where relevant, the GDPR), you may have the
          right to:
        </p>
        <ul>
          <li>access the personal data we hold about you;</li>
          <li>correct inaccurate or incomplete data;</li>
          <li>request deletion of your data;</li>
          <li>object to or restrict certain processing;</li>
          <li>withdraw consent where processing relies on consent;</li>
          <li>request a copy of your data in a portable format; and</li>
          <li>nominate another person to exercise your rights in case of death or incapacity.</li>
        </ul>
        <p>
          To exercise any right, email{" "}
          <a href="mailto:privacy@leviio.com">privacy@leviio.com</a>. We may need
          to verify your identity, and we will respond within the timeframes
          required by law.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children's Privacy",
    content: (
      <p>
        The Service is not directed to children under 18, and we do not knowingly
        collect personal data from them. If you believe a child has provided us
        personal data, contact us and we will take appropriate steps to delete
        it.
      </p>
    ),
  },
  {
    id: "grievance",
    heading: "Grievance Officer",
    content: (
      <p>
        In accordance with applicable Indian law, you may contact our Grievance
        Officer regarding any concern about your personal data at{" "}
        <a href="mailto:grievance@leviio.com">grievance@leviio.com</a>. We will
        acknowledge and address complaints within the timelines prescribed by
        law.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. Material changes
        will be notified through the Service or by email, and we will update the
        &ldquo;Last updated&rdquo; date above. Your continued use of the Service
        after changes take effect indicates acceptance of the updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact Us",
    content: (
      <p>
        For any privacy questions or requests, contact us at{" "}
        <a href="mailto:privacy@leviio.com">privacy@leviio.com</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Your privacy matters. This policy explains what data we collect, why, and the choices and rights you have."
      updated="June 19, 2026"
      sections={sections}
    />
  );
}
