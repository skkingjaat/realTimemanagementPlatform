import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { updateAmenitySchema } from "@/lib/validations/amenity";
import {
  getAmenityById,
  updateAmenity,
} from "@/services/amenity.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const amenity = await getAmenityById(
      id,
      currentUser.role,
      currentUser.id
    );

    if (!amenity) {
      return NextResponse.json(
        {
          success: false,
          message: "Amenity not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Amenity retrieved successfully.",
        data: amenity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get amenity by ID error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve amenity.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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
            "You do not have permission to update an amenity.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const body = await request.json();

    const validatedData =
      updateAmenitySchema.parse(body);

    const result = await updateAmenity(
      id,
      validatedData,
      currentUser.role,
      currentUser.id
    );

    if (result.type === "NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Amenity not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Amenity updated successfully.",
        data: result.data,
      },
      { status: 200 }
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

    console.error(
      "Update amenity error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update amenity.",
      },
      { status: 500 }
    );
  }
}