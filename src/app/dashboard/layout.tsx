"use client";

import { ReactNode, useEffect, useState } from "react";

import { Header } from "@/components/dashboard/header";
import { MobileNavigation } from "@/components/dashboard/mobile-navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: "TENANT" | "OWNER" | "STAFF";
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileNavigationOpen, setMobileNavigationOpen] =
    useState(false);

  const [user, setUser] = useState<DashboardUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        if (!cancelled && result.success && result.data) {
          setUser(result.data);
        }
      } catch {
        // Individual dashboard pages handle authentication failures.
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="flex min-h-screen">
        <Sidebar user={user} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            user={user}
            onMenuClick={() => setMobileNavigationOpen(true)}
          />

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <MobileNavigation
        user={user}
        open={mobileNavigationOpen}
        onClose={() => setMobileNavigationOpen(false)}
      />
    </div>
  );
}