"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "TENANT" | "OWNER" | "STAFF";
  createdAt?: string;
  updatedAt?: string;
};

const roleDescriptions: Record<CurrentUser["role"], string> = {
  TENANT:
    "You can manage your maintenance requests, view amenities, and manage your amenity bookings.",
  OWNER:
    "You can manage properties, maintenance operations, amenities, and amenity bookings.",
  STAFF:
    "You can manage maintenance operations, amenities, and amenity bookings.",
};

export default function SettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUser() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Unable to retrieve account information."
        );
      }

      setUser(result.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to retrieve account information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, []);

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="min-h-full bg-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            View your account information and access permissions.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading account information...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-900">
              Unable to load account
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadUser()}
              className="mt-4 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Try again
            </button>
          </div>
        ) : user ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-zinc-950">
                        {user.name}
                      </h2>

                      <p className="truncate text-sm text-zinc-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {user.role}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                      <User className="h-4 w-4 text-zinc-700" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Full name
                      </p>

                      <p className="mt-1 text-sm font-medium text-zinc-950">
                        {user.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                      <Mail className="h-4 w-4 text-zinc-700" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Email address
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-zinc-950">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 p-4 sm:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <ShieldCheck className="h-4 w-4 text-zinc-700" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Access level
                      </p>

                      <p className="mt-1 text-sm font-semibold text-zinc-950">
                        {user.role}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        {roleDescriptions[user.role]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Account security
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Your account is protected by the platform authentication
                    system. Passwords are securely stored and authenticated
                    sessions use an HTTP-only authentication cookie.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}