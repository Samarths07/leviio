import {
  Apple,
  BarChart2,
  Calendar,
  Dumbbell,
  Package,
  Store,
  Target,
  Users,
} from "lucide-react";

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
