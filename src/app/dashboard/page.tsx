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
  Wrench,
} from "lucide-react";

type UserRole = "TENANT" | "OWNER" | "STAFF";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

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

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [maintenance, setMaintenance] =
    useState<MaintenanceOverview | null>(null);
  const [amenityUsage, setAmenityUsage] =
    useState<AmenityUsageOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefreshing = false) {
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

      const userResult = await userResponse.json();
      const maintenanceResult = await maintenanceResponse.json();
      const amenityResult = await amenityResponse.json();

      if (!userResponse.ok || !userResult.success) {
        throw new Error(
          userResult.message || "Authentication required."
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

      if (!amenityResponse.ok || !amenityResult.success) {
        throw new Error(
          amenityResult.message ||
            "Unable to load amenity overview."
        );
      }

      setUser(userResult.data);
      setMaintenance(maintenanceResult.data);
      setAmenityUsage(amenityResult.data);
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

  const maintenanceCompletionRate = useMemo(() => {
    if (!maintenance || maintenance.totalRequests === 0) {
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

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || "there";

  const roleDescription = getRoleDescription(user?.role);

  const quickActions = getQuickActions(user?.role);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
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
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <RefreshCw className="h-5 w-5" />
                </div>

                <h1 className="mt-4 text-lg font-semibold text-zinc-950">
                  Unable to load dashboard
                </h1>

                <p className="mt-1 max-w-xl text-sm text-zinc-500">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
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
        {/* Welcome */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />
                {user?.role || "Account"}
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Welcome back, {firstName}.
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                {roleDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Signed in as
                </p>

                <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {user?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Maintenance */}
        <section>
          <div className="my-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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
              value={maintenance?.totalRequests ?? 0}
              description="All accessible requests"
              icon={ClipboardList}
            />

            <MetricCard
              title="Pending"
              value={maintenance?.pendingRequests ?? 0}
              description="Waiting for action"
              icon={Clock3}
            />

            <MetricCard
              title="In progress"
              value={maintenance?.inProgressRequests ?? 0}
              description="Currently being handled"
              icon={Wrench}
            />

            <MetricCard
              title="Completed"
              value={maintenance?.completedRequests ?? 0}
              description="Successfully resolved"
              icon={CheckCircle2}
            />
          </div>
        </section>

        {/* Progress + quick actions */}
        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Resolution progress
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Completion status across accessible maintenance
                  requests.
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
                className="h-full rounded-full bg-zinc-950 transition-all"
                style={{
                  width: `${maintenanceCompletionRate}%`,
                }}
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <StatusSummary
                label="Pending"
                value={maintenance?.pendingRequests ?? 0}
              />

              <StatusSummary
                label="In progress"
                value={maintenance?.inProgressRequests ?? 0}
              />

              <StatusSummary
                label="Active"
                value={activeMaintenance}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Quick actions
            </p>

            <h2 className="mt-2 text-lg font-semibold">
              Your workspace
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Access the workflows available to your role.
            </p>

            <div className="mt-6 grid gap-2">
              {quickActions.map((action) => (
                <QuickAction
                  key={action.href}
                  href={action.href}
                  icon={action.icon}
                  label={action.label}
                />
              ))}
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
              value={amenityUsage?.totalBookings ?? 0}
              description="Accessible amenity bookings"
              icon={CalendarDays}
            />

            <MetricCard
              title="Checked in"
              value={amenityUsage?.checkedInBookings ?? 0}
              description="Recorded check-ins"
              icon={CheckCircle2}
            />

            <MetricCard
              title="Checked out"
              value={amenityUsage?.checkedOutBookings ?? 0}
              description="Completed amenity visits"
              icon={ClipboardList}
            />
          </div>
        </section>

        {/* Summary */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <Building2 className="h-5 w-5 text-zinc-700" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-950">
                  Centralized property operations
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                  Keep maintenance requests and amenity activity
                  visible from one responsive workspace.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/maintenance"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function getRoleDescription(role?: UserRole) {
  switch (role) {
    case "OWNER":
      return "Monitor your property operations, maintenance activity, amenities, and bookings from one centralized workspace.";

    case "STAFF":
      return "Manage maintenance workflows and monitor amenity activity from one centralized workspace.";

    case "TENANT":
      return "Track maintenance activity and manage your amenity bookings from one centralized workspace.";

    default:
      return "Monitor maintenance activity and amenity usage from one centralized workspace.";
  }
}

function getQuickActions(role?: UserRole) {
  const actions: Array<{
    href: string;
    icon: typeof Wrench;
    label: string;
  }> = [
    {
      href: "/dashboard/maintenance",
      icon: Wrench,
      label: "Manage maintenance",
    },
    {
      href: "/dashboard/amenities",
      icon: CalendarDays,
      label: "View amenities",
    },
  ];

  if (role === "OWNER") {
    actions.push({
      href: "/dashboard/properties",
      icon: Building2,
      label: "Manage properties",
    });
  }

  actions.push({
    href: "/dashboard/bookings",
    icon: ClipboardList,
    label: "View bookings",
  });

  return actions;
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
          <Icon className="h-4.5 w-4.5 text-zinc-700" />
        </div>

        <span className="text-xs font-medium text-zinc-400">
          Live
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