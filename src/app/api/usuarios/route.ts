import { NextResponse } from "next/server";

export async function GET() {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_TAREAS;
    const TABLE_ID = "Usuarios"; // Literal table name as requested

    if (!AIRTABLE_API_KEY || !BASE_ID) {
        return NextResponse.json({ error: "Missing Airtable configuration" }, { status: 500 });
    }

    try {
        let allRecords: any[] = [];
        let offset = "";

        do {
            const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
            if (offset) {
                url.searchParams.append("offset", offset);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                },
                // Cache para data relativamente estática
                cache: 'no-store'
            });

            if (!response.ok) {
                const errorData = await response.json();
                return NextResponse.json({ error: "Airtable API error", details: errorData }, { status: response.status });
            }

            const data = await response.json();
            allRecords = [...allRecords, ...data.records];
            offset = data.offset;
        } while (offset);

        const formattedUsuarios = allRecords.map((record: any) => ({
            id: record.id,
            nombre: record.fields["Nombre"] || "",
            id_telegram: record.fields["ID Telegram"] || ""
        }));

        return NextResponse.json({ success: true, count: formattedUsuarios.length, data: formattedUsuarios });
    } catch (error) {
        console.error("Error fetching Airtable usuarios:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
