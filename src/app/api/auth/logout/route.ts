import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST() {
    cookies().delete("session");
    return NextResponse.json({ success: true });
}
