import { prisma } from "@/lib/prisma";

import type {
  CreateAmenityInput,
  UpdateAmenityInput,
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

export async function getAmenities(
  role: AmenityUserRole,
  userId: string
) {
  const where =
    role === "OWNER"
      ? {
          property: {
            ownerId: userId,
          },
        }
      : {};

  return prisma.amenity.findMany({
    where,
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
  amenityId: string,
  role: AmenityUserRole,
  userId: string
) {
  const where =
    role === "OWNER"
      ? {
          id: amenityId,
          property: {
            ownerId: userId,
          },
        }
      : {
          id: amenityId,
        };

  return prisma.amenity.findFirst({
    where,
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

export async function updateAmenity(
  amenityId: string,
  input: UpdateAmenityInput,
  role: "OWNER" | "STAFF",
  userId: string
) {
  const where =
    role === "OWNER"
      ? {
          id: amenityId,
          property: {
            ownerId: userId,
          },
        }
      : {
          id: amenityId,
        };

  const amenity = await prisma.amenity.findFirst({
    where,
    select: {
      id: true,
    },
  });

  if (!amenity) {
    return {
      type: "NOT_FOUND" as const,
    };
  }

  const updatedAmenity =
    await prisma.amenity.update({
      where: {
        id: amenity.id,
      },
      data: {
        ...(input.name !== undefined
          ? {
              name: input.name,
            }
          : {}),
        ...(input.availabilityStatus !== undefined
          ? {
              availabilityStatus:
                input.availabilityStatus,
            }
          : {}),
      },
    });

  return {
    type: "SUCCESS" as const,
    data: updatedAmenity,
  };
}