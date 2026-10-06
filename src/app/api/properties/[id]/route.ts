// File: src/app/api/properties/[id]/route.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import {
    getOwnerPropertyById,
    updateOwnerProperty,
    deleteOwnerProperty,
} from "@/services/property.service";
import { updatePropertySchema } from "@/lib/validations/property";

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

        if (currentUser.role !== "OWNER") {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have permission to view this property.",
                },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        const property = await getOwnerPropertyById(
            id,
            currentUser.id
        );

        if (!property) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Property not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Property retrieved successfully.",
                data: property,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get property by ID error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve property.",
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

        if (currentUser.role !== "OWNER") {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have permission to update this property.",
                },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        const body = await request.json();

        const validatedData = updatePropertySchema.parse(body);

        const property = await updateOwnerProperty(
            id,
            currentUser.id,
            validatedData
        );

        if (!property) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Property not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Property updated successfully.",
                data: property,
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

        console.error("Update property error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to update property.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        if (currentUser.role !== "OWNER") {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have permission to delete this property.",
                },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        const property = await deleteOwnerProperty(
            id,
            currentUser.id
        );

        if (!property) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Property not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Property deleted successfully.",
                data: property,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete property error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to delete property.",
            },
            { status: 500 }
        );
    }
}