"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import * as XLSX from "xlsx";

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

const ITEMS_PER_PAGE = 25;

export default function InventarioPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategoria, setFilterCategoria] = useState("");
    const [filterProveedor, setFilterProveedor] = useState("");
    const [filterEstadoStock, setFilterEstadoStock] = useState("");
    const [filterNivelAlerta, setFilterNivelAlerta] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Export Dropdown State
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [isMobileExportDropdownOpen, setIsMobileExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);
    const mobileExportDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setIsExportDropdownOpen(false);
            }
            if (mobileExportDropdownRef.current && !mobileExportDropdownRef.current.contains(event.target as Node)) {
                setIsMobileExportDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        nombre: "",
        unidad_base: "",
        categoria: "",
        subcategoria: "",
        proveedor: "",
        min_level: 0,
        stock_ideal: 0,
        stock_inicial: 0, // Nuevo campo
        limite_cocina: 0,
        limite_bar_pb: 0,
        limite_bar_rooftop: 0,
    });

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/items");
            if (!res.ok) throw new Error("Failed to fetch items");
            const data = await res.json();
            setItems(data.data || []);
        } catch {
            setError("Error cargando inventario.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Filter Options
    const categories = useMemo(() => Array.from(new Set(items.map((i) => i.categoria).filter(Boolean))), [items]);
    const providers = useMemo(() => Array.from(new Set(items.map((i) => i.proveedor).filter(Boolean))), [items]);
    const units = useMemo(() => Array.from(new Set(items.map((i) => i.unidad_base).filter(Boolean))), [items]);

    // Derived state: Filtered items
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategoria = filterCategoria ? item.categoria === filterCategoria : true;
            const matchesProveedor = filterProveedor ? item.proveedor === filterProveedor : true;
            const matchesEstadoStock = filterEstadoStock ? item.estado_stock === filterEstadoStock : true;
            const matchesNivelAlerta = filterNivelAlerta ? item.nivel_alerta === filterNivelAlerta : true;

            return matchesSearch && matchesCategoria && matchesProveedor && matchesEstadoStock && matchesNivelAlerta;
        });
    }, [items, searchTerm, filterCategoria, filterProveedor, filterEstadoStock, filterNivelAlerta]);

    // Derived state: Pagination
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
    const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategoria, filterProveedor, filterEstadoStock, filterNivelAlerta]);

    const handleOpenCreateModal = () => {
        setEditingItem(null);
        setFormData({
            nombre: "", unidad_base: "", categoria: "", subcategoria: "", proveedor: "",
            min_level: 0, stock_ideal: 0, stock_inicial: 0, limite_cocina: 0, limite_bar_pb: 0, limite_bar_rooftop: 0,
        });
        setIsItemModalOpen(true);
    };

    const handleOpenEditModal = (item: Item) => {
        setEditingItem(item);
        setFormData({
            nombre: item.nombre,
            unidad_base: item.unidad_base,
            categoria: item.categoria,
            subcategoria: item.subcategoria,
            proveedor: item.proveedor,
            min_level: item.min_level,
            stock_ideal: item.stock_ideal,
            stock_inicial: 0, // Reset when editing because it's only for creation
            limite_cocina: item.limite_cocina,
            limite_bar_pb: item.limite_bar_pb,
            limite_bar_rooftop: item.limite_bar_rooftop,
        });
        setIsItemModalOpen(true);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
            const method = editingItem ? "PATCH" : "POST";

            const payload = {
                fields: {
                    nombre: formData.nombre,
                    unidad_base: formData.unidad_base,
                    categoria: formData.categoria,
                    subcategoria: formData.subcategoria,
                    proveedor: formData.proveedor,
                    min_level: Number(formData.min_level),
                    stock_ideal: Number(formData.stock_ideal),
                    limite_cocina: Number(formData.limite_cocina),
                    limite_bar_pb: Number(formData.limite_bar_pb),
                    limite_bar_rooftop: Number(formData.limite_bar_rooftop),
                } as any
            };

            // Solo enviar stock inicial si es POST (nuevo)
            if (!editingItem) {
                payload.fields.stock_inicial = Number(formData.stock_inicial);
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save item");

            await fetchItems();
            setIsItemModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/items/${itemToDelete.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields: { activo: false } }),
            });
            if (!res.ok) throw new Error("Failed to delete item");

            await fetchItems();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Error al desactivar item.");
        } finally {
            setIsSaving(false);
            setItemToDelete(null);
        }
    };

    const getExportData = () => {
        return filteredItems.map(item => ({
            "Nombre": item.nombre,
            "Categoría": item.categoria,
            "Subcategoría": item.subcategoria,
            "Unidad": item.unidad_base,
            "Existencias": item.existencias,
            "Mínimo": item.min_level,
            "Stock Ideal": item.stock_ideal,
            "Estado": item.estado_stock,
            "Proveedor": item.proveedor,
            "Nivel Alerta": item.nivel_alerta
        }));
    };

    const handleExportCSV = () => {
        const data = getExportData();
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
        ].join('\n');

        const bom = "\uFEFF";
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `inventario_pulpo_negro_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportDropdownOpen(false);
        setIsMobileExportDropdownOpen(false);
    };

    const handleExportExcel = () => {
        const data = getExportData();
        if (data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

        XLSX.writeFile(workbook, `inventario_pulpo_negro_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExportDropdownOpen(false);
        setIsMobileExportDropdownOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 text-[#d4a853] animate-spin mb-4" />
                <p className="text-[#8a8a9a]">Cargando inventario...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-6 bg-[#12121a] rounded-xl border border-[#ef4444] text-[#ef4444]">{error}</div>;
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 hidden md:flex">
                <div className="flex items-center gap-3">
                    <div className="relative" ref={exportDropdownRef}>
                        <button
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                            className="bg-[#12121a] hover:bg-[#1a1a2e] border border-[#2a2a3e] text-[#f1f1f4] font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
                        >
                            <Download size={20} /> Exportar
                        </button>
                        {isExportDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] border border-[#2a2a3e] rounded-md shadow-xl z-10 overflow-hidden">
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full text-left px-4 py-2 text-[#f1f1f4] hover:bg-[#2a2a3e] transition-colors"
                                >
                                    Exportar CSV
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="w-full text-left px-4 py-2 text-[#f1f1f4] hover:bg-[#2a2a3e] transition-colors"
                                >
                                    Exportar Excel
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="bg-[#d4a853] hover:bg-[#e2bd6e] text-black font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} /> Nuevo Item
                    </button>
                </div>
            </div>

            {/* Mobile Top Create Button */}
            <div className="md:hidden flex flex-col gap-3">
                <button
                    onClick={handleOpenCreateModal}
                    className="w-full bg-[#d4a853] hover:bg-[#e2bd6e] text-black font-bold py-[12px] px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-[14px]"
                >
                    <Plus size={20} className="shrink-0" />
                    <span>Nuevo Item</span>
                </button>
                <div className="relative w-full" ref={mobileExportDropdownRef}>
                    <button
                        onClick={() => setIsMobileExportDropdownOpen(!isMobileExportDropdownOpen)}
                        className="w-full bg-[#12121a] hover:bg-[#1a1a2e] border border-[#2a2a3e] text-[#f1f1f4] font-bold py-[12px] px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-[14px]"
                    >
                        <Download size={20} className="shrink-0" />
                        <span>Exportar</span>
                    </button>
                    {isMobileExportDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-md shadow-xl z-[60] overflow-hidden">
                            <button
                                onClick={handleExportCSV}
                                className="w-full text-center px-4 py-3 text-[#f1f1f4] hover:bg-[#2a2a3e] transition-colors border-b border-[#2a2a3e] text-[14px]"
                            >
                                Exportar CSV
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="w-full text-center px-4 py-3 text-[#f1f1f4] hover:bg-[#2a2a3e] transition-colors"
                            >
                                Exportar Excel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#12121a] p-4 rounded-xl border border-[#2a2a3e] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a9a]" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-md text-[#f1f1f4] focus:outline-none focus:border-[#d4a853] transition-colors"
                    />
                </div>

                <select
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-md text-[#f1f1f4] focus:outline-none focus:border-[#d4a853] transition-colors appearance-none"
                >
                    <option value="">Todas las Categorías</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    value={filterProveedor}
                    onChange={(e) => setFilterProveedor(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-md text-[#f1f1f4] focus:outline-none focus:border-[#d4a853] transition-colors appearance-none"
                >
                    <option value="">Todos los Proveedores</option>
                    {providers.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                    value={filterEstadoStock}
                    onChange={(e) => setFilterEstadoStock(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-md text-[#f1f1f4] focus:outline-none focus:border-[#d4a853] transition-colors appearance-none"
                >
                    <option value="">Cualquier Estado</option>
                    <option value="ÓPTIMO">ÓPTIMO</option>
                    <option value="DÉFICIT">DÉFICIT</option>
                    <option value="EXCESO">EXCESO</option>
                </select>

                <select
                    value={filterNivelAlerta}
                    onChange={(e) => setFilterNivelAlerta(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-md text-[#f1f1f4] focus:outline-none focus:border-[#d4a853] transition-colors appearance-none"
                >
                    <option value="">Cualquier Alerta</option>
                    <option value="OK">OK</option>
                    <option value="PRONTO">PRONTO</option>
                    <option value="URGENTE">URGENTE</option>
                    <option value="AGOTADO">AGOTADO</option>
                    <option value="SIN DATOS">SIN DATOS</option>
                </select>
            </div>

            <div className="text-[#8a8a9a] text-sm">
                Mostrando {filteredItems.length} items en total
            </div>

            {/* Desktop Items Table */}
            <div className="hidden md:block bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-[#1a1a2e] text-[#8a8a9a] text-sm border-b border-[#2a2a3e]">
                                <th className="p-4 font-medium">Nombre</th>
                                <th className="p-4 font-medium">Categoría</th>
                                <th className="p-4 font-medium hidden lg:table-cell">Subcategoría</th>
                                <th className="p-4 font-medium">Ud.</th>
                                <th className="p-4 font-medium text-right">Stock</th>
                                <th className="p-4 font-medium text-right hidden xl:table-cell">Min / Ideal</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium hidden md:table-cell">Proveedor</th>
                                <th className="p-4 font-medium text-center">Alerta</th>
                                <th className="p-4 font-medium text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a3e]">
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-[#8a8a9a]">No se encontraron items.</td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#1a1a2e] transition-colors">
                                        <td className="p-4 font-medium">{item.nombre}</td>
                                        <td className="p-4 text-sm">{item.categoria}</td>
                                        <td className="p-4 text-sm text-[#8a8a9a] hidden lg:table-cell">{item.subcategoria}</td>
                                        <td className="p-4 text-sm text-[#8a8a9a]">{item.unidad_base}</td>
                                        <td className="p-4 text-right font-[var(--font-jetbrains-mono)] font-bold">{item.existencias}</td>
                                        <td className="p-4 text-right font-[var(--font-jetbrains-mono)] text-sm text-[#8a8a9a] hidden xl:table-cell">
                                            {item.min_level} / {item.stock_ideal}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${item.estado_stock === "DÉFICIT" ? "bg-[#ef4444]/20 text-[#ef4444]" :
                                                item.estado_stock === "EXCESO" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                                                    "bg-[#22c55e]/20 text-[#22c55e]"
                                                }`}>
                                                {item.estado_stock}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-[#8a8a9a] hidden md:table-cell truncate max-w-[150px]">{item.proveedor}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${item.nivel_alerta === "AGOTADO" ? "bg-[#ef4444]/20 text-[#ef4444]" :
                                                item.nivel_alerta === "URGENTE" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                                                    item.nivel_alerta === "PRONTO" ? "bg-[#3b82f6]/20 text-[#3b82f6]" :
                                                        item.nivel_alerta === "OK" ? "bg-[#22c55e]/20 text-[#22c55e]" :
                                                            "bg-[#2a2a3e] text-[#8a8a9a]"
                                                }`}>
                                                {item.nivel_alerta}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(item)}
                                                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#8a8a9a] hover:text-[#d4a853] hover:bg-[#d4a853]/10 rounded-md transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                                                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#8a8a9a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-md transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards Layout */}
            <div className="md:hidden grid grid-cols-1 gap-[10px]">
                {paginatedItems.length === 0 ? (
                    <div className="p-8 text-center text-[#8a8a9a] bg-[#12121a] rounded-[12px] border border-[#2a2a3e]">No se encontraron items.</div>
                ) : (
                    paginatedItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleOpenEditModal(item)}
                            className="bg-[#12121a] border border-[#2a2a3e] rounded-[12px] p-[14px] flex flex-col gap-2 relative cursor-pointer active:bg-[#1a1a2e] transition-colors"
                        >
                            {/* Line 1: Name + Badge */}
                            <div className="flex justify-between items-start pr-10">
                                <span className="font-bold text-[#f1f1f4] leading-tight">{item.nombre}</span>
                                <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${item.estado_stock === "DÉFICIT" ? "bg-[#ef4444]/20 text-[#ef4444]" :
                                    item.estado_stock === "EXCESO" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                                        "bg-[#22c55e]/20 text-[#22c55e]"
                                    }`}>
                                    {item.estado_stock}
                                </span>
                            </div>

                            {/* Delete Button top-right absolute */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setItemToDelete(item); setIsDeleteModalOpen(true); }}
                                className="absolute top-[10px] right-[10px] p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-[#8a8a9a] hover:text-[#ef4444] rounded-md transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={18} />
                            </button>

                            {/* Line 2: Category */}
                            <div className="text-[#8a8a9a] text-[13px]">
                                {item.categoria} {item.subcategoria && `> ${item.subcategoria}`}
                            </div>

                            {/* Line 3: Stock Data */}
                            <div className="flex items-center gap-3 text-[13px] text-[#f1f1f4]">
                                <span>Stock: <span className="font-[var(--font-jetbrains-mono)] font-bold">{item.existencias}</span></span>
                                <span className="text-[#8a8a9a]">|</span>
                                <span>Min: <span className="font-[var(--font-jetbrains-mono)]">{item.min_level}</span></span>
                                <span className="text-[#8a8a9a]">|</span>
                                <span>Ideal: <span className="font-[var(--font-jetbrains-mono)]">{item.stock_ideal}</span></span>
                            </div>

                            {/* Line 4: Provider + Alert */}
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[13px] text-[#8a8a9a] truncate pr-2">{item.proveedor || "Sin proveedor"}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase shrink-0 ${item.nivel_alerta === "AGOTADO" ? "bg-[#ef4444]/20 text-[#ef4444]" :
                                    item.nivel_alerta === "URGENTE" ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                                        item.nivel_alerta === "PRONTO" ? "bg-[#3b82f6]/20 text-[#3b82f6]" :
                                            item.nivel_alerta === "OK" ? "bg-[#22c55e]/20 text-[#22c55e]" :
                                                "bg-[#2a2a3e] text-[#8a8a9a]"
                                    }`}>
                                    {item.nivel_alerta}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-[#2a2a3e] md:border-t-0 md:p-0 flex items-center justify-between md:mt-4">
                    <span className="text-sm text-[#8a8a9a]">Página {currentPage} de {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-md border border-[#2a2a3e] bg-[#12121a] hover:bg-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-md border border-[#2a2a3e] bg-[#12121a] hover:bg-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Item Form Modal */}
            {isItemModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl w-[95vw] md:w-full md:max-w-3xl flex flex-col shadow-2xl max-h-[90vh]">
                        <div className="p-6 border-b border-[#2a2a3e] flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-bold">{editingItem ? "Editar Item" : "Nuevo Item"}</h3>
                            <button onClick={() => setIsItemModalOpen(false)} className="text-[#8a8a9a] hover:text-[#f1f1f4] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Nombre <span className="text-[#ef4444]">*</span></label>
                                    <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Unidad Base <span className="text-[#ef4444]">*</span></label>
                                    <input required type="text" list="unitsList" value={formData.unidad_base} onChange={e => setFormData({ ...formData, unidad_base: e.target.value })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none" />
                                    <datalist id="unitsList">
                                        {units.map(u => <option key={u} value={u} />)}
                                    </datalist>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Categoría</label>
                                    <input type="text" list="catList" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none" />
                                    <datalist id="catList">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Subcategoría</label>
                                    <input type="text" value={formData.subcategoria} onChange={e => setFormData({ ...formData, subcategoria: e.target.value })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Proveedor</label>
                                    <input type="text" list="provList" value={formData.proveedor} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none" />
                                    <datalist id="provList">
                                        {providers.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>

                                <div className="space-y-2 hidden md:block"></div>

                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Mínimo Nivel</label>
                                    <input type="number" step="0.01" value={formData.min_level} onChange={e => setFormData({ ...formData, min_level: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none font-[var(--font-jetbrains-mono)]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Stock Ideal</label>
                                    <input type="number" step="0.01" value={formData.stock_ideal} onChange={e => setFormData({ ...formData, stock_ideal: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none font-[var(--font-jetbrains-mono)]" />
                                </div>

                                {!editingItem && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-[#8a8a9a]">Stock Inicial</label>
                                        <input type="number" step="0.01" value={formData.stock_inicial} onChange={e => setFormData({ ...formData, stock_inicial: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none font-[var(--font-jetbrains-mono)]" />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Límite Cocina</label>
                                    <input type="number" step="0.01" value={formData.limite_cocina} onChange={e => setFormData({ ...formData, limite_cocina: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none font-[var(--font-jetbrains-mono)]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Límite Bar PB</label>
                                    <input type="number" step="0.01" value={formData.limite_bar_pb} onChange={e => setFormData({ ...formData, limite_bar_pb: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none font-[var(--font-jetbrains-mono)]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-[#8a8a9a]">Límite Bar Rooftop</label>
                                    <input type="number" step="0.01" value={formData.limite_bar_rooftop} onChange={e => setFormData({ ...formData, limite_bar_rooftop: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#12121a] border border-[#2a2a3e] rounded-md focus:border-[#d4a853] outline-none font-[var(--font-jetbrains-mono)]" />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsItemModalOpen(false)}
                                    className="px-6 py-2 rounded-md border border-[#2a2a3e] text-[#f1f1f4] hover:bg-[#2a2a3e] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 rounded-md bg-[#d4a853] text-black font-bold hover:bg-[#e2bd6e] transition-colors flex items-center gap-2"
                                >
                                    {isSaving && <Loader2 size={18} className="animate-spin" />}
                                    {isSaving ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">¿Confirmar Desactivación?</h3>
                        <p className="text-[#8a8a9a] mb-6">El item <strong className="text-[#f1f1f4]">{itemToDelete.nombre}</strong> será marcado como inactivo y no aparecerá en las tablas principales.</p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-md border border-[#2a2a3e] text-[#f1f1f4] hover:bg-[#2a2a3e] transition-colors"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-md bg-[#ef4444] text-white font-bold hover:bg-[#ef4444]/80 transition-colors flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                Desactivar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
