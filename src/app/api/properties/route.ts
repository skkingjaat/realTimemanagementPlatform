// File: src/app/api/properties/route.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { createPropertySchema } from "@/lib/validations/property";
import {
    createProperty,
    getOwnerProperties,
} from "@/services/property.service";

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

        if (currentUser.role !== "OWNER") {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have permission to view properties.",
                },
                { status: 403 }
            );
        }

        const properties = await getOwnerProperties(currentUser.id);

        return NextResponse.json(
            {
                success: true,
                message: "Properties retrieved successfully.",
                data: properties,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get properties error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve properties.",
            },
            { status: 500 }
        );
    }
}

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

        if (currentUser.role !== "OWNER") {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have permission to create a property.",
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const validatedData = createPropertySchema.parse(body);

        const property = await createProperty(
            validatedData,
            currentUser.id
        );

        return NextResponse.json(
            {
                success: true,
                message: "Property created successfully.",
                data: property,
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

        console.error("Create property error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to create property.",
            },
            { status: 500 }
        );
    }
}