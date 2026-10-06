// File: src/services/amenity.service.ts

import { prisma } from "@/lib/prisma";

import type {
  CreateAmenityInput,
} from "@/lib/validations/amenity";

export type AmenityUserRole =
  | "TENANT"
  | "OWNER"
  | "STAFF";

export async function createAmenity(
  input: CreateAmenityInput,
  role: AmenityUserRole,
  userId: string
) {
  const property = await prisma.property.findUnique({
    where: {
      id: input.propertyId,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!property) {
    return {
      type: "NOT_FOUND" as const,
    };
  }

  if (
    role !== "STAFF" &&
    property.ownerId !== userId
  ) {
    return {
      type: "FORBIDDEN" as const,
    };
  }

  const amenity = await prisma.amenity.create({
    data: {
      propertyId: property.id,
      name: input.name,
    },
  });

  return {
    type: "SUCCESS" as const,
    data: amenity,
  };
}

export async function getAmenities() {
  return prisma.amenity.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      property: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });
}

export async function getAmenityById(
  amenityId: string
) {
  return prisma.amenity.findUnique({
    where: {
      id: amenityId,
    },
    include: {
      property: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });
}