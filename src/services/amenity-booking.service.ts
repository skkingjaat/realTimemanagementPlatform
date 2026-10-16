import { prisma } from "@/lib/prisma";

import type {
  CreateAmenityBookingInput,
} from "@/lib/validations/amenity-booking";

export type AmenityBookingUserRole =
  | "TENANT"
  | "OWNER"
  | "STAFF";

type BookingDateTimeResult =
  | Date
  | null;

function buildDateTime(
  bookingDate: string,
  time: string
): BookingDateTimeResult {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return null;
  }

  const date = new Date(
    `${bookingDate}T${time}:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function buildBookingDate(
  bookingDate: string
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    return null;
  }

  const date = new Date(
    `${bookingDate}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function createAmenityBooking(
  userId: string,
  input: CreateAmenityBookingInput
) {
  const bookingDate = buildBookingDate(
    input.bookingDate
  );

  const checkInTime = buildDateTime(
    input.bookingDate,
    input.checkInTime
  );

  const checkOutTime = buildDateTime(
    input.bookingDate,
    input.checkOutTime
  );

  if (
    !bookingDate ||
    !checkInTime ||
    !checkOutTime
  ) {
    return {
      type: "INVALID_TIME" as const,
    };
  }

  if (checkInTime >= checkOutTime) {
    return {
      type: "INVALID_TIME_RANGE" as const,
    };
  }

  if (bookingDate < startOfToday()) {
    return {
      type: "PAST_DATE" as const,
    };
  }

  if (
    bookingDate.getTime() ===
    startOfToday().getTime() &&
    checkInTime <= new Date()
  ) {
    return {
      type: "PAST_TIME" as const,
    };
  }

  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        const amenity =
          await tx.amenity.findUnique({
            where: {
              id: input.amenityId,
            },
            select: {
              id: true,
              availabilityStatus: true,
            },
          });

        if (!amenity) {
          throw new BookingDomainError(
            "NOT_FOUND"
          );
        }

        if (
          amenity.availabilityStatus !==
          "AVAILABLE"
        ) {
          throw new BookingDomainError(
            "UNAVAILABLE"
          );
        }

        const conflictingBooking =
          await tx.amenityBooking.findFirst({
            where: {
              amenityId: input.amenityId,
              checkInTime: {
                lt: checkOutTime,
              },
              checkOutTime: {
                gt: checkInTime,
              },
            },
            select: {
              id: true,
            },
          });

        if (conflictingBooking) {
          throw new BookingDomainError(
            "CONFLICT"
          );
        }

        return tx.amenityBooking.create({
          data: {
            amenityId: input.amenityId,
            userId,
            bookingDate,
            checkInTime,
            checkOutTime,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return {
      type: "SUCCESS" as const,
      data: booking,
    };
  } catch (error) {
    if (
      error instanceof BookingDomainError
    ) {
      return {
        type: error.type,
      };
    }

    if (
      isSerializableConflict(error)
    ) {
      return {
        type: "CONFLICT" as const,
      };
    }

    throw error;
  }
}

export async function getAmenityBookings(
  role: AmenityBookingUserRole,
  userId: string
) {
  const where =
    role === "STAFF"
      ? {}
      : {
          userId,
        };

  return prisma.amenityBooking.findMany({
    where,
    orderBy: [
      {
        bookingDate: "asc",
      },
      {
        checkInTime: "asc",
      },
    ],
  });
}

export async function getAmenityBookingById(
  bookingId: string,
  role: AmenityBookingUserRole,
  userId: string
) {
  const where =
    role === "STAFF"
      ? {
          id: bookingId,
        }
      : {
          id: bookingId,
          userId,
        };

  return prisma.amenityBooking.findFirst({
    where,
  });
}

export async function checkInAmenityBooking(
  bookingId: string,
  userId: string
) {
  const booking =
    await prisma.amenityBooking.findUnique({
      where: {
        id: bookingId,
      },
    });

  if (!booking) {
    return {
      type: "NOT_FOUND" as const,
    };
  }

  if (booking.userId !== userId) {
    return {
      type: "FORBIDDEN" as const,
    };
  }

  if (booking.checkedInAt) {
    return {
      type: "ALREADY_CHECKED_IN" as const,
    };
  }

  if (booking.checkedOutAt) {
    return {
      type: "ALREADY_CHECKED_OUT" as const,
    };
  }

  const updatedBooking =
    await prisma.amenityBooking.update({
      where: {
        id: bookingId,
      },
      data: {
        checkedInAt: new Date(),
      },
    });

  return {
    type: "SUCCESS" as const,
    data: updatedBooking,
  };
}

export async function checkOutAmenityBooking(
  bookingId: string,
  userId: string
) {
  const booking =
    await prisma.amenityBooking.findUnique({
      where: {
        id: bookingId,
      },
    });

  if (!booking) {
    return {
      type: "NOT_FOUND" as const,
    };
  }

  if (booking.userId !== userId) {
    return {
      type: "FORBIDDEN" as const,
    };
  }

  if (!booking.checkedInAt) {
    return {
      type: "NOT_CHECKED_IN" as const,
    };
  }

  if (booking.checkedOutAt) {
    return {
      type: "ALREADY_CHECKED_OUT" as const,
    };
  }

  const updatedBooking =
    await prisma.amenityBooking.update({
      where: {
        id: bookingId,
      },
      data: {
        checkedOutAt: new Date(),
      },
    });

  return {
    type: "SUCCESS" as const,
    data: updatedBooking,
  };
}

export async function getAmenityUsageOverview(
  role: AmenityBookingUserRole,
  userId: string
) {
  const where =
    role === "STAFF"
      ? {}
      : {
          userId,
        };

  const [
    totalBookings,
    checkedInBookings,
    checkedOutBookings,
  ] = await Promise.all([
    prisma.amenityBooking.count({
      where,
    }),

    prisma.amenityBooking.count({
      where: {
        ...where,
        checkedInAt: {
          not: null,
        },
      },
    }),

    prisma.amenityBooking.count({
      where: {
        ...where,
        checkedOutAt: {
          not: null,
        },
      },
    }),
  ]);

  return {
    totalBookings,
    checkedInBookings,
    checkedOutBookings,
  };
}

function startOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}

class BookingDomainError extends Error {
  constructor(
    public readonly type:
      | "NOT_FOUND"
      | "UNAVAILABLE"
      | "CONFLICT"
  ) {
    super(type);
  }
}

function isSerializableConflict(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}