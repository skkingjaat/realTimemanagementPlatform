// File: src/lib/auth.ts

import { SignJWT, jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined.");
}

const secret = new TextEncoder().encode(jwtSecret);

export type AuthRole = "TENANT" | "OWNER" | "STAFF";

export type AuthTokenPayload = {
    userId: string;
    role: AuthRole;
};

function isValidRole(value: unknown): value is AuthRole {
    return (
        value === "TENANT" ||
        value === "OWNER" ||
        value === "STAFF"
    );
}

export async function createAuthToken(payload: AuthTokenPayload) {
    return new SignJWT({
        role: payload.role,
    })
        .setProtectedHeader({
            alg: "HS256",
            typ: "JWT",
        })
        .setSubject(payload.userId)
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
    const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
    });

    if (
        typeof payload.sub !== "string" ||
        !payload.sub.trim() ||
        !isValidRole(payload.role)
    ) {
        throw new Error("Invalid authentication token.");
    }

    return {
        userId: payload.sub,
        role: payload.role,
    };
}