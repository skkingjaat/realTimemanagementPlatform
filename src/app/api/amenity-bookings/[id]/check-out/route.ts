// File: src/app/api/amenity-bookings/[id]/check-out/route.ts

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { checkOutAmenityBooking } from "@/services/amenity-booking.service";

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

        const result = await checkOutAmenityBooking(
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
                        "You do not have permission to check out for this booking.",
                },
                { status: 403 }
            );
        }

        if (result.type === "NOT_CHECKED_IN") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The booking must be checked in before it can be checked out.",
                },
                { status: 409 }
            );
        }

        if (result.type === "ALREADY_CHECKED_OUT") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Amenity booking has already been checked out.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Amenity booking checked out successfully.",
                data: result.data,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Check-out amenity booking error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to check out amenity booking.",
            },
            { status: 500 }
        );
    }
}