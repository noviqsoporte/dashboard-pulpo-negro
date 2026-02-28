import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_TAREAS;
    const TABLE_ID = process.env.AIRTABLE_TABLE_TAREAS;

    // We need to await params in Next.js 14+ app router correctly if it's considered a promise,
    // but typically params.id is available directly. We'll use params.id.
    const recordId = params.id;

    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_ID) {
        return NextResponse.json({ error: "Missing Airtable configuration" }, { status: 500 });
    }

    if (!recordId) {
        return NextResponse.json({ error: "Missing record ID" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { fields } = body;

        if (!fields) {
            return NextResponse.json({ error: "Missing fields to update" }, { status: 400 });
        }

        const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fields: fields
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: "Failed to update task", details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data: data });
    } catch (error) {
        console.error("Error updating Airtable task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
