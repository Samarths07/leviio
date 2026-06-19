"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/topnav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DemoBanner } from "@/components/layout/demo-banner";
import { useApp } from "@/lib/store";
import { pageTitle } from "@/lib/nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  // close drawer on route change
  useEffect(() => setDrawerOpen(false), [pathname]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <MobileSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="lg:pl-60">
        <TopNav title={pageTitle(pathname)} onMenuClick={() => setDrawerOpen(true)} />
        {user.isDemo && <DemoBanner />}
        <main className="px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <MobileNav onMore={() => setDrawerOpen(true)} />
    </div>
  );
}
