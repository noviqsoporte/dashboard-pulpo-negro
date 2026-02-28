"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Check, Copy, Download, Loader2 } from 'lucide-react';

interface Item {
    id: string;
    nombre: string;
    categoria: string;
    unidad_base: string;
    proveedor: string;
    stock_ideal: number;
    stock_raw: number;
    existencias: number;
    cantidad_a_comprar: number;
}

export default function ComprasPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch('/api/items');
                const data = await res.json();
                if (data.success) {
                    setItems(data.data as Item[]);
                }
            } catch (error) {
                console.error("Error fetching items:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const providers = useMemo(() => {
        const provs = items.map(item => item.proveedor).filter(Boolean);
        return Array.from(new Set(provs)).sort();
    }, [items]);

    const itemsToBuy = useMemo(() => {
        if (!selectedProvider) return [];
        return items.filter(item => item.proveedor === selectedProvider && item.cantidad_a_comprar > 0);
    }, [items, selectedProvider]);

    // Handle Select All
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItems(new Set(itemsToBuy.map(item => item.id)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedItems);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedItems(newSelected);
    };

    // Generate text format
    const generateText = () => {
        const dateStr = new Date().toLocaleDateString('es-ES');
        let text = `📦 Lista de Compras - ${selectedProvider}\n`;
        text += `Fecha: ${dateStr}\n`;
        text += `─────────────────\n`;

        const selectedItemsList = itemsToBuy.filter(i => selectedItems.has(i.id));
        selectedItemsList.forEach(item => {
            text += `• ${item.nombre} — ${item.cantidad_a_comprar} ${item.unidad_base} (actual: ${item.existencias})\n`;
        });

        text += `─────────────────\n`;
        text += `Total: ${selectedItemsList.length} items\n`;
        return text;
    };

    const handleCopy = async () => {
        const text = generateText();
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                throw new Error("Clipboard API not available");
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for HTTP environments or when Clipboard API fails
            const textArea = document.createElement("textarea");
            textArea.value = text;
            // Avoid scrolling to bottom
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                } else {
                    console.error('Fallback copy was unsuccessful');
                }
            } catch (e) {
                console.error('Fallback copy failed', e);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleDownload = () => {
        const text = generateText();
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista_compras_${selectedProvider.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#d4a853]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 hidden md:flex">
                <h1 className="text-2xl font-bold">Lista de Compras</h1>
                <p className="text-[#8a8a9a]">Genera la lista de insumos a comprar por proveedor.</p>
            </div>

            {/* Provider Selection */}
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-400 mb-3">
                    Seleccionar Proveedor
                </label>
                <select
                    className="w-full md:w-1/3 bg-[#12121a] border border-[#2a2a3e] rounded-lg p-3 text-white outline-none focus:border-[#d4a853] transition-colors appearance-none cursor-pointer"
                    value={selectedProvider}
                    onChange={(e) => {
                        setSelectedProvider(e.target.value);
                        setSelectedItems(new Set()); // Reset selections on provider change
                    }}
                >
                    <option value="">-- Seleccionar --</option>
                    {providers.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>

                {selectedProvider && (
                    <p className="mt-4 text-gray-400">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-white font-bold">{itemsToBuy.length}</span> items necesitan restock de <span className="text-white font-semibold">{selectedProvider}</span>
                    </p>
                )}
            </div>

            {/* Empty States */}
            {!selectedProvider && (
                <div className="flex flex-col items-center justify-center py-20 bg-[#12121a]/50 border border-[#2a2a3e]/50 rounded-xl">
                    <ShoppingCart size={80} color="#8a8a9a" className="mb-6 opacity-50" />
                    <p className="text-[#8a8a9a] text-lg font-medium">Selecciona un proveedor para generar la lista de compras</p>
                </div>
            )}

            {selectedProvider && itemsToBuy.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-[#12121a] border border-[#2a2a3e] rounded-xl">
                    <p className="text-green-400 text-lg flex items-center gap-2">
                        <Check size={24} />
                        Todo en orden con {selectedProvider}, no hay items por comprar
                    </p>
                </div>
            )}

            {/* Table & Actions */}
            {selectedProvider && itemsToBuy.length > 0 && (
                <>
                    <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-xl border border-[#2a2a3e] bg-[#12121a]">
                        <table className="w-full text-left text-sm text-gray-300 min-w-[600px]">
                            <thead className="bg-[#1a1a2e] border-b border-[#2a2a3e] text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-[#2a2a3e] bg-[#12121a] text-[#d4a853] focus:ring-[#d4a853] accent-[#d4a853] cursor-pointer"
                                            checked={selectedItems.size === itemsToBuy.length && itemsToBuy.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Categoría</th>
                                    <th className="p-4 text-right whitespace-nowrap">Stock Actual</th>
                                    <th className="p-4 text-right whitespace-nowrap">Stock Ideal</th>
                                    <th className="p-4 text-right whitespace-nowrap">A Comprar</th>
                                    <th className="p-4">Unidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2a3e]">
                                {itemsToBuy.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#1a1a2e] transition-colors">
                                        <td className="p-4 min-w-[44px]">
                                            <div className="flex items-center justify-center w-full h-full min-h-[44px]">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-[#2a2a3e] bg-[#12121a] text-[#d4a853] focus:ring-[#d4a853] accent-[#d4a853] cursor-pointer"
                                                    checked={selectedItems.has(item.id)}
                                                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-white">{item.nombre}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-full bg-[#1a1a2e] border border-[#2a2a3e] text-xs">{item.categoria}</span>
                                        </td>
                                        <td className="p-4 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.existencias}</td>
                                        <td className="p-4 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.stock_ideal}</td>
                                        <td className="p-4 text-right font-bold text-[#ef4444]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                            {item.cantidad_a_comprar}
                                        </td>
                                        <td className="p-4 text-gray-400">{item.unidad_base}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#12121a] p-4 rounded-xl border border-[#2a2a3e] sticky bottom-6 shadow-2xl">
                        <div className="text-gray-300 font-medium">
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-white font-bold">{selectedItems.size}</span> items seleccionados
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={handleCopy}
                                disabled={selectedItems.size === 0}
                                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-semibold py-2 px-6 rounded-lg transition-colors ${selectedItems.size === 0 ? 'bg-[#d4a853] text-black opacity-50 cursor-not-allowed' : 'bg-[#d4a853] hover:bg-[#c39742] text-black'}`}
                            >
                                <Copy size={18} />
                                Copiar Lista
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={selectedItems.size === 0}
                                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-semibold py-2 px-6 rounded-lg border border-[#2a2a3e] transition-colors ${selectedItems.size === 0 ? 'bg-transparent text-white opacity-50 cursor-not-allowed' : 'bg-transparent hover:bg-[#1a1a2e] text-white'}`}
                            >
                                <Download size={18} />
                                Descargar TXT
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg z-50 animate-bounce">
                    <Check size={20} />
                    <span className="font-medium animate-pulse">Lista copiada al portapapeles ✓</span>
                </div>
            )}
        </div>
    );
}
