import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_TAREAS;
    const TABLE_ID = process.env.AIRTABLE_TABLE_TAREAS;

    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_ID) {
        return NextResponse.json({ error: "Missing Airtable configuration" }, { status: 500 });
    }

    try {
        let allRecords: any[] = [];
        let offset = "";

        do {
            const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
            // Filter only active tasks
            url.searchParams.append("filterByFormula", "{Activa} = TRUE()");
            if (offset) {
                url.searchParams.append("offset", offset);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                },
                // Add cache: 'no-store' to always get fresh data
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

        const formattedTasks = allRecords.map((record: any) => ({
            id: record.id,
            tarea: record.fields["Tarea"] || "",
            descripcion: record.fields["Descripción"] || "",
            responsable: record.fields["Responsable"] || [],
            fecha_limite: record.fields["Fecha Limite"] || null,
            fecha_finalizacion: record.fields["Fecha de finalización"] || null,
            estado: record.fields["Estado"] || "Sin empezar",
            prioridad: record.fields["Prioridad"] || "Media",
            activa: record.fields["Activa"] || false,
            nombre_usuario: record.fields["Nombre (from Usuarios)"]?.[0] || "",
            id_telegram: record.fields["ID Telegram (from Usuarios)"]?.[0] || ""
        }));

        return NextResponse.json({ success: true, count: formattedTasks.length, data: formattedTasks });
    } catch (error) {
        console.error("Error fetching Airtable tasks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_TAREAS;
    const TABLE_ID = process.env.AIRTABLE_TABLE_TAREAS;

    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_ID) {
        return NextResponse.json({ error: "Missing Airtable configuration" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { fields } = body;

        // Ensure Activa is true on creation
        const newFields = {
            ...fields,
            "Activa": true
        };

        const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                records: [
                    {
                        fields: newFields,
                    },
                ],
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: "Failed to create task", details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data: data.records[0] });
    } catch (error) {
        console.error("Error creating Airtable task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
