/**
 * Blog content for the marketing site. Posts are plain data so the index and
 * article pages can render them without an MDX/markdown dependency.
 */
export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /** ISO date */
  date: string;
  readMins: number;
  author: { name: string; role: string };
  /** image seed (rendered via lib/utils img()) */
  cover: string;
  body: BlogBlock[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "launch-your-fitness-storefront-in-a-weekend",
    title: "Launch your fitness storefront in a weekend",
    excerpt:
      "You don't need a developer or a month of free time. Here's a realistic, two-day plan to get your branded store live and taking payments.",
    category: "Getting Started",
    date: "2026-06-15",
    readMins: 6,
    author: { name: "The Leviio Team", role: "Creator success" },
    cover: "blog-storefront-launch",
    body: [
      {
        type: "p",
        text: "The biggest reason coaches delay going online isn't talent — it's the setup. Stitching together a website, a payment processor, a scheduling tool, and an email list feels like a second job. It doesn't have to be. With everything in one place, you can realistically go from zero to a live storefront in a single weekend.",
      },
      { type: "h2", text: "Saturday: set the foundation" },
      {
        type: "p",
        text: "Start with your profile and your store identity. Pick a clear name, write a two-line bio that says exactly who you help, and upload a real photo — people buy from people. Choose one accent color and stick with it.",
      },
      {
        type: "list",
        items: [
          "Add your display name, bio, and niche",
          "Upload a profile photo and pick your brand color",
          "Claim your storefront link (leviio.com/your-name)",
          "Connect payments so you can actually get paid",
        ],
      },
      { type: "h2", text: "Sunday: add your first three products" },
      {
        type: "p",
        text: "Don't build a catalog of twenty things. Launch with three: one low-priced digital product (a PDF or starter guide), one signature program, and one coaching offer. Three options is enough to give buyers a choice without overwhelming them.",
      },
      {
        type: "p",
        text: "Write each product description in terms of the outcome, not the contents. \"12 weeks to your first pull-up\" beats \"12-week PDF with 40 exercises.\" Add a price, hit publish, and your store is live.",
      },
      { type: "h2", text: "Monday morning: tell people" },
      {
        type: "p",
        text: "A storefront with no traffic sells nothing. Share the link in your Instagram bio, post it to your story, and message the five people who've already asked you for help. Your first sale almost always comes from someone who already knows you.",
      },
    ],
  },
  {
    slug: "pricing-your-online-coaching",
    title: "Pricing your online coaching: a simple framework",
    excerpt:
      "Underpricing is the most common mistake new coaches make. Use this three-step framework to set prices you can defend — and raise.",
    category: "Growth",
    date: "2026-06-10",
    readMins: 7,
    author: { name: "The Leviio Team", role: "Creator success" },
    cover: "blog-pricing",
    body: [
      {
        type: "p",
        text: "Pricing feels personal, so most coaches guess — and guess low. But your price is a signal. Set it too low and you attract clients who don't value the work and burn you out. Here's a framework that takes the emotion out of it.",
      },
      { type: "h2", text: "1. Start from your capacity, not your costs" },
      {
        type: "p",
        text: "Decide how many 1-on-1 clients you can genuinely serve well each month — most coaches cap out around 15–25. Then work backward from your income goal. If you want ₹1,00,000/month from coaching and can take 20 clients, each spot needs to average ₹5,000. That's your floor.",
      },
      { type: "h2", text: "2. Price the transformation, not the time" },
      {
        type: "p",
        text: "Clients don't pay for hours; they pay for results. A 12-week program that changes how someone feels in their body is worth far more than the sum of its check-ins. Anchor your price to the outcome and the time you save them.",
      },
      { type: "h2", text: "3. Build a ladder" },
      {
        type: "p",
        text: "Give people a way in at every level so you capture both the curious and the committed:",
      },
      {
        type: "list",
        items: [
          "Entry: a self-serve digital product (₹299–₹999)",
          "Core: a structured program or group plan (₹2,000–₹6,000)",
          "Premium: 1-on-1 coaching (₹5,000+/month)",
        ],
      },
      {
        type: "p",
        text: "Then raise prices as your calendar fills. When you're at 80% capacity, increase your next intake by 10–20%. Demand is the clearest permission slip you'll ever get.",
      },
    ],
  },
  {
    slug: "turn-one-time-buyers-into-recurring-clients",
    title: "5 ways to turn one-time buyers into recurring clients",
    excerpt:
      "Recurring revenue is what turns a side hustle into a business. Here are five practical ways to keep clients coming back.",
    category: "Retention",
    date: "2026-06-03",
    readMins: 5,
    author: { name: "The Leviio Team", role: "Creator success" },
    cover: "blog-retention",
    body: [
      {
        type: "p",
        text: "Acquiring a new client costs far more than keeping an existing one. Yet most creators pour everything into the sale and nothing into what happens after. These five moves quietly turn buyers into members.",
      },
      { type: "h2", text: "1. Make the first week unmissable" },
      {
        type: "p",
        text: "The first seven days decide whether someone sticks. Send a warm welcome, make sure they know exactly what to do first, and check in once. Early momentum is the strongest predictor of renewal.",
      },
      { type: "h2", text: "2. Offer a clear next step" },
      {
        type: "p",
        text: "When a program ends, don't leave clients at a dead end. Have the next plan ready — a continuation, an upgrade to 1-on-1, or a membership — and recommend it before they drift.",
      },
      { type: "h2", text: "3. Show progress they can feel" },
      {
        type: "p",
        text: "Track weigh-ins, measurements, and wins, and reflect them back. People renew when they can see the line going in the right direction — and when they credit you for it.",
      },
      { type: "h2", text: "4. Stay in the conversation" },
      {
        type: "p",
        text: "A two-way message thread keeps you present between sessions. A quick \"how did training go this week?\" does more for retention than any discount.",
      },
      { type: "h2", text: "5. Reward loyalty" },
      {
        type: "p",
        text: "Give returning clients something new clients don't get — priority booking, a members-only resource, or a loyalty price. Belonging is sticky.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
