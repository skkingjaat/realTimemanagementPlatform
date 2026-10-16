"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
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

type Role =
  | "TENANT"
  | "OWNER"
  | "STAFF";

type AmenityBooking = {
  id: string;
  amenityId: string;
  userId: string;
  bookingDate: string;
  checkInTime: string;
  checkOutTime: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Amenity = {
  id: string;
  propertyId: string;
  name: string;
  availabilityStatus:
    | "AVAILABLE"
    | "UNAVAILABLE";
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type BookingAction = {
  id: string;
  type: "check-in" | "check-out";
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

const TIME_OPTIONS = Array.from(
  { length: 29 },
  (_, index) => {
    const totalMinutes =
      8 * 60 + index * 30;

    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes =
      totalMinutes % 60;

    const value = `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(2, "0")}`;

    return {
      value,
      label: formatTimeSlot(
        hours,
        minutes
      ),
    };
  }
);

export default function AmenityBookingsPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [bookings, setBookings] =
    useState<AmenityBooking[]>([]);

  const [amenities, setAmenities] =
    useState<Amenity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [createOpen, setCreateOpen] =
    useState(false);

  const [createLoading, setCreateLoading] =
    useState(false);

  const [amenityId, setAmenityId] =
    useState("");

  const [bookingDate, setBookingDate] =
    useState("");

  const [checkInTime, setCheckInTime] =
    useState("");

  const [checkOutTime, setCheckOutTime] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [feedback, setFeedback] =
    useState<Feedback | null>(null);

  const [actionLoading, setActionLoading] =
    useState<BookingAction | null>(null);

  async function loadData(
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
        bookingsResponse,
        amenitiesResponse,
      ] = await Promise.all([
        fetch("/api/auth/me", {
          cache: "no-store",
        }),
        fetch("/api/amenity-bookings", {
          cache: "no-store",
        }),
        fetch("/api/amenities", {
          cache: "no-store",
        }),
      ]);

      const userResult =
        await userResponse.json();

      const bookingsResult =
        await bookingsResponse.json();

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
        !bookingsResponse.ok ||
        !bookingsResult.success
      ) {
        throw new Error(
          bookingsResult.message ||
            "Unable to load amenity bookings."
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
      setBookings(bookingsResult.data);
      setAmenities(amenitiesResult.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load amenity bookings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const amenityMap = useMemo(() => {
    return new Map(
      amenities.map((amenity) => [
        amenity.id,
        amenity,
      ])
    );
  }, [amenities]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return bookings;
    }

    return bookings.filter((booking) => {
      const amenity =
        amenityMap.get(booking.amenityId);

      const amenityName =
        amenity?.name ?? "";

      const propertyId =
        amenity?.propertyId ?? "";

      const status =
        getBookingStatus(booking).label;

      return (
        booking.id
          .toLowerCase()
          .includes(normalizedSearch) ||
        booking.amenityId
          .toLowerCase()
          .includes(normalizedSearch) ||
        amenityName
          .toLowerCase()
          .includes(normalizedSearch) ||
        propertyId
          .toLowerCase()
          .includes(normalizedSearch) ||
        status
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [
    amenityMap,
    bookings,
    search,
  ]);

  const summary = useMemo(
    () => ({
      total: bookings.length,

      checkedIn:
        bookings.filter(
          (booking) =>
            booking.checkedInAt !== null &&
            booking.checkedOutAt === null
        ).length,

      checkedOut:
        bookings.filter(
          (booking) =>
            booking.checkedOutAt !== null
        ).length,
    }),
    [bookings]
  );

  const availableAmenities =
    useMemo(() => {
      return amenities.filter(
        (amenity) =>
          amenity.availabilityStatus ===
          "AVAILABLE"
      );
    }, [amenities]);

  const availableCheckOutTimes =
    useMemo(() => {
      if (!checkInTime) {
        return TIME_OPTIONS;
      }

      return TIME_OPTIONS.filter(
        (option) =>
          option.value > checkInTime
      );
    }, [checkInTime]);

  function resetCreateForm() {
    setAmenityId("");
    setBookingDate("");
    setCheckInTime("");
    setCheckOutTime("");
    setFormError("");
  }

  function handleCreateDialogChange(
    open: boolean
  ) {
    setCreateOpen(open);

    if (
      !open &&
      !createLoading
    ) {
      resetCreateForm();
    }
  }

  function handleCheckInTimeChange(
    value: string
  ) {
    setCheckInTime(value);

    if (
      checkOutTime &&
      checkOutTime <= value
    ) {
      setCheckOutTime("");
    }

    if (formError) {
      setFormError("");
    }
  }

  async function handleCreateBooking(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setFeedback(null);

    if (!amenityId) {
      setFormError(
        "Please select an amenity."
      );
      return;
    }

    if (!bookingDate) {
      setFormError(
        "Booking date is required."
      );
      return;
    }

    if (!checkInTime) {
      setFormError(
        "Check-in time is required."
      );
      return;
    }

    if (!checkOutTime) {
      setFormError(
        "Check-out time is required."
      );
      return;
    }

    if (
      checkInTime >= checkOutTime
    ) {
      setFormError(
        "Check-out time must be later than check-in time."
      );
      return;
    }

    if (
      bookingDate < getTodayString()
    ) {
      setFormError(
        "Bookings cannot be created for a past date."
      );
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch(
        "/api/amenity-bookings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            amenityId,
            bookingDate,
            checkInTime,
            checkOutTime,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to create amenity booking."
        );
      }

      setFeedback({
        type: "success",
        message:
          "Amenity booked successfully.",
      });

      resetCreateForm();
      setCreateOpen(false);

      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create amenity booking."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleBookingAction(
    booking: AmenityBooking,
    type: "check-in" | "check-out"
  ) {
    setFeedback(null);

    setActionLoading({
      id: booking.id,
      type,
    });

    try {
      const response = await fetch(
        `/api/amenity-bookings/${booking.id}/${type}`,
        {
          method: "POST",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            `Unable to ${
              type === "check-in"
                ? "check in"
                : "check out"
            } booking.`
        );
      }

      setFeedback({
        type: "success",
        message:
          type === "check-in"
            ? "Booking checked in successfully."
            : "Booking checked out successfully.",
      });

      await loadData();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : `Unable to ${
                type === "check-in"
                  ? "check in"
                  : "check out"
              } booking.`,
      });
    } finally {
      setActionLoading(null);
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
            Loading amenity bookings
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Preparing your booking workspace.
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
                <CalendarDays className="h-3.5 w-3.5" />
                Amenity reservations
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Amenity Bookings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Book available amenities by
                date and time, then manage
                your check-in and check-out.
              </p>

              {currentUser && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">
                    {currentUser.name}
                  </span>

                  <span>•</span>

                  <span>
                    {formatRole(
                      currentUser.role
                    )}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => {
                setFeedback(null);
                setFormError("");
                setCreateOpen(true);
              }}
              disabled={
                availableAmenities.length === 0
              }
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
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
            {feedback.type ===
            "success" ? (
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
            label="Total bookings"
            value={summary.total}
            description="Your registered bookings"
            icon={CalendarDays}
          />

          <SummaryCard
            label="Checked in"
            value={summary.checkedIn}
            description="Currently active visits"
            icon={Clock3}
          />

          <SummaryCard
            label="Checked out"
            value={summary.checkedOut}
            description="Completed amenity visits"
            icon={CheckCircle2}
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
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search bookings..."
                className="h-10 pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                void loadData(true)
              }
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
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

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-zinc-950">
              Your bookings
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {filteredBookings.length}{" "}
              {filteredBookings.length === 1
                ? "booking"
                : "bookings"}{" "}
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
                      Unable to load bookings
                    </h3>

                    <p className="mt-1 text-sm text-red-700">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void loadData()
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
          ) : filteredBookings.length ===
            0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                <CalendarDays className="h-6 w-6 text-zinc-500" />
              </div>

              <h3 className="mt-5 text-sm font-semibold text-zinc-950">
                {search
                  ? "No bookings found"
                  : "No bookings yet"}
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                {search
                  ? "Try changing your search terms."
                  : "Create your first amenity booking when an amenity is available."}
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
                        Date
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Time
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Status
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBookings.map(
                      (booking) => {
                        const amenity =
                          amenityMap.get(
                            booking.amenityId
                          );

                        const status =
                          getBookingStatus(
                            booking
                          );

                        const isLoading =
                          actionLoading?.id ===
                          booking.id;

                        return (
                          <tr
                            key={booking.id}
                            className="border-b border-zinc-100 last:border-0"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                                  <Waves className="h-4 w-4 text-zinc-600" />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-zinc-950">
                                    {amenity?.name ??
                                      "Amenity"}
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-400">
                                    Property:{" "}
                                    {amenity?.propertyId ??
                                      "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-sm text-zinc-600">
                              {formatDate(
                                booking.bookingDate
                              )}
                            </td>

                            <td className="px-6 py-5 text-sm text-zinc-600">
                              {formatDateTime(
                                booking.checkInTime
                              )}{" "}
                              –{" "}
                              {formatDateTime(
                                booking.checkOutTime
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <StatusBadge
                                label={
                                  status.label
                                }
                                className={
                                  status.className
                                }
                              />
                            </td>

                            <td className="px-6 py-5 text-right">
                              {getActionType(
                                booking
                              ) ===
                              "check-in" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleBookingAction(
                                      booking,
                                      "check-in"
                                    )
                                  }
                                  disabled={
                                    isLoading
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isLoading && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  )}
                                  Check in
                                </button>
                              ) : getActionType(
                                  booking
                                ) ===
                                "check-out" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleBookingAction(
                                      booking,
                                      "check-out"
                                    )
                                  }
                                  disabled={
                                    isLoading
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isLoading && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  )}
                                  Check out
                                </button>
                              ) : (
                                <span className="text-xs font-medium text-zinc-400">
                                  Complete
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-zinc-100 md:hidden">
                {filteredBookings.map(
                  (booking) => {
                    const amenity =
                      amenityMap.get(
                        booking.amenityId
                      );

                    const status =
                      getBookingStatus(
                        booking
                      );

                    const action =
                      getActionType(
                        booking
                      );

                    const isLoading =
                      actionLoading?.id ===
                      booking.id;

                    return (
                      <div
                        key={booking.id}
                        className="p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                            <Waves className="h-4 w-4 text-zinc-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-zinc-950">
                                {amenity?.name ??
                                  "Amenity"}
                              </h3>

                              <StatusBadge
                                label={
                                  status.label
                                }
                                className={
                                  status.className
                                }
                              />
                            </div>

                            <div className="mt-4 space-y-2">
                              <InfoRow
                                label="Property"
                                value={
                                  amenity?.propertyId ??
                                  "Unknown"
                                }
                              />

                              <InfoRow
                                label="Date"
                                value={formatDate(
                                  booking.bookingDate
                                )}
                              />

                              <InfoRow
                                label="Time"
                                value={`${formatDateTime(
                                  booking.checkInTime
                                )} – ${formatDateTime(
                                  booking.checkOutTime
                                )}`}
                              />

                              <InfoRow
                                label="Booking ID"
                                value={booking.id}
                              />
                            </div>

                            {action ===
                              "check-in" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleBookingAction(
                                    booking,
                                    "check-in"
                                  )
                                }
                                disabled={
                                  isLoading
                                }
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isLoading && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )}
                                Check in
                              </button>
                            )}

                            {action ===
                              "check-out" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleBookingAction(
                                    booking,
                                    "check-out"
                                  )
                                }
                                disabled={
                                  isLoading
                                }
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isLoading && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )}
                                Check out
                              </button>
                            )}

                            {action ===
                              null && (
                              <p className="mt-4 text-center text-xs font-medium text-zinc-400">
                                Booking complete
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={
          handleCreateDialogChange
        }
      >
        <DialogContent className="sm:max-w-lg">
          <form
            onSubmit={handleCreateBooking}
          >
            <DialogHeader>
              <DialogTitle>
                Create amenity booking
              </DialogTitle>

              <DialogDescription>
                Select an available amenity,
                date, and non-overlapping
                time range.
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
                  htmlFor="booking-amenity"
                  className="text-sm font-medium text-zinc-900"
                >
                  Amenity
                </label>

                <select
                  id="booking-amenity"
                  value={amenityId}
                  onChange={(event) => {
                    setAmenityId(
                      event.target.value
                    );
                    setFormError("");
                  }}
                  disabled={
                    createLoading
                  }
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    Select an amenity
                  </option>

                  {availableAmenities.map(
                    (amenity) => (
                      <option
                        key={amenity.id}
                        value={amenity.id}
                      >
                        {amenity.name} —{" "}
                        {amenity.propertyId}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="booking-date"
                  className="text-sm font-medium text-zinc-900"
                >
                  Booking date
                </label>

                <Input
                  id="booking-date"
                  type="date"
                  value={bookingDate}
                  min={getTodayString()}
                  onChange={(event) => {
                    setBookingDate(
                      event.target.value
                    );
                    setFormError("");
                  }}
                  disabled={
                    createLoading
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="check-in-time"
                    className="text-sm font-medium text-zinc-900"
                  >
                    Check-in time
                  </label>

                  <select
                    id="check-in-time"
                    value={checkInTime}
                    onChange={(event) =>
                      handleCheckInTimeChange(
                        event.target.value
                      )
                    }
                    disabled={
                      createLoading
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      Select time
                    </option>

                    {TIME_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="check-out-time"
                    className="text-sm font-medium text-zinc-900"
                  >
                    Check-out time
                  </label>

                  <select
                    id="check-out-time"
                    value={checkOutTime}
                    onChange={(event) => {
                      setCheckOutTime(
                        event.target.value
                      );
                      setFormError("");
                    }}
                    disabled={
                      createLoading ||
                      !checkInTime
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      Select time
                    </option>

                    {availableCheckOutTimes.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />

                  <p className="text-xs leading-5 text-zinc-600">
                    Booking times are available
                    in 30-minute intervals from
                    8:00 AM to 10:00 PM. The
                    server will reject overlapping
                    bookings.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleCreateDialogChange(
                    false
                  )
                }
                disabled={
                  createLoading
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  createLoading ||
                  availableAmenities.length ===
                    0
                }
              >
                {createLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {createLoading
                  ? "Booking..."
                  : "Create booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
  icon: typeof CalendarDays;
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

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-zinc-400">
        {label}
      </span>

      <span className="max-w-[65%] truncate text-right text-xs font-medium text-zinc-600">
        {value}
      </span>
    </div>
  );
}

function getBookingStatus(
  booking: AmenityBooking
) {
  if (booking.checkedOutAt) {
    return {
      label: "Checked out",
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-600",
    };
  }

  if (booking.checkedInAt) {
    return {
      label: "Checked in",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Booked",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  };
}

function getActionType(
  booking: AmenityBooking
): "check-in" | "check-out" | null {
  if (
    !booking.checkedInAt &&
    !booking.checkedOutAt
  ) {
    return "check-in";
  }

  if (
    booking.checkedInAt &&
    !booking.checkedOutAt
  ) {
    return "check-out";
  }

  return null;
}

function formatRole(role: Role) {
  return (
    role.charAt(0) +
    role.slice(1).toLowerCase()
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function formatTimeSlot(
  hours: number,
  minutes: number
) {
  const period =
    hours >= 12 ? "PM" : "AM";

  const displayHour =
    hours % 12 || 12;

  return `${displayHour}:${String(
    minutes
  ).padStart(2, "0")} ${period}`;
}

function getTodayString() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}