"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Home,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type UserRole = "TENANT" | "OWNER" | "STAFF";

type CurrentUser = {
  name: string;
  role: UserRole;
};

type MobileNavigationProps = {
  open: boolean;
  onClose: () => void;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
  roles: UserRole[];
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
  open,
  onClose,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!cancelled && response.ok && result.success) {
          setUser(result.data);
        }
      } catch {
        // Authentication is handled by the protected APIs.
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const visibleItems = navigationItems.filter((item) =>
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

          {visibleItems.map((item) => {
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

        <div className="border-t border-zinc-200 p-4">
          <div className="rounded-xl bg-zinc-50 px-3 py-3">
            <p className="truncate text-sm font-semibold text-zinc-950">
              {user?.name || "Loading..."}
            </p>

            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {user?.role || "Account"}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}