import { z } from "zod";

export const createAmenityBookingSchema =
  z.object({
    amenityId: z
      .string()
      .trim()
      .min(1, "Amenity ID is required."),

    bookingDate: z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Booking date must use YYYY-MM-DD format."
      ),

    checkInTime: z
      .string()
      .trim()
      .regex(
        /^\d{2}:\d{2}$/,
        "Check-in time must use HH:MM format."
      ),

    checkOutTime: z
      .string()
      .trim()
      .regex(
        /^\d{2}:\d{2}$/,
        "Check-out time must use HH:MM format."
      ),
  });

export type CreateAmenityBookingInput =
  z.infer<typeof createAmenityBookingSchema>;