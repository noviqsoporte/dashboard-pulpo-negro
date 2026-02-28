import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (password === process.env.APP_PASSWORD) {
            cookies().set("session", "authenticated", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 86400, // 24 hours
                path: "/",
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: "Contraseña incorrecta" },
            { status: 401 }
        );
    } catch {
        return NextResponse.json(
            { error: "Error de servidor" },
            { status: 500 }
        );
    }
}
