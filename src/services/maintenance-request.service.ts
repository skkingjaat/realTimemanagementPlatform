// File: src/services/maintenance-request.service.ts

import { prisma } from "@/lib/prisma";

import type {
  CreateMaintenanceRequestInput,
  UpdateMaintenanceStatusInput,
} from "@/lib/validations/maintenance-request";

type MaintenanceUserRole = "TENANT" | "OWNER" | "STAFF";

export async function createMaintenanceRequest(
  input: CreateMaintenanceRequestInput
) {
  const property = await prisma.property.findUnique({
    where: {
      id: input.propertyId,
    },
    select: {
      id: true,
    },
  });

  if (!property) {
    return null;
  }

  const maintenanceRequest =
    await prisma.maintenanceRequest.create({
      data: {
        propertyId: property.id,
        issueDescription: input.issueDescription,
      },
    });

  return maintenanceRequest;
}

export async function getMaintenanceRequests(
  role: MaintenanceUserRole,
  userId: string
) {
  const where =
    role === "OWNER"
      ? {
          property: {
            ownerId: userId,
          },
        }
      : role === "STAFF"
        ? {}
        : {
            id: "__NO_TENANT_REQUEST_ACCESS__",
          };

  const maintenanceRequests =
    await prisma.maintenanceRequest.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

  return maintenanceRequests;
}

export async function getMaintenanceRequestById(
  maintenanceRequestId: string,
  role: MaintenanceUserRole,
  userId: string
) {
  const where =
    role === "OWNER"
      ? {
          id: maintenanceRequestId,
          property: {
            ownerId: userId,
          },
        }
      : role === "STAFF"
        ? {
            id: maintenanceRequestId,
          }
        : {
            id: "__NO_TENANT_REQUEST_ACCESS__",
          };

  const maintenanceRequest =
    await prisma.maintenanceRequest.findFirst({
      where,
    });

  return maintenanceRequest;
}

export async function updateMaintenanceStatus(
  maintenanceRequestId: string,
  input: UpdateMaintenanceStatusInput,
  role: "OWNER" | "STAFF",
  userId: string
) {
  const where =
    role === "OWNER"
      ? {
          id: maintenanceRequestId,
          property: {
            ownerId: userId,
          },
        }
      : {
          id: maintenanceRequestId,
        };

  const maintenanceRequest =
    await prisma.maintenanceRequest.findFirst({
      where,
    });

  if (!maintenanceRequest) {
    return {
      type: "NOT_FOUND" as const,
    };
  }

  const currentStatus = maintenanceRequest.status;
  const nextStatus = input.status;

  const validTransition =
    (currentStatus === "PENDING" &&
      nextStatus === "IN_PROGRESS") ||
    (currentStatus === "IN_PROGRESS" &&
      nextStatus === "COMPLETED");

  if (!validTransition) {
    return {
      type: "INVALID_TRANSITION" as const,
      currentStatus,
      nextStatus,
    };
  }

  const updatedMaintenanceRequest =
    await prisma.maintenanceRequest.update({
      where: {
        id: maintenanceRequest.id,
      },
      data: {
        status: nextStatus,
        resolutionDate:
          nextStatus === "COMPLETED"
            ? new Date()
            : null,
      },
    });

  return {
    type: "SUCCESS" as const,
    data: updatedMaintenanceRequest,
  };
}

export async function getMaintenanceOverview(
  role: MaintenanceUserRole,
  userId: string
) {
  const where =
    role === "OWNER"
      ? {
          property: {
            ownerId: userId,
          },
        }
      : role === "STAFF"
        ? {}
        : {
            id: "__NO_TENANT_REQUEST_ACCESS__",
          };

  const [
    totalRequests,
    pendingRequests,
    inProgressRequests,
    completedRequests,
  ] = await Promise.all([
    prisma.maintenanceRequest.count({
      where,
    }),

    prisma.maintenanceRequest.count({
      where: {
        ...where,
        status: "PENDING",
      },
    }),

    prisma.maintenanceRequest.count({
      where: {
        ...where,
        status: "IN_PROGRESS",
      },
    }),

    prisma.maintenanceRequest.count({
      where: {
        ...where,
        status: "COMPLETED",
      },
    }),
  ]);

  return {
    totalRequests,
    pendingRequests,
    inProgressRequests,
    completedRequests,
  };
}