import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_INVENTARIO;
    const TABLE_ID = process.env.AIRTABLE_TABLE_ITEMS;

    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_ID) {
        return NextResponse.json({ error: "Missing Airtable configuration" }, { status: 500 });
    }

    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const { fields } = body;

        const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fields: fields,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: "Failed to update item", details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Error updating Airtable item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
