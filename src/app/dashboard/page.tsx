"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCw,
  UserRound,
  Wrench,
} from "lucide-react";

type Role = "TENANT" | "OWNER" | "STAFF";

type MaintenanceOverview = {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
};

type AmenityUsageOverview = {
  totalBookings: number;
  checkedInBookings: number;
  checkedOutBookings: number;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [maintenance, setMaintenance] =
    useState<MaintenanceOverview | null>(null);

  const [amenityUsage, setAmenityUsage] =
    useState<AmenityUsageOverview | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadDashboard(
    showRefreshing = false
  ) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        userResponse,
        maintenanceResponse,
        amenityResponse,
      ] = await Promise.all([
        fetch("/api/auth/me", {
          cache: "no-store",
        }),
        fetch("/api/dashboard/maintenance", {
          cache: "no-store",
        }),
        fetch("/api/dashboard/amenities", {
          cache: "no-store",
        }),
      ]);

      const userResult =
        await userResponse.json();

      const maintenanceResult =
        await maintenanceResponse.json();

      const amenityResult =
        await amenityResponse.json();

      if (
        !userResponse.ok ||
        !userResult.success
      ) {
        throw new Error(
          userResult.message ||
            "Authentication required."
        );
      }

      if (
        !maintenanceResponse.ok ||
        !maintenanceResult.success
      ) {
        throw new Error(
          maintenanceResult.message ||
            "Unable to load maintenance overview."
        );
      }

      if (
        !amenityResponse.ok ||
        !amenityResult.success
      ) {
        throw new Error(
          amenityResult.message ||
            "Unable to load amenity overview."
        );
      }

      setUser(userResult.data);
      setMaintenance(
        maintenanceResult.data
      );
      setAmenityUsage(
        amenityResult.data
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const maintenanceCompletionRate =
    useMemo(() => {
      if (
        !maintenance ||
        maintenance.totalRequests === 0
      ) {
        return 0;
      }

      return Math.round(
        (maintenance.completedRequests /
          maintenance.totalRequests) *
          100
      );
    }, [maintenance]);

  const activeMaintenance =
    (maintenance?.pendingRequests ?? 0) +
    (maintenance?.inProgressRequests ?? 0);

  const roleLabel = user
    ? formatRole(user.role)
    : "User";

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
          </div>

          <h1 className="mt-4 text-sm font-semibold text-zinc-950">
            Loading your dashboard
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Preparing your property management overview.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <RefreshCw className="h-5 w-5" />
                </div>

                <h1 className="mt-4 text-lg font-semibold text-zinc-950">
                  Unable to load dashboard
                </h1>

                <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadDashboard(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />
                Property operations
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Welcome back,{" "}
                {user?.name || "User"}.
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Monitor maintenance activity,
                amenities, and bookings from
                your centralized workspace.
              </p>

              {user && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700">
                    <UserRound className="h-3.5 w-3.5" />
                    {user.name}
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {roleLabel}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              disabled={refreshing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </section>

        {/* Maintenance */}
        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Maintenance
              </p>

              <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
                Maintenance overview
              </h2>
            </div>

            <Link
              href="/dashboard/maintenance"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
            >
              View requests
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total requests"
              value={
                maintenance?.totalRequests ??
                0
              }
              description="Recorded requests"
              icon={ClipboardList}
            />

            <MetricCard
              title="Pending"
              value={
                maintenance?.pendingRequests ??
                0
              }
              description="Waiting for action"
              icon={Clock3}
            />

            <MetricCard
              title="In progress"
              value={
                maintenance?.inProgressRequests ??
                0
              }
              description="Currently being handled"
              icon={Wrench}
            />

            <MetricCard
              title="Completed"
              value={
                maintenance?.completedRequests ??
                0
              }
              description="Successfully resolved"
              icon={CheckCircle2}
            />
          </div>
        </section>

        {/* Maintenance progress + quick actions */}
        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Resolution progress
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Current completion rate across
                  available maintenance requests.
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-semibold tracking-tight text-zinc-950">
                  {maintenanceCompletionRate}%
                </p>

                <p className="text-xs text-zinc-500">
                  completed
                </p>
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-950 transition-all duration-500"
                style={{
                  width: `${maintenanceCompletionRate}%`,
                }}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatusSummary
                label="Pending"
                value={
                  maintenance?.pendingRequests ??
                  0
                }
              />

              <StatusSummary
                label="In progress"
                value={
                  maintenance?.inProgressRequests ??
                  0
                }
              />

              <StatusSummary
                label="Active"
                value={activeMaintenance}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-950 bg-zinc-950 p-5 text-white shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Quick actions
            </p>

            <h2 className="mt-2 text-lg font-semibold">
              Manage your operations
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Jump directly into the workflows
              available to your account.
            </p>

            <div className="mt-6 grid gap-2">
              <QuickAction
                href="/dashboard/maintenance"
                icon={Wrench}
                label="Manage maintenance"
              />

              <QuickAction
                href="/dashboard/amenities"
                icon={Building2}
                label="View amenities"
              />

              <QuickAction
                href="/dashboard/bookings"
                icon={CalendarDays}
                label="Manage bookings"
              />

              {user?.role === "OWNER" && (
                <QuickAction
                  href="/dashboard/properties"
                  icon={Building2}
                  label="Manage properties"
                />
              )}
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Amenities
              </p>

              <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
                Amenity usage overview
              </h2>
            </div>

            <Link
              href="/dashboard/bookings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
            >
              View bookings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Total bookings"
              value={
                amenityUsage?.totalBookings ??
                0
              }
              description="Available booking records"
              icon={CalendarDays}
            />

            <MetricCard
              title="Checked in"
              value={
                amenityUsage?.checkedInBookings ??
                0
              }
              description="Active amenity visits"
              icon={CheckCircle2}
            />

            <MetricCard
              title="Checked out"
              value={
                amenityUsage?.checkedOutBookings ??
                0
              }
              description="Completed amenity visits"
              icon={ClipboardList}
            />
          </div>
        </section>

        {/* Account summary */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <UserRound className="h-5 w-5 text-zinc-700" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-950">
                  Account overview
                </h2>

                <p className="mt-1 truncate text-sm text-zinc-500">
                  {user?.email}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Signed in as{" "}
                  <span className="font-medium text-zinc-600">
                    {roleLabel}
                  </span>
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/settings"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Account settings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof ClipboardList;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
          <Icon className="h-[18px] w-[18px] text-zinc-700" />
        </div>

        <span className="text-xs font-medium text-zinc-400">
          Current
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function StatusSummary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Wrench;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 transition hover:border-zinc-600 hover:bg-zinc-900"
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        <Icon className="h-4 w-4 text-zinc-400 transition group-hover:text-white" />
        {label}
      </span>

      <ArrowRight className="h-4 w-4 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
    </Link>
  );
}

function formatRole(role: Role) {
  return (
    role.charAt(0) +
    role.slice(1).toLowerCase()
  );
}