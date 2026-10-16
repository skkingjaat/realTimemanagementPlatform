"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type UserRole = "TENANT" | "OWNER" | "STAFF";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type Property = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

type FormMode = "create" | "edit";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export default function PropertiesPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] =
    useState<FormMode>("create");
  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] =
    useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  async function loadProperties(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [userResponse, propertiesResponse] =
        await Promise.all([
          fetch("/api/auth/me", {
            cache: "no-store",
          }),
          fetch("/api/properties", {
            cache: "no-store",
          }),
        ]);

      const userResult = await userResponse.json();
      const propertiesResult =
        await propertiesResponse.json();

      if (!userResponse.ok || !userResult.success) {
        throw new Error(
          userResult.message || "Authentication required."
        );
      }

      if (userResult.data.role !== "OWNER") {
        setCurrentUser(userResult.data);
        setProperties([]);
        return;
      }

      if (
        !propertiesResponse.ok ||
        !propertiesResult.success
      ) {
        throw new Error(
          propertiesResult.message ||
            "Unable to load properties."
        );
      }

      setCurrentUser(userResult.data);
      setProperties(propertiesResult.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load properties."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return properties;
    }

    return properties.filter((property) => {
      return (
        property.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        property.address
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [properties, search]);

  function resetForm() {
    setName("");
    setAddress("");
    setSelectedProperty(null);
  }

  function openCreateDialog() {
    resetForm();
    setFormMode("create");
    setFeedback(null);
    setFormOpen(true);
  }

  function openEditDialog(property: Property) {
    setFormMode("edit");
    setSelectedProperty(property);
    setName(property.name);
    setAddress(property.address);
    setFeedback(null);
    setFormOpen(true);
  }

  function openDeleteDialog(property: Property) {
    setPropertyToDelete(property);
    setFeedback(null);
    setDeleteOpen(true);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setFeedback(null);

    const isEditing =
      formMode === "edit" && selectedProperty;

    try {
      const response = await fetch(
        isEditing
          ? `/api/properties/${selectedProperty.id}`
          : "/api/properties",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (
          result.errors &&
          Array.isArray(result.errors) &&
          result.errors.length > 0
        ) {
          throw new Error(result.errors[0].message);
        }

        throw new Error(
          result.message ||
            `Unable to ${
              isEditing ? "update" : "create"
            } property.`
        );
      }

      setFormOpen(false);
      resetForm();

      setFeedback({
        type: "success",
        message: isEditing
          ? "Property updated successfully."
          : "Property created successfully.",
      });

      await loadProperties(true);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save property.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!propertyToDelete) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/properties/${propertyToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to delete property."
        );
      }

      setDeleteOpen(false);
      setPropertyToDelete(null);

      setFeedback({
        type: "success",
        message: "Property deleted successfully.",
      });

      await loadProperties(true);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete property.",
      });
    } finally {
      setDeleting(false);
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
            Loading properties
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Preparing your property workspace.
          </p>
        </div>
      </div>
    );
  }

  if (currentUser?.role !== "OWNER") {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
              <Building2 className="h-6 w-6 text-zinc-600" />
            </div>

            <h1 className="mt-5 text-xl font-semibold tracking-tight text-zinc-950">
              Property management is owner-only
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Your current role does not have permission to
              create, update, or delete properties.
            </p>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Signed in as {currentUser?.name} ·{" "}
              {currentUser?.role}
            </p>
          </div>
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
                <Building2 className="h-3.5 w-3.5" />
                Property management
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                Properties
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Manage the properties connected to your
                account from one centralized workspace.
              </p>

              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                {currentUser.name} · Owner
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Add property
            </button>
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

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">
                Total properties
              </p>

              <Building2 className="h-5 w-5 text-zinc-400" />
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
              {properties.length}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Properties under your management
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-950 bg-zinc-950 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-400">
                Workspace
              </p>

              <MapPin className="h-5 w-5 text-zinc-500" />
            </div>

            <p className="mt-3 text-lg font-semibold">
              Centralized management
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Keep property information organized in one
              place.
            </p>
          </div>
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
                placeholder="Search properties by name or address..."
                className="h-10 pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadProperties(true)}
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
              Your properties
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {filteredProperties.length}{" "}
              {filteredProperties.length === 1
                ? "property"
                : "properties"}{" "}
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
                      Unable to load properties
                    </h3>

                    <p className="mt-1 text-sm text-red-700">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() => void loadProperties()}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                <Building2 className="h-6 w-6 text-zinc-500" />
              </div>

              <h3 className="mt-5 text-sm font-semibold text-zinc-950">
                {search
                  ? "No properties found"
                  : "No properties yet"}
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                {search
                  ? "Try changing your search terms."
                  : "Add your first property to start managing your property portfolio."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                  Add property
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Property
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Address
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Added
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProperties.map((property) => (
                      <tr
                        key={property.id}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                              <Building2 className="h-4 w-4 text-zinc-600" />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-zinc-950">
                                {property.name}
                              </p>

                              <p className="mt-0.5 text-xs text-zinc-400">
                                Property ID: {property.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex max-w-sm items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

                            <span className="text-sm text-zinc-600">
                              {property.address}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-zinc-500">
                          {formatDate(property.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditDialog(property)
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteDialog(property)
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-zinc-100 md:hidden">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                        <Building2 className="h-4 w-4 text-zinc-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-zinc-950">
                          {property.name}
                        </h3>

                        <div className="mt-2 flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />

                          <p className="text-sm leading-5 text-zinc-600">
                            {property.address}
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-zinc-400">
                          Added {formatDate(property.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditDialog(property)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openDeleteDialog(property)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setFormOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit"
                ? "Edit property"
                : "Add property"}
            </DialogTitle>

            <DialogDescription>
              {formMode === "edit"
                ? "Update the property information below."
                : "Add a property to your management workspace."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label
                htmlFor="property-name"
                className="text-sm font-medium text-zinc-900"
              >
                Property name
              </label>

              <Input
                id="property-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Green Valley Apartments"
                maxLength={100}
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="property-address"
                className="text-sm font-medium text-zinc-900"
              >
                Address
              </label>

              <textarea
                id="property-address"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Enter the complete property address"
                maxLength={255}
                disabled={saving}
                required
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {feedback?.type === "error" && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}

            <DialogFooter>
              <DialogClose
                render={
                  <button
                    type="button"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  />
                }
              >
                Cancel
              </DialogClose>

              <button
                type="submit"
                disabled={
                  saving ||
                  !name.trim() ||
                  !address.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? "Saving..."
                  : formMode === "edit"
                    ? "Save changes"
                    : "Create property"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) {
            setDeleteOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>

            <DialogTitle className="mt-1">
              Delete property?
            </DialogTitle>

            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-zinc-800">
                {propertyToDelete?.name}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose
              render={
                <button
                  type="button"
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                />
              }
            >
              Cancel
            </DialogClose>

            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {deleting
                ? "Deleting..."
                : "Delete property"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}