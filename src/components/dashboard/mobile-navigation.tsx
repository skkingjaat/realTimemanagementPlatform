"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Home,
  Settings,
  Wrench,
  X,
} from "lucide-react";

import type { DashboardUser } from "@/app/dashboard/layout";

type MobileNavigationProps = {
  user: DashboardUser | null;
  open: boolean;
  onClose: () => void;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
  roles: DashboardUser["role"][];
};

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Home,
    roles: ["TENANT", "OWNER", "STAFF"],
  },
  {
    label: "Properties",
    href: "/dashboard/properties",
    icon: Building2,
    roles: ["OWNER"],
  },
  {
    label: "Maintenance",
    href: "/dashboard/maintenance",
    icon: Wrench,
    roles: ["TENANT", "OWNER", "STAFF"],
  },
  {
    label: "Amenities",
    href: "/dashboard/amenities",
    icon: ClipboardList,
    roles: ["TENANT", "OWNER", "STAFF"],
  },
  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarDays,
    roles: ["TENANT", "OWNER", "STAFF"],
  },
];

export function MobileNavigation({
  user,
  open,
  onClose,
}: MobileNavigationProps) {
  const pathname = usePathname();

  if (!open) {
    return null;
  }

  const visibleNavigationItems = navigationItems.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <aside className="relative flex h-full w-[min(85vw,320px)] flex-col border-r border-zinc-200 bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-950">
                PropertyOS
              </p>

              <p className="text-xs text-zinc-500">
                Management Platform
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Workspace
          </p>

          {visibleNavigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
              pathname.startsWith("/dashboard/settings")
                ? "bg-zinc-950 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <Settings
              className={`h-4.5 w-4.5 ${
                pathname.startsWith("/dashboard/settings")
                  ? "text-white"
                  : "text-zinc-500"
              }`}
            />

            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}