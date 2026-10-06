"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type MaintenanceStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

type UserRole = "TENANT" | "OWNER" | "STAFF";

type MaintenanceRequest = {
  id: string;
  propertyId: string;
  issueDescription: string;
  status: MaintenanceStatus;
  createdAt: string;
  resolutionDate: string | null;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [statusLoadingId, setStatusLoadingId] =
    useState<string | null>(null);

  const [completionRequest, setCompletionRequest] =
    useState<MaintenanceRequest | null>(null);

  const [completionLoading, setCompletionLoading] =
    useState(false);

  const canUpdateStatus =
    currentUser?.role === "OWNER" ||
    currentUser?.role === "STAFF";

  async function loadData(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [userResponse, requestsResponse] =
        await Promise.all([
          fetch("/api/auth/me", {
            cache: "no-store",
          }),
          fetch("/api/maintenance-requests", {
            cache: "no-store",
          }),
        ]);

      const userResult = await userResponse.json();
      const requestsResult = await requestsResponse.json();

      if (!userResponse.ok || !userResult.success) {
        throw new Error(
          userResult.message || "Authentication required."
        );
      }

      if (
        !requestsResponse.ok ||
        !requestsResult.success
      ) {
        throw new Error(
          requestsResult.message ||
            "Unable to load maintenance requests."
        );
      }

      setCurrentUser(userResult.data);
      setRequests(requestsResult.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load maintenance workspace."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return requests;
    }

    return requests.filter((request) => {
      return (
        request.issueDescription
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.propertyId
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.status
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [requests, search]);

  const summary = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter(
        (request) => request.status === "PENDING"
      ).length,
      inProgress: requests.filter(
        (request) => request.status === "IN_PROGRESS"
      ).length,
      completed: requests.filter(
        (request) => request.status === "COMPLETED"
      ).length,
    }),
    [requests]
  );

  function resetCreateForm() {
    setPropertyId("");
    setIssueDescription("");
    setFormError("");
  }

  function handleCreateDialogChange(open: boolean) {
    setCreateOpen(open);

    if (!open && !createLoading) {
      resetCreateForm();
    }
  }

  async function handleCreateRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setFeedback(null);

    const trimmedPropertyId = propertyId.trim();
    const trimmedIssueDescription =
      issueDescription.trim();

    if (!trimmedPropertyId) {
      setFormError("Property ID is required.");
      return;
    }

    if (!trimmedIssueDescription) {
      setFormError("Please describe the maintenance issue.");
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch(
        "/api/maintenance-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            propertyId: trimmedPropertyId,
            issueDescription: trimmedIssueDescription,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to create maintenance request."
        );
      }

      setFeedback({
        type: "success",
        message:
          "Maintenance request created successfully.",
      });

      resetCreateForm();
      setCreateOpen(false);

      await loadData(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create maintenance request."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function updateMaintenanceStatus(
    request: MaintenanceRequest,
    nextStatus: "IN_PROGRESS" | "COMPLETED"
  ) {
    if (statusLoadingId) {
      return;
    }

    setFeedback(null);
    setStatusLoadingId(request.id);

    try {
      const response = await fetch(
        `/api/maintenance-requests/${request.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update maintenance request status."
        );
      }

      setFeedback({
        type: "success",
        message:
          nextStatus === "IN_PROGRESS"
            ? "Maintenance request moved to in progress."
            : "Maintenance request marked as completed.",
      });

      await loadData(true);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update maintenance request status.",
      });
    } finally {
      setStatusLoadingId(null);
    }
  }

  function handleStartProgress(request: MaintenanceRequest) {
    void updateMaintenanceStatus(request, "IN_PROGRESS");
  }

  function handleRequestCompletion(
    request: MaintenanceRequest
  ) {
    if (statusLoadingId) {
      return;
    }

    setFeedback(null);
    setCompletionRequest(request);
  }

  async function handleConfirmCompletion() {
    if (!completionRequest) {
      return;
    }

    setCompletionLoading(true);

    try {
      await updateMaintenanceStatus(
        completionRequest,
        "COMPLETED"
      );

      setCompletionRequest(null);
    } finally {
      setCompletionLoading(false);
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
            Loading maintenance
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Preparing your maintenance workspace.
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
                <Wrench className="h-3.5 w-3.5" />
                Maintenance management
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Maintenance
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Track maintenance requests and monitor their
                current status from one centralized workspace.
              </p>

              {currentUser && (
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {currentUser.name} · {currentUser.role}
                </p>
              )}
            </div>

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
              New Request
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total requests"
            value={summary.total}
            description="Accessible maintenance requests"
            icon={ClipboardList}
          />

          <SummaryCard
            label="Pending"
            value={summary.pending}
            description="Waiting for action"
            icon={Clock3}
          />

          <SummaryCard
            label="In progress"
            value={summary.inProgress}
            description="Currently being handled"
            icon={Wrench}
            dark
          />

          <SummaryCard
            label="Completed"
            value={summary.completed}
            description="Successfully resolved"
            icon={CheckCircle2}
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
                placeholder="Search by issue, property ID, or status..."
                className="h-10 pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadData(true)}
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
              Maintenance requests
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {filteredRequests.length}{" "}
              {filteredRequests.length === 1
                ? "request"
                : "requests"}{" "}
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
                      Unable to load maintenance requests
                    </h3>

                    <p className="mt-1 text-sm text-red-700">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() => void loadData()}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                <Wrench className="h-6 w-6 text-zinc-500" />
              </div>

              <h3 className="mt-5 text-sm font-semibold text-zinc-950">
                {search
                  ? "No maintenance requests found"
                  : "No maintenance requests yet"}
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                {search
                  ? "Try changing your search terms."
                  : "Maintenance requests will appear here once they are created."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Issue
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Property
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Created
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Status
                      </th>

                      {canUpdateStatus && (
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                              <Wrench className="h-4 w-4 text-zinc-600" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-md text-sm font-semibold text-zinc-950">
                                {request.issueDescription}
                              </p>

                              <p className="mt-1 text-xs text-zinc-400">
                                Request ID: {request.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-zinc-700">
                            Property
                          </p>

                          <p className="mt-1 text-xs text-zinc-400">
                            ID: {request.propertyId}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-sm text-zinc-500">
                          {formatDate(request.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge status={request.status} />

                          {request.resolutionDate && (
                            <p className="mt-2 text-xs text-zinc-400">
                              Resolved{" "}
                              {formatDate(
                                request.resolutionDate
                              )}
                            </p>
                          )}
                        </td>

                        {canUpdateStatus && (
                          <td className="px-6 py-5 text-right">
                            <StatusAction
                              request={request}
                              loading={
                                statusLoadingId === request.id
                              }
                              onStartProgress={
                                handleStartProgress
                              }
                              onComplete={
                                handleRequestCompletion
                              }
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-zinc-100 md:hidden">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                        <Wrench className="h-4 w-4 text-zinc-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-zinc-950">
                            Maintenance request
                          </h3>

                          <StatusBadge status={request.status} />
                        </div>

                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          {request.issueDescription}
                        </p>

                        <div className="mt-4 space-y-1.5">
                          <p className="text-xs text-zinc-400">
                            Property ID:{" "}
                            <span className="text-zinc-600">
                              {request.propertyId}
                            </span>
                          </p>

                          <p className="text-xs text-zinc-400">
                            Created{" "}
                            <span className="text-zinc-600">
                              {formatDate(request.createdAt)}
                            </span>
                          </p>

                          {request.resolutionDate && (
                            <p className="text-xs text-zinc-400">
                              Resolved{" "}
                              <span className="text-zinc-600">
                                {formatDate(
                                  request.resolutionDate
                                )}
                              </span>
                            </p>
                          )}
                        </div>

                        {canUpdateStatus && (
                          <div className="mt-4">
                            <StatusAction
                              request={request}
                              loading={
                                statusLoadingId === request.id
                              }
                              onStartProgress={
                                handleStartProgress
                              }
                              onComplete={
                                handleRequestCompletion
                              }
                              fullWidth
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={handleCreateDialogChange}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateRequest}>
            <DialogHeader>
              <DialogTitle>
                Create maintenance request
              </DialogTitle>

              <DialogDescription>
                Submit a maintenance issue for an existing
                property.
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
                  htmlFor="propertyId"
                  className="text-sm font-medium text-zinc-900"
                >
                  Property ID
                </label>

                <Input
                  id="propertyId"
                  value={propertyId}
                  onChange={(event) =>
                    setPropertyId(event.target.value)
                  }
                  placeholder="Enter property ID"
                  disabled={createLoading}
                  autoComplete="off"
                />

                <p className="text-xs leading-5 text-zinc-500">
                  Enter the ID of an existing property.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="issueDescription"
                  className="text-sm font-medium text-zinc-900"
                >
                  Issue description
                </label>

                <Textarea
                  id="issueDescription"
                  value={issueDescription}
                  onChange={(event) =>
                    setIssueDescription(event.target.value)
                  }
                  placeholder="Describe the maintenance issue..."
                  rows={5}
                  disabled={createLoading}
                />
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
                  ? "Submitting..."
                  : "Submit request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(completionRequest)}
        onOpenChange={(open) => {
          if (!open && !completionLoading) {
            setCompletionRequest(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark maintenance request as completed?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will mark the request as completed and
              record the current date as its resolution date.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {completionRequest && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-medium text-zinc-500">
                Issue
              </p>

              <p className="mt-1 text-sm font-medium leading-5 text-zinc-900">
                {completionRequest.issueDescription}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={completionLoading}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmCompletion();
              }}
              disabled={completionLoading}
            >
              {completionLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {completionLoading
                ? "Completing..."
                : "Mark completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusAction({
  request,
  loading,
  onStartProgress,
  onComplete,
  fullWidth = false,
}: {
  request: MaintenanceRequest;
  loading: boolean;
  onStartProgress: (request: MaintenanceRequest) => void;
  onComplete: (request: MaintenanceRequest) => void;
  fullWidth?: boolean;
}) {
  if (request.status === "COMPLETED") {
    return (
      <span className="text-xs font-medium text-zinc-400">
        No action required
      </span>
    );
  }

  if (request.status === "PENDING") {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => onStartProgress(request)}
        disabled={loading}
        className={fullWidth ? "w-full" : ""}
      >
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        )}

        {loading ? "Updating..." : "Start progress"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={() => onComplete(request)}
      disabled={loading}
      className={fullWidth ? "w-full" : ""}
    >
      {loading && (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      )}

      {loading ? "Updating..." : "Mark completed"}
    </Button>
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
  icon: typeof ClipboardList;
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
            dark ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {label}
        </p>

        <Icon
          className={`h-5 w-5 ${
            dark ? "text-zinc-500" : "text-zinc-400"
          }`}
        />
      </div>

      <p
        className={`mt-3 text-3xl font-semibold tracking-tight ${
          dark ? "text-white" : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-xs ${
          dark ? "text-zinc-400" : "text-zinc-400"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: MaintenanceStatus;
}) {
  const statusConfig = {
    PENDING: {
      label: "Pending",
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-700",
    },
    IN_PROGRESS: {
      label: "In progress",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },
    COMPLETED: {
      label: "Completed",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  } satisfies Record<
    MaintenanceStatus,
    {
      label: string;
      className: string;
    }
  >;

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}