import { z } from "zod";

export const createAmenitySchema = z.object({
  propertyId: z
    .string()
    .trim()
    .min(1, "Property ID is required."),

  name: z
    .string()
    .trim()
    .min(
      2,
      "Amenity name must be at least 2 characters long."
    )
    .max(
      100,
      "Amenity name must not exceed 100 characters."
    ),
});

export const updateAmenitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Amenity name must be at least 2 characters long."
      )
      .max(
        100,
        "Amenity name must not exceed 100 characters."
      )
      .optional(),

    availabilityStatus: z
      .enum(["AVAILABLE", "UNAVAILABLE"])
      .optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.availabilityStatus !== undefined,
    {
      message:
        "At least one amenity field must be provided.",
    }
  );

export type CreateAmenityInput = z.infer<
  typeof createAmenitySchema
>;

export type UpdateAmenityInput = z.infer<
  typeof updateAmenitySchema
>;