import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const isAuthPage = request.nextUrl.pathname === "/";

    if (!session && !isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (session === "authenticated" && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/inventario/:path*",
        "/compras/:path*",
        "/tareas/:path*",
        "/",
    ],
};
