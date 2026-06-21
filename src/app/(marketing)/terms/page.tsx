import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service — Leviio",
  description: "The terms and conditions governing your use of the Leviio platform.",
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    heading: "Agreement to Terms",
    content: (
      <>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) form a binding agreement
          between you and Leviio (&ldquo;Leviio&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) governing your access to and use of the Leviio
          website, dashboard, storefronts, client portal, and related services
          (collectively, the &ldquo;Service&rdquo;).
        </p>
        <p>
          By creating an account, accessing, or using the Service, you confirm
          that you have read, understood, and agree to be bound by these Terms
          and our <a href="/privacy">Privacy Policy</a>. If you do not agree, do
          not use the Service.
        </p>
      </>
    ),
  },
  {
    id: "definitions",
    heading: "Definitions",
    content: (
      <ul>
        <li>
          <strong>Creator</strong> — a user who registers to sell fitness
          products, coaching, or content through the Service.
        </li>
        <li>
          <strong>Client</strong> — an end customer who purchases from, or is
          invited by, a Creator and accesses the client portal.
        </li>
        <li>
          <strong>Content</strong> — any text, images, programs, meal plans,
          videos, files, or other materials uploaded, sold, or displayed through
          the Service.
        </li>
        <li>
          <strong>Subscription</strong> — a paid or free plan that grants a
          Creator access to features of the Service.
        </li>
      </ul>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility & Accounts",
    content: (
      <>
        <p>
          You must be at least 18 years old and able to form a legally binding
          contract to use the Service. By using the Service you represent that
          you meet these requirements.
        </p>
        <p>
          You are responsible for the information you provide, for maintaining
          the confidentiality of your login credentials, and for all activity
          under your account. Notify us immediately of any unauthorized use. You
          may not share, sell, or transfer your account without our consent.
        </p>
      </>
    ),
  },
  {
    id: "platform",
    heading: "The Leviio Platform",
    content: (
      <>
        <p>
          Leviio provides tools that let Creators build a storefront, sell
          digital and physical products and services, manage clients, create
          diet and workout plans, schedule sessions, and communicate with their
          Clients.
        </p>
        <p>
          Leviio is a <strong>technology platform and marketplace facilitator</strong>.
          When a Client purchases from a Creator, the contract for that product
          or service is between the Client and the Creator. Leviio is not a
          party to that transaction and is not responsible for the quality,
          safety, legality, or delivery of Creator products.
        </p>
      </>
    ),
  },
  {
    id: "subscriptions",
    heading: "Subscriptions, Free Trial & Billing",
    content: (
      <>
        <p>
          The Service is offered on a Free plan and a paid Pro plan. Plan
          features and prices (currently ₹399/month for Pro) are described on
          our <a href="/pricing">pricing page</a> and may change with notice.
        </p>
        <p>
          Pro may include a one-month free trial. Unless you cancel before the
          trial ends, your subscription will automatically convert to a paid
          subscription and your payment method will be charged the then-current
          fee. Subscriptions renew automatically each billing cycle until
          cancelled.
        </p>
        <p>
          You can cancel at any time from your account settings; cancellation
          takes effect at the end of the current billing period. Fees are
          exclusive of applicable taxes (including GST), which will be added
          where required.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    heading: "Creator Sales, Payments & Payouts",
    content: (
      <>
        <p>
          Payments for Creator products and Creator subscriptions are processed
          by third-party payment processors. By transacting, you agree to the
          processor&rsquo;s terms. We do not store full card details.
        </p>
        <p>
          Creators are solely responsible for: setting prices; describing
          products accurately; fulfilling and delivering products and services;
          honouring their own refund policy; and collecting and remitting any
          taxes applicable to their sales. Leviio may deduct platform or
          processing fees as disclosed at the time.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    heading: "Refunds & Cancellations",
    content: (
      <>
        <p>
          <strong>Creator subscriptions:</strong> subscription fees are
          generally non-refundable except where required by law. If you believe
          you were charged in error, contact us within 7 days.
        </p>
        <p>
          <strong>Client purchases:</strong> refunds for products and services
          bought from a Creator are governed by that Creator&rsquo;s stated
          refund policy and applicable consumer-protection law. Clients should
          raise refund requests with the Creator first; Leviio may assist in
          dispute resolution but is not obligated to issue refunds for Creator
          sales.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable Use",
    content: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>violate any law or third-party right, including intellectual property and privacy rights;</li>
          <li>upload content that is unlawful, fraudulent, defamatory, obscene, or harmful;</li>
          <li>sell counterfeit, dangerous, or prohibited goods, or make misleading health claims;</li>
          <li>transmit malware, spam, or attempt to gain unauthorized access to the Service or other accounts;</li>
          <li>scrape, reverse-engineer, or resell the Service except as permitted; or</li>
          <li>impersonate any person or misrepresent your affiliation.</li>
        </ul>
        <p>We may investigate and take action, including suspension, for any suspected violation.</p>
      </>
    ),
  },
  {
    id: "content",
    heading: "User Content & License",
    content: (
      <>
        <p>
          You retain ownership of the Content you upload. You grant Leviio a
          worldwide, non-exclusive, royalty-free licence to host, store,
          reproduce, and display your Content solely to operate, provide, and
          improve the Service (for example, showing your products on your
          storefront and delivering them to your Clients).
        </p>
        <p>
          You represent that you have all rights necessary to your Content and
          that it does not infringe any third-party right. You are responsible
          for your Content and any consequences of sharing it.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    heading: "Intellectual Property",
    content: (
      <p>
        The Service, including its software, design, branding, and the
        &ldquo;Leviio&rdquo; name and logo, is owned by Leviio and protected by
        intellectual-property laws. Except for the rights expressly granted to
        you, we reserve all rights. You may not copy, modify, or create
        derivative works of the Service without our written permission.
      </p>
    ),
  },
  {
    id: "third-party",
    heading: "Third-Party Services",
    content: (
      <p>
        The Service integrates third-party providers (for example, hosting,
        database, payment, and email providers). Your use of those features may
        be subject to the third party&rsquo;s terms and privacy practices. We
        are not responsible for third-party services and do not control them.
      </p>
    ),
  },
  {
    id: "health",
    heading: "Health & Fitness Disclaimer",
    content: (
      <>
        <p>
          <strong>
            Content on Leviio is for general fitness and educational purposes
            only and is not medical advice.
          </strong>{" "}
          Programs, meal plans, and coaching offered by Creators are not a
          substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <p>
          Always consult a qualified physician before starting any exercise or
          nutrition program. Clients participate at their own risk. Leviio does
          not endorse and is not responsible for any Creator&rsquo;s advice,
          plans, or outcomes, and disclaims liability for any injury, illness,
          or loss arising from use of Creator content.
        </p>
      </>
    ),
  },
  {
    id: "warranties",
    heading: "Disclaimer of Warranties",
    content: (
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind, whether express or
        implied, including merchantability, fitness for a particular purpose,
        and non-infringement. We do not warrant that the Service will be
        uninterrupted, secure, or error-free, or that any content is accurate.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of Liability",
    content: (
      <p>
        To the maximum extent permitted by law, Leviio and its officers,
        employees, and partners will not be liable for any indirect, incidental,
        special, consequential, or punitive damages, or any loss of profits,
        revenue, data, or goodwill. Our total aggregate liability for any claim
        relating to the Service will not exceed the greater of the amounts you
        paid to Leviio in the three (3) months before the event giving rise to
        the claim, or ₹5,000.
      </p>
    ),
  },
  {
    id: "indemnification",
    heading: "Indemnification",
    content: (
      <p>
        You agree to indemnify and hold harmless Leviio from any claims,
        damages, liabilities, and expenses (including reasonable legal fees)
        arising out of your Content, your use of the Service, your products or
        services sold through the Service, or your breach of these Terms or any
        law.
      </p>
    ),
  },
  {
    id: "termination",
    heading: "Termination",
    content: (
      <p>
        You may stop using the Service and close your account at any time. We may
        suspend or terminate your access if you breach these Terms, if required
        by law, or to protect the Service or other users. Upon termination, your
        right to use the Service ends; sections that by their nature should
        survive (such as IP, disclaimers, liability, and indemnity) will survive.
      </p>
    ),
  },
  {
    id: "governing-law",
    heading: "Governing Law & Dispute Resolution",
    content: (
      <p>
        These Terms are governed by the laws of India, without regard to
        conflict-of-laws rules. Subject to applicable law, the courts of Mumbai,
        Maharashtra, India will have exclusive jurisdiction over any dispute
        arising from or relating to these Terms or the Service. You agree to
        first attempt to resolve any dispute informally by contacting us.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to These Terms",
    content: (
      <p>
        We may update these Terms from time to time. If we make material
        changes, we will notify you (for example, by email or an in-app notice)
        and update the &ldquo;Last updated&rdquo; date above. Your continued use
        of the Service after changes take effect constitutes acceptance of the
        revised Terms.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact Us",
    content: (
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href="mailto:legal@leviio.com">legal@leviio.com</a> or via the
        support options in your dashboard.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Leviio. They explain the rules for using our platform as a creator or a client."
      updated="June 19, 2026"
      sections={sections}
    />
  );
}
