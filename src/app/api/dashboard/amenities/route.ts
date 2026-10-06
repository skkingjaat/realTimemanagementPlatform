// File: src/app/api/dashboard/amenities/route.ts

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { getAmenityUsageOverview } from "@/services/amenity-booking.service";

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

        const overview = await getAmenityUsageOverview(
            currentUser.role,
            currentUser.id
        );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Amenity usage overview retrieved successfully.",
                data: overview,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Get amenity usage overview error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve amenity usage overview.",
            },
            { status: 500 }
        );
    }
}