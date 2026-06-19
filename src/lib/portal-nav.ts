import {
  Calendar,
  Home,
  Library,
  type LucideIcon,
  MessageCircle,
  Utensils,
} from "lucide-react";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const portalNavItems: PortalNavItem[] = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/library", label: "My Library", icon: Library },
  { href: "/portal/plan", label: "My Plan", icon: Utensils },
  { href: "/portal/sessions", label: "Sessions", icon: Calendar },
  { href: "/portal/messages", label: "Messages", icon: MessageCircle },
];

export function portalPageTitle(pathname: string): string {
  const sorted = [...portalNavItems].sort(
    (a, b) => b.href.length - a.href.length
  );
  const match = sorted.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/")
  );
  return match?.label ?? "My Portal";
}
