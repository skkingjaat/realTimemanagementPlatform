// File: src/app/api/maintenance-requests/[id]/status/route.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { updateMaintenanceStatus } from "@/services/maintenance-request.service";
import { updateMaintenanceStatusSchema } from "@/lib/validations/maintenance-request";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

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
                        "You do not have permission to update maintenance status.",
                },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        const body = await request.json();

        const validatedData =
            updateMaintenanceStatusSchema.parse(body);

        const result = await updateMaintenanceStatus(
            id,
            validatedData,
            currentUser.role,
            currentUser.id
        );

        if (result.type === "NOT_FOUND") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Maintenance request not found.",
                },
                { status: 404 }
            );
        }

        if (result.type === "INVALID_TRANSITION") {
            return NextResponse.json(
                {
                    success: false,
                    message: `Invalid status transition from ${result.currentStatus} to ${result.nextStatus}.`,
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Maintenance request status updated successfully.",
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
            "Update maintenance status error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to update maintenance request status.",
            },
            { status: 500 }
        );
    }
}