"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";

// Types
type Item = {
    id: string;
    nombre: string;
    categoria: string;
    subcategoria: string;
    unidad_base: string;
    proveedor: string;
    min_level: number;
    stock_ideal: number;
    limite_cocina: number;
    limite_bar_pb: number;
    limite_bar_rooftop: number;
    activo: boolean;
    stock_raw: number;
    existencias: number;
    estado_stock: string;
    cantidad_a_comprar: number;
    consumo_total: number;
    consumo_promedio_diario: number;
    dias_stock_restante: number;
    nivel_alerta: string;
    bajo_stock: boolean;
};

type ModalConfig = {
    isOpen: boolean;
    title: string;
    type: "fast_depleting" | "slow_moving" | "overstock" | "understock" | null;
    items: Item[];
};

export default function DashboardPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [modal, setModal] = useState<ModalConfig>({ isOpen: false, title: "", type: null, items: [] });

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch("/api/items");
                if (!res.ok) throw new Error("Failed to fetch items");
                const data = await res.json();
                setItems(data.data || []);
            } catch {
                setError("Error cargando datos del inventario.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchItems();
    }, []);

    // KPI Calculations
    const fastDepletingItems = items
        .filter((item) => item.dias_stock_restante > 0 && item.nivel_alerta !== "SIN DATOS" && (item.nivel_alerta === "URGENTE" || item.nivel_alerta === "PRONTO"))
        .sort((a, b) => a.dias_stock_restante - b.dias_stock_restante);

    const slowMovingItems = items
        .filter((item) => item.dias_stock_restante > 90 && item.nivel_alerta !== "SIN DATOS")
        .sort((a, b) => b.dias_stock_restante - a.dias_stock_restante);

    const overstockItems = items.filter((item) => item.estado_stock === "EXCESO");
    const understockItems = items.filter((item) => item.estado_stock === "DÉFICIT");

    const criticalAlerts = items.filter((item) => item.nivel_alerta === "AGOTADO" || item.nivel_alerta === "URGENTE");

    const openModal = (title: string, type: ModalConfig["type"], itemsList: Item[]) => {
        setModal({ isOpen: true, title, type, items: itemsList });
    };

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isOpen: false }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 text-[#d4a853] animate-spin mb-4" />
                <p className="text-[#8a8a9a]">Cargando dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-[#12121a] rounded-xl border border-[#ef4444] text-[#ef4444]">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Fast Depleting */}
                <div
                    onClick={() => openModal("Items por agotarse", "fast_depleting", fastDepletingItems)}
                    className="bg-[#12121a] p-6 rounded-xl border-l-[6px] border-l-[#ef4444] border-y border-r border-y-[#2a2a3e] border-r-[#2a2a3e] cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                >
                    <div className="text-2xl md:text-4xl font-bold font-[var(--font-jetbrains-mono)] mb-2">{fastDepletingItems.length}</div>
                    <div className="text-[#8a8a9a] text-sm">Items por agotarse</div>
                    <div className="text-[14px] font-bold text-[#f1f1f4] mt-2 flex items-center gap-2">
                        <span className="text-xl">🔥</span> Se acaban rápido
                    </div>
                </div>

                {/* Card 2: Slow Moving */}
                <div
                    onClick={() => openModal("Items de lento movimiento", "slow_moving", slowMovingItems)}
                    className="bg-[#12121a] p-6 rounded-xl border-l-[6px] border-l-[#3b82f6] border-y border-r border-y-[#2a2a3e] border-r-[#2a2a3e] cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                >
                    <div className="text-2xl md:text-4xl font-bold font-[var(--font-jetbrains-mono)] mb-2">{slowMovingItems.length}</div>
                    <div className="text-[#8a8a9a] text-sm">Items de lento movimiento</div>
                    <div className="text-[14px] font-bold text-[#f1f1f4] mt-2 flex items-center gap-2">
                        <span className="text-xl">🐌</span> Más lentos
                    </div>
                </div>

                {/* Card 3: Overstock */}
                <div
                    onClick={() => openModal("Items con sobrestock", "overstock", overstockItems)}
                    className="bg-[#12121a] p-6 rounded-xl border-l-[6px] border-l-[#f59e0b] border-y border-r border-y-[#2a2a3e] border-r-[#2a2a3e] cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                >
                    <div className="text-2xl md:text-4xl font-bold font-[var(--font-jetbrains-mono)] mb-2">{overstockItems.length}</div>
                    <div className="text-[#8a8a9a] text-sm">Items con sobrestock</div>
                    <div className="text-[14px] font-bold text-[#f1f1f4] mt-2 flex items-center gap-2">
                        <span className="text-xl">📈</span> Sobre exceso
                    </div>
                </div>

                {/* Card 4: Understock */}
                <div
                    onClick={() => openModal("Items bajo el ideal", "understock", understockItems)}
                    className="bg-[#12121a] p-6 rounded-xl border-l-[6px] border-l-[#ef4444] border-y border-r border-y-[#2a2a3e] border-r-[#2a2a3e] cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                >
                    <div className="text-2xl md:text-4xl font-bold font-[var(--font-jetbrains-mono)] mb-2">{understockItems.length}</div>
                    <div className="text-[#8a8a9a] text-sm">Items bajo el ideal</div>
                    <div className="text-[14px] font-bold text-[#f1f1f4] mt-2 flex items-center gap-2">
                        <span className="text-xl">📉</span> En déficit
                    </div>
                </div>
            </div>

            {/* Critical Alerts Table */}
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden mt-8">
                <div className="p-6 border-b border-[#2a2a3e]">
                    <h2 className="text-xl font-bold flex items-center gap-2">⚠️ Alertas Críticas</h2>
                </div>
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-[#1a1a2e] text-[#8a8a9a] text-[12px] md:text-sm">
                                <th className="p-3 md:p-4 font-medium">Nombre</th>
                                <th className="p-3 md:p-4 font-medium hidden sm:table-cell">Categoría</th>
                                <th className="p-3 md:p-4 font-medium text-right">Stock</th>
                                <th className="p-3 md:p-4 font-medium text-right hidden md:table-cell">Min</th>
                                <th className="p-3 md:p-4 font-medium text-right hidden md:table-cell">Ideal</th>
                                <th className="p-3 md:p-4 font-medium text-right">Días Rest.</th>
                                <th className="p-3 md:p-4 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a3e]">
                            {criticalAlerts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[#8a8a9a]">No hay alertas críticas en este momento.</td>
                                </tr>
                            ) : (
                                criticalAlerts.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#1a1a2e]/50 transition-colors text-[12px] md:text-sm">
                                        <td className="p-3 md:p-4 font-medium">{item.nombre}</td>
                                        <td className="p-3 md:p-4 text-[#8a8a9a] text-[12px] md:text-sm hidden sm:table-cell">{item.categoria}</td>
                                        <td className="p-3 md:p-4 text-right font-[var(--font-jetbrains-mono)]">{item.existencias}</td>
                                        <td className="p-3 md:p-4 text-right font-[var(--font-jetbrains-mono)] text-[#8a8a9a] hidden md:table-cell">{item.min_level}</td>
                                        <td className="p-3 md:p-4 text-right font-[var(--font-jetbrains-mono)] text-[#8a8a9a] hidden md:table-cell">{item.stock_ideal}</td>
                                        <td className="p-3 md:p-4 text-right font-[var(--font-jetbrains-mono)]">{Number(item.dias_stock_restante).toFixed(1)}</td>
                                        <td className="p-3 md:p-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${item.nivel_alerta === "AGOTADO" ? "bg-[#ef4444]/20 text-[#ef4444]" :
                                                item.nivel_alerta === "URGENTE" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                                                    item.nivel_alerta === "PRONTO" ? "bg-[#3b82f6]/20 text-[#3b82f6]" :
                                                        "bg-[#22c55e]/20 text-[#22c55e]"
                                                }`}>
                                                {item.nivel_alerta}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Overlay Component */}
            {modal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl w-[95vw] md:w-full md:max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-[#2a2a3e] flex justify-between items-center shrink-0">
                            <h3 className="text-lg md:text-xl font-bold">{modal.title}</h3>
                            <button
                                onClick={closeModal}
                                className="text-[#8a8a9a] hover:text-[#f1f1f4] transition-colors p-1"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {modal.items.length === 0 ? (
                                <p className="text-[#8a8a9a] text-center py-8">No hay elementos para mostrar en esta categoría.</p>
                            ) : (
                                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="text-[#8a8a9a] text-sm border-b border-[#2a2a3e]">
                                                <th className="pb-3 font-medium">Nombre</th>
                                                <th className="pb-3 font-medium text-right">Stock</th>

                                                {/* Dynamic Columns based on type */}
                                                {(modal.type === "fast_depleting" || modal.type === "slow_moving") && (
                                                    <th className="pb-3 font-medium text-right">Días Restantes</th>
                                                )}

                                                {modal.type === "fast_depleting" && (
                                                    <th className="pb-3 font-medium text-center">Alerta</th>
                                                )}

                                                {modal.type === "slow_moving" && (
                                                    <th className="pb-3 font-medium text-right">Consumo Diario</th>
                                                )}

                                                {(modal.type === "overstock" || modal.type === "understock") && (
                                                    <th className="pb-3 font-medium text-right hidden sm:table-cell">Stock Ideal</th>
                                                )}

                                                {modal.type === "overstock" && (
                                                    <th className="pb-3 font-medium text-right">Diferencia</th>
                                                )}

                                                {modal.type === "understock" && (
                                                    <th className="pb-3 font-medium text-right">A Comprar</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2a2a3e]">
                                            {modal.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-[#12121a]/50 border-b border-[#2a2a3e]/50 last:border-0">
                                                    <td className="py-3 pr-2 font-medium">{item.nombre}</td>
                                                    <td className="py-3 px-2 text-right font-[var(--font-jetbrains-mono)]">{item.existencias}</td>

                                                    {(modal.type === "fast_depleting" || modal.type === "slow_moving") && (
                                                        <td className="py-3 px-2 text-right font-[var(--font-jetbrains-mono)]">{Number(item.dias_stock_restante).toFixed(1)}</td>
                                                    )}

                                                    {modal.type === "fast_depleting" && (
                                                        <td className="py-3 px-2 text-center">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${item.nivel_alerta === "URGENTE" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                                                                "bg-[#3b82f6]/20 text-[#3b82f6]"
                                                                }`}>
                                                                {item.nivel_alerta}
                                                            </span>
                                                        </td>
                                                    )}

                                                    {modal.type === "slow_moving" && (
                                                        <td className="py-3 px-2 text-right font-[var(--font-jetbrains-mono)] text-[#8a8a9a]">{Number(item.consumo_promedio_diario).toFixed(1)}</td>
                                                    )}

                                                    {(modal.type === "overstock" || modal.type === "understock") && (
                                                        <td className="py-3 px-2 text-right font-[var(--font-jetbrains-mono)] text-[#8a8a9a] hidden sm:table-cell">{item.stock_ideal}</td>
                                                    )}

                                                    {modal.type === "overstock" && (
                                                        <td className="py-3 pl-2 text-right font-[var(--font-jetbrains-mono)] text-[#f59e0b]">+{(item.existencias - item.stock_ideal).toFixed(0)}</td>
                                                    )}

                                                    {modal.type === "understock" && (
                                                        <td className="py-3 pl-2 text-right font-[var(--font-jetbrains-mono)] text-[#ef4444]">{item.cantidad_a_comprar}</td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
