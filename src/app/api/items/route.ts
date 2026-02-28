import { NextResponse } from "next/server";

export async function GET() {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_INVENTARIO;
    const TABLE_ID = process.env.AIRTABLE_TABLE_ITEMS;

    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_ID) {
        return NextResponse.json({ error: "Missing Airtable configuration" }, { status: 500 });
    }

    try {
        let allRecords: any[] = [];
        let offset = "";

        do {
            const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
            url.searchParams.append("filterByFormula", "{activo} = TRUE()");
            if (offset) {
                url.searchParams.append("offset", offset);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return NextResponse.json({ error: "Airtable API error", details: errorData }, { status: response.status });
            }

            const data = await response.json();
            allRecords = [...allRecords, ...data.records];
            offset = data.offset;
        } while (offset);

        const formattedItems = allRecords.map((record: any) => ({
            id: record.id,
            nombre: record.fields.nombre || "",
            categoria: record.fields.categoria || "",
            subcategoria: record.fields.subcategoria || "",
            unidad_base: record.fields.unidad_base || "",
            proveedor: record.fields.proveedor || "",
            min_level: record.fields.min_level || 0,
            stock_ideal: record.fields.stock_ideal || 0,
            limite_cocina: record.fields.limite_cocina || 0,
            limite_bar_pb: record.fields.limite_bar_pb || 0,
            limite_bar_rooftop: record.fields.limite_bar_rooftop || 0,
            activo: record.fields.activo,
            stock_raw: record.fields.stock_raw || 0,
            existencias: record.fields.existencias || 0,
            estado_stock: record.fields.estado_stock || "SIN DATOS",
            cantidad_a_comprar: record.fields.cantidad_a_comprar || 0,
            consumo_total: record.fields.consumo_total || 0,
            consumo_promedio_diario: record.fields.consumo_promedio_diario || 0,
            dias_stock_restante: record.fields.dias_stock_restante || 0,
            nivel_alerta: record.fields.nivel_alerta || "SIN DATOS",
            bajo_stock: record.fields.bajo_stock || false,
        }));

        return NextResponse.json({ success: true, count: formattedItems.length, data: formattedItems });
    } catch (error) {
        console.error("Error fetching Airtable items:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_INVENTARIO;
    const TABLE_ID = process.env.AIRTABLE_TABLE_ITEMS;

    if (!AIRTABLE_API_KEY || !BASE_ID || !TABLE_ID) {
        return NextResponse.json({ error: "Missing Airtable configuration" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { fields } = body;

        // Ensure Activa is true on creation
        const newFields: any = {
            ...fields,
            activo: true, // Force new items to be active initially
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
            return NextResponse.json({ error: "Failed to create item", details: errorData }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data: data.records[0] });
    } catch (error) {
        console.error("Error creating Airtable item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
