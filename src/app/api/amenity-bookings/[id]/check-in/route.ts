// File: src/app/api/amenity-bookings/[id]/check-in/route.ts

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { checkInAmenityBooking } from "@/services/amenity-booking.service";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(
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

        const result = await checkInAmenityBooking(
            id,
            currentUser.id
        );

        if (result.type === "NOT_FOUND") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Amenity booking not found.",
                },
                { status: 404 }
            );
        }

        if (result.type === "FORBIDDEN") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "You do not have permission to check in for this booking.",
                },
                { status: 403 }
            );
        }

        if (result.type === "ALREADY_CHECKED_IN") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Amenity booking has already been checked in.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Amenity booking checked in successfully.",
                data: result.data,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Check-in amenity booking error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Unable to check in amenity booking.",
            },
            { status: 500 }
        );
    }
}