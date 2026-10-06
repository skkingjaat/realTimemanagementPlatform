// File: src/services/auth.service.ts

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { createAuthToken } from "@/lib/auth";
import type {
    LoginInput,
    RegisterInput,
} from "@/lib/validations/auth";

export async function registerUser(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
        select: {
            id: true,
        },
    });

    if (existingUser) {
        throw new Error("A user with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            password: passwordHash,
            role: "TENANT",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
}

export async function loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.password
    );

    if (!passwordMatches) {
        throw new Error("Invalid email or password.");
    }

    const token = await createAuthToken({
        userId: user.id,
        role: user.role,
    });

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    };
}