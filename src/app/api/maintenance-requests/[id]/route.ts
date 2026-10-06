// File: src/app/api/maintenance-requests/[id]/route.ts

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { getMaintenanceRequestById } from "@/services/maintenance-request.service";

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

        const maintenanceRequest =
            await getMaintenanceRequestById(
                id,
                currentUser.role,
                currentUser.id
            );

        if (!maintenanceRequest) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Maintenance request not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Maintenance request retrieved successfully.",
                data: maintenanceRequest,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Get maintenance request error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve maintenance request.",
            },
            { status: 500 }
        );
    }
}