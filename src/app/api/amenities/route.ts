// File: src/app/api/amenities/route.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { createAmenitySchema } from "@/lib/validations/amenity";
import {
  createAmenity,
  getAmenities,
} from "@/services/amenity.service";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    if (
      currentUser.role !== "OWNER" &&
      currentUser.role !== "STAFF"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to create an amenity.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validatedData =
      createAmenitySchema.parse(body);

    const result = await createAmenity(
      validatedData,
      currentUser.role,
      currentUser.id
    );

    if (result.type === "NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found.",
        },
        { status: 404 }
      );
    }

    if (result.type === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to add an amenity to this property.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Amenity created successfully.",
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Create amenity error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create amenity.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const amenities = await getAmenities();

    return NextResponse.json(
      {
        success: true,
        message: "Amenities retrieved successfully.",
        data: amenities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get amenities error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve amenities.",
      },
      { status: 500 }
    );
  }
}