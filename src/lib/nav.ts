import {
  Apple,
  BarChart2,
  Calendar,
  Dumbbell,
  Home,
  type LucideIcon,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  Store,
  Target,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/store", label: "My Store", icon: Store },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/coaching", label: "Coaching", icon: Target },
  { href: "/dashboard/diet-planner", label: "Diet Planner", icon: Apple },
  { href: "/dashboard/workout-builder", label: "Workout Builder", icon: Dumbbell },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export const mobileNavItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
];

export function pageTitle(pathname: string): string {
  // exact or best-prefix match
  const sorted = [...navItems].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/")
  );
  return match?.label ?? "Dashboard";
}
