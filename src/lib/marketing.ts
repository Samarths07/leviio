import {
  Apple,
  BarChart2,
  Calendar,
  Clock,
  Dumbbell,
  HeartPulse,
  Package,
  Store,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

/** "What is Leviio" — the three things the platform does. */
export const pillars = [
  {
    icon: Store,
    title: "Sell anything",
    desc: "Your own branded storefront for programs, PDFs, video courses, memberships and 1-on-1 coaching — with checkout built in.",
  },
  {
    icon: Users,
    title: "Manage every client",
    desc: "A real CRM for coaches: assign diet & workout plans, track body metrics and progress, take session notes, and message clients in their private portal.",
  },
  {
    icon: TrendingUp,
    title: "Grow with data",
    desc: "See revenue, top products, bookings and client retention at a glance — and make decisions that actually move your business.",
  },
];

/** "How Leviio helps you keep clients & grow." */
export const growthBenefits = [
  {
    icon: HeartPulse,
    title: "Keep clients engaged & coming back",
    desc: "Deliver personalized diet and training plans, chat in a private client portal, and track every client's progress — the things that keep people motivated and renewing month after month.",
  },
  {
    icon: Clock,
    title: "Save hours every week",
    desc: "Stop juggling a link-in-bio, a course host, spreadsheets, a scheduler and a payment app. Bookings, digital delivery, receipts and reminders all happen automatically in one place.",
  },
  {
    icon: TrendingUp,
    title: "Turn followers into revenue",
    desc: "Share one link, let your audience buy and book instantly, collect payments to your own account, and watch real-time analytics show you exactly what's working.",
  },
];

export const features = [
  {
    icon: Store,
    title: "Store Builder",
    desc: "Launch your branded store in minutes. Sell courses, PDFs, and programs.",
  },
  {
    icon: Package,
    title: "Product Manager",
    desc: "Upload and sell workout plans, meal guides, video courses, and merch.",
  },
  {
    icon: Users,
    title: "Client CRM",
    desc: "Track every client's progress, goals, body metrics, and purchase history.",
  },
  {
    icon: Target,
    title: "Coaching Hub",
    desc: "Manage 1-on-1 coaching packages, session notes, and check-ins.",
  },
  {
    icon: Apple,
    title: "Diet Planner",
    desc: "Build custom meal plans with macros, calories, and ingredient lists.",
  },
  {
    icon: Dumbbell,
    title: "Workout Builder",
    desc: "Design weekly training programs with sets, reps, rest, and video links.",
  },
  {
    icon: Calendar,
    title: "Booking Calendar",
    desc: "Let clients book sessions directly. Sync your availability.",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Real-time revenue, conversion, and client retention dashboards.",
  },
];

export const howItWorks = [
  {
    step: 1,
    title: "Sign up & customize your profile",
    desc: "Upload your photo, set your niche, and link your socials in minutes.",
  },
  {
    step: 2,
    title: "Create & upload your products",
    desc: "Add courses, PDFs, meal plans, and training programs to your store.",
  },
  {
    step: 3,
    title: "Share your store & grow",
    desc: "Get a shareable link, take bookings, and collect payments — all in one place.",
  },
];

export interface LandingTestimonial {
  name: string;
  handle: string;
  avatarSeed: string;
  quote: string;
  rating: number;
}

/**
 * Real customer testimonials for the homepage. Empty by default — the section
 * stays hidden until you add genuine reviews here (no fabricated ones).
 */
export const landingTestimonials: LandingTestimonial[] = [];
