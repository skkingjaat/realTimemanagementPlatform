// File: src/app/api/maintenance-requests/route.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import {
    createMaintenanceRequest,
    getMaintenanceRequests,
} from "@/services/maintenance-request.service";
import { createMaintenanceRequestSchema } from "@/lib/validations/maintenance-request";

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

        const maintenanceRequests =
            await getMaintenanceRequests(
                currentUser.role,
                currentUser.id
            );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Maintenance requests retrieved successfully.",
                data: maintenanceRequests,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Get maintenance requests error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve maintenance requests.",
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

        const body = await request.json();

        const validatedData =
            createMaintenanceRequestSchema.parse(body);

        const maintenanceRequest =
            await createMaintenanceRequest(
                validatedData
            );

        if (!maintenanceRequest) {
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
                message:
                    "Maintenance request created successfully.",
                data: maintenanceRequest,
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

        console.error(
            "Create maintenance request error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to create maintenance request.",
            },
            { status: 500 }
        );
    }
}