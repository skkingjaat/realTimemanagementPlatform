// File: src/app/api/amenity-bookings/[id]/route.ts

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { getAmenityBookingById } from "@/services/amenity-booking.service";

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

        const booking = await getAmenityBookingById(
            id,
            currentUser.role,
            currentUser.id
        );

        if (!booking) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Amenity booking not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Amenity booking retrieved successfully.",
                data: booking,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Get amenity booking error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve amenity booking.",
            },
            { status: 500 }
        );
    }
}