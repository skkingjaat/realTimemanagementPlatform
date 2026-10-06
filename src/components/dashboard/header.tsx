"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "TENANT" | "OWNER" | "STAFF";
};

type HeaderProps = {
  onMenuClick?: () => void;
};

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
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
        // The dashboard itself handles authentication failures.
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const displayName = user?.name || "User";
  const roleLabel = user?.role || "Account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-950">
            Dashboard
          </p>

          <p className="hidden truncate text-xs text-zinc-500 sm:block">
            Property Management Platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-32 truncate text-sm font-medium text-zinc-950">
            {displayName}
          </p>

          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {roleLabel}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
          {initial}
        </div>

        <div className="hidden h-6 w-px bg-zinc-200 sm:block" />

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}