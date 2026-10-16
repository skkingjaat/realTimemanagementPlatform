"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Role = "TENANT" | "OWNER" | "STAFF";

type AmenityAvailabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE";

type Amenity = {
  id: string;
  propertyId: string;
  name: string;
  availabilityStatus: AmenityAvailabilityStatus;
  createdAt: string;
  updatedAt: string;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

export default function AmenitiesPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [amenities, setAmenities] = useState<Amenity[]>(
    []
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [feedback, setFeedback] =
    useState<Feedback | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [name, setName] = useState("");

  const [createLoading, setCreateLoading] =
    useState(false);

  const [updatingId, setUpdatingId] = useState<
    string | null
  >(null);

  const [formError, setFormError] = useState("");

  const canManage =
    currentUser?.role === "OWNER" ||
    currentUser?.role === "STAFF";

  async function loadAmenities(
    showRefreshing = false
  ) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [userResponse, amenitiesResponse] =
        await Promise.all([
          fetch("/api/auth/me", {
            cache: "no-store",
          }),
          fetch("/api/amenities", {
            cache: "no-store",
          }),
        ]);

      const userResult = await userResponse.json();
      const amenitiesResult =
        await amenitiesResponse.json();

      if (
        !userResponse.ok ||
        !userResult.success
      ) {
        throw new Error(
          userResult.message ||
            "Unable to retrieve your account."
        );
      }

      if (
        !amenitiesResponse.ok ||
        !amenitiesResult.success
      ) {
        throw new Error(
          amenitiesResult.message ||
            "Unable to load amenities."
        );
      }

      setCurrentUser(userResult.data);
      setAmenities(amenitiesResult.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load amenities."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAmenities();
  }, []);

  const filteredAmenities = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return amenities;
    }

    return amenities.filter((amenity) => {
      return (
        amenity.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        amenity.propertyId
          .toLowerCase()
          .includes(normalizedSearch) ||
        amenity.availabilityStatus
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [amenities, search]);

  const summary = useMemo(
    () => ({
      total: amenities.length,
      available: amenities.filter(
        (amenity) =>
          amenity.availabilityStatus === "AVAILABLE"
      ).length,
      unavailable: amenities.filter(
        (amenity) =>
          amenity.availabilityStatus === "UNAVAILABLE"
      ).length,
    }),
    [amenities]
  );

  function resetCreateForm() {
    setPropertyId("");
    setName("");
    setFormError("");
  }

  function handleCreateDialogChange(open: boolean) {
    setCreateOpen(open);

    if (!open && !createLoading) {
      resetCreateForm();
    }
  }

  async function handleCreateAmenity(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setFeedback(null);

    const trimmedPropertyId = propertyId.trim();
    const trimmedName = name.trim();

    if (!trimmedPropertyId) {
      setFormError("Property ID is required.");
      return;
    }

    if (!trimmedName) {
      setFormError("Amenity name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setFormError(
        "Amenity name must be at least 2 characters long."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setFormError(
        "Amenity name must not exceed 100 characters."
      );
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch("/api/amenities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: trimmedPropertyId,
          name: trimmedName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to create amenity."
        );
      }

      setFeedback({
        type: "success",
        message: "Amenity created successfully.",
      });

      resetCreateForm();
      setCreateOpen(false);

      await loadAmenities();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create amenity."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function toggleAvailability(
    amenity: Amenity
  ) {
    if (!canManage) {
      return;
    }

    setFeedback(null);
    setUpdatingId(amenity.id);

    const nextStatus =
      amenity.availabilityStatus === "AVAILABLE"
        ? "UNAVAILABLE"
        : "AVAILABLE";

    try {
      const response = await fetch(
        `/api/amenities/${amenity.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            availabilityStatus: nextStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update amenity availability."
        );
      }

      setAmenities((current) =>
        current.map((item) =>
          item.id === amenity.id
            ? {
                ...item,
                availabilityStatus: nextStatus,
                updatedAt:
                  result.data?.updatedAt ??
                  item.updatedAt,
              }
            : item
        )
      );

      setFeedback({
        type: "success",
        message: `${amenity.name} is now ${
          nextStatus === "AVAILABLE"
            ? "available"
            : "unavailable"
        }.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update amenity availability.",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
          </div>

          <h1 className="mt-4 text-sm font-semibold text-zinc-950">
            Loading amenities
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Preparing your amenity workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                <Waves className="h-3.5 w-3.5" />
                Amenity management
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Amenities
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                {currentUser?.role === "TENANT"
                  ? "View available property amenities and their current availability."
                  : "Manage property amenities and control their current availability."}
              </p>

              {currentUser && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">
                    {currentUser.name}
                  </span>

                  <span>•</span>

                  <span>
                    {formatRole(currentUser.role)}
                  </span>
                </div>
              )}
            </div>

            {canManage && (
              <Button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setFormError("");
                  setCreateOpen(true);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                New Amenity
              </Button>
            )}
          </div>
        </section>

        {feedback && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              feedback.type === "success"
                ? "border-zinc-200 bg-white text-zinc-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <p className="text-sm font-medium">
              {feedback.message}
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total amenities"
            value={summary.total}
            description="Amenities in your current scope"
            icon={Waves}
          />

          <SummaryCard
            label="Available"
            value={summary.available}
            description="Currently available"
            icon={CheckCircle2}
          />

          <SummaryCard
            label="Unavailable"
            value={summary.unavailable}
            description="Currently unavailable"
            icon={AlertCircle}
            dark
          />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by amenity, property ID, or status..."
                className="h-10 pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                void loadAmenities(true)
              }
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-zinc-950">
              Amenities
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {filteredAmenities.length}{" "}
              {filteredAmenities.length === 1
                ? "amenity"
                : "amenities"}{" "}
              displayed
            </p>
          </div>

          {error ? (
            <div className="p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <div>
                    <h3 className="text-sm font-semibold text-red-900">
                      Unable to load amenities
                    </h3>

                    <p className="mt-1 text-sm text-red-700">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void loadAmenities()
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredAmenities.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                <Waves className="h-6 w-6 text-zinc-500" />
              </div>

              <h3 className="mt-5 text-sm font-semibold text-zinc-950">
                {search
                  ? "No amenities found"
                  : "No amenities yet"}
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                {search
                  ? "Try changing your search terms."
                  : canManage
                    ? "Create an amenity to start managing your property facilities."
                    : "No amenities are currently available in your view."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Amenity
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Property
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Created
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Availability
                      </th>

                      {canManage && (
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAmenities.map(
                      (amenity) => (
                        <tr
                          key={amenity.id}
                          className="border-b border-zinc-100 last:border-0"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                                <Waves className="h-4 w-4 text-zinc-600" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-950">
                                  {amenity.name}
                                </p>

                                <p className="mt-1 text-xs text-zinc-400">
                                  ID: {amenity.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="text-sm font-medium text-zinc-700">
                              Property
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              ID: {amenity.propertyId}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-sm text-zinc-500">
                            {formatDate(
                              amenity.createdAt
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <AvailabilityBadge
                              status={
                                amenity.availabilityStatus
                              }
                            />
                          </td>

                          {canManage && (
                            <td className="px-6 py-5 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleAvailability(
                                    amenity
                                  )
                                }
                                disabled={
                                  updatingId ===
                                  amenity.id
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updatingId ===
                                  amenity.id && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )}

                                {amenity.availabilityStatus ===
                                "AVAILABLE"
                                  ? "Mark unavailable"
                                  : "Mark available"}
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-zinc-100 md:hidden">
                {filteredAmenities.map(
                  (amenity) => (
                    <div
                      key={amenity.id}
                      className="p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                          <Waves className="h-4 w-4 text-zinc-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-zinc-950">
                              {amenity.name}
                            </h3>

                            <AvailabilityBadge
                              status={
                                amenity.availabilityStatus
                              }
                            />
                          </div>

                          <div className="mt-4 space-y-1.5">
                            <p className="text-xs text-zinc-400">
                              Property ID:{" "}
                              <span className="text-zinc-600">
                                {amenity.propertyId}
                              </span>
                            </p>

                            <p className="text-xs text-zinc-400">
                              Created{" "}
                              <span className="text-zinc-600">
                                {formatDate(
                                  amenity.createdAt
                                )}
                              </span>
                            </p>

                            <p className="text-xs text-zinc-400">
                              Amenity ID:{" "}
                              <span className="text-zinc-600">
                                {amenity.id}
                              </span>
                            </p>
                          </div>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                void toggleAvailability(
                                  amenity
                                )
                              }
                              disabled={
                                updatingId ===
                                amenity.id
                              }
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingId ===
                                amenity.id && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              )}

                              {amenity.availabilityStatus ===
                              "AVAILABLE"
                                ? "Mark unavailable"
                                : "Mark available"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {canManage && (
        <Dialog
          open={createOpen}
          onOpenChange={handleCreateDialogChange}
        >
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateAmenity}>
              <DialogHeader>
                <DialogTitle>
                  Create amenity
                </DialogTitle>

                <DialogDescription>
                  Add an amenity to one of your existing
                  properties.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {formError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    <p>{formError}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="amenity-property-id"
                    className="text-sm font-medium text-zinc-900"
                  >
                    Property ID
                  </label>

                  <Input
                    id="amenity-property-id"
                    value={propertyId}
                    onChange={(event) =>
                      setPropertyId(
                        event.target.value
                      )
                    }
                    placeholder="Enter property ID"
                    disabled={createLoading}
                    autoComplete="off"
                  />

                  <p className="text-xs leading-5 text-zinc-500">
                    Enter the ID of the property where
                    this amenity belongs.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="amenity-name"
                    className="text-sm font-medium text-zinc-900"
                  >
                    Amenity name
                  </label>

                  <Input
                    id="amenity-name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="e.g. Swimming Pool"
                    disabled={createLoading}
                    maxLength={100}
                  />

                  <p className="text-xs leading-5 text-zinc-500">
                    Use between 2 and 100 characters.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    handleCreateDialogChange(false)
                  }
                  disabled={createLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={createLoading}
                >
                  {createLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {createLoading
                    ? "Creating..."
                    : "Create amenity"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  dark = false,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Waves;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        dark
          ? "border-zinc-950 bg-zinc-950 text-white"
          : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-sm font-medium ${
            dark
              ? "text-zinc-400"
              : "text-zinc-500"
          }`}
        >
          {label}
        </p>

        <Icon
          className={`h-5 w-5 ${
            dark
              ? "text-zinc-500"
              : "text-zinc-400"
          }`}
        />
      </div>

      <p
        className={`mt-3 text-3xl font-semibold tracking-tight ${
          dark
            ? "text-white"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-xs ${
          dark
            ? "text-zinc-400"
            : "text-zinc-400"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function AvailabilityBadge({
  status,
}: {
  status: AmenityAvailabilityStatus;
}) {
  const config = {
    AVAILABLE: {
      label: "Available",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    UNAVAILABLE: {
      label: "Unavailable",
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-600",
    },
  } satisfies Record<
    AmenityAvailabilityStatus,
    {
      label: string;
      className: string;
    }
  >;

  const current = config[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function formatRole(role: Role) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}