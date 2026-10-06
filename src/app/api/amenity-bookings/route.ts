// File: src/app/api/amenity-bookings/route.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { createAmenityBookingSchema } from "@/lib/validations/amenity-booking";
import {
    createAmenityBooking,
    getAmenityBookings,
} from "@/services/amenity-booking.service";

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

        const bookings = await getAmenityBookings(
            currentUser.role,
            currentUser.id
        );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Amenity bookings retrieved successfully.",
                data: bookings,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "Get amenity bookings error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve amenity bookings.",
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
            createAmenityBookingSchema.parse(body);

        const result = await createAmenityBooking(
            currentUser.id,
            validatedData
        );

        if (result.type === "NOT_FOUND") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Amenity not found.",
                },
                { status: 404 }
            );
        }

        if (result.type === "UNAVAILABLE") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This amenity is currently unavailable.",
                },
                { status: 409 }
            );
        }

        if (result.type === "INVALID_TIME") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The booking date or time is invalid.",
                },
                { status: 400 }
            );
        }

        if (result.type === "INVALID_TIME_RANGE") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Check-out time must be later than check-in time.",
                },
                { status: 400 }
            );
        }

        if (result.type === "CONFLICT") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This amenity is already booked for the selected time.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Amenity booked successfully.",
                data: result.data,
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
            "Create amenity booking error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to create amenity booking.",
            },
            { status: 500 }
        );
    }
}