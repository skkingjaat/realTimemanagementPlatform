// File: src/app/api/dashboard/maintenance/route.ts

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { getMaintenanceOverview } from "@/services/maintenance-request.service";

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

        const overview = await getMaintenanceOverview(
            currentUser.role,
            currentUser.id
        );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Maintenance overview retrieved successfully.",
                data: overview,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Get maintenance overview error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve maintenance overview.",
            },
            { status: 500 }
        );
    }
}