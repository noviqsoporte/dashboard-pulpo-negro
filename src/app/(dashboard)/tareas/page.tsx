"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Loader2, Calendar, User, Clock } from 'lucide-react';

interface Tarea {
    id: string;
    tarea: string;
    descripcion: string;
    responsable: string[]; // now an array of record IDs
    fecha_limite: string;
    fecha_finalizacion: string;
    estado: string;
    prioridad: string;
    activa: boolean;
    nombre_usuario?: string;
}

interface Usuario {
    id: string;
    nombre: string;
    id_telegram: string;
}

export default function TareasPage() {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [filterPrioridad, setFilterPrioridad] = useState('Todas');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Tarea> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resTareas, resUsuarios] = await Promise.all([
                fetch('/api/tareas'),
                fetch('/api/usuarios')
            ]);

            const dataTareas = await resTareas.json();
            const dataUsuarios = await resUsuarios.json();

            if (dataTareas.success) {
                setTareas(dataTareas.data as Tarea[]);
            }
            if (dataUsuarios.success) {
                setUsuarios(dataUsuarios.data as Usuario[]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (tarea?: Tarea) => {
        if (tarea) {
            setCurrentTask(tarea);
        } else {
            setCurrentTask({
                tarea: '',
                descripcion: '',
                estado: 'Sin empezar',
                prioridad: 'Media',
                fecha_limite: '',
                fecha_finalizacion: '',
                responsable: []
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentTask(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTask?.tarea) return;

        setIsSaving(true);
        try {
            if (currentTask.id) {
                // Update
                const fields = {
                    "Tarea": currentTask.tarea,
                    "Descripción": currentTask.descripcion,
                    "Estado": currentTask.estado,
                    "Prioridad": currentTask.prioridad,
                    "Responsable": currentTask.responsable && currentTask.responsable.length > 0 ? currentTask.responsable : undefined,
                    "Fecha Limite": currentTask.fecha_limite || null,
                    "Fecha de finalización": currentTask.fecha_finalizacion || null,
                };

                const res = await fetch(`/api/tareas/${currentTask.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields })
                });

                if (res.ok) {
                    await fetchData();
                    closeModal();
                }
            } else {
                // Create
                const fields = {
                    "Tarea": currentTask.tarea,
                    "Descripción": currentTask.descripcion,
                    "Estado": currentTask.estado || 'Sin empezar',
                    "Prioridad": currentTask.prioridad || 'Media',
                    "Responsable": currentTask.responsable && currentTask.responsable.length > 0 ? currentTask.responsable : undefined,
                    "Fecha Limite": currentTask.fecha_limite || null,
                    "Fecha de finalización": currentTask.fecha_finalizacion || null,
                };

                const res = await fetch('/api/tareas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields })
                });

                if (res.ok) {
                    await fetchData();
                    closeModal();
                }
            }
        } catch (error) {
            console.error("Error saving task:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Sort and filter tasks
    const filteredAndSortedTasks = useMemo(() => {
        let filtered = tareas.filter(t => t.activa);

        if (filterEstado !== 'Todos') {
            filtered = filtered.filter(t => t.estado === filterEstado);
        }
        if (filterPrioridad !== 'Todas') {
            filtered = filtered.filter(t => t.prioridad === filterPrioridad);
        }

        // Sort order
        const priorityValues: Record<string, number> = { "Alta": 3, "Media": 2, "Baja": 1 };

        return filtered.sort((a, b) => {
            // Completed tasks go to the bottom
            const aCompleted = a.estado === 'Completada';
            const bCompleted = b.estado === 'Completada';

            if (aCompleted && !bCompleted) return 1;
            if (!aCompleted && bCompleted) return -1;

            // By priority (Alta > Media > Baja)
            const pA = priorityValues[a.prioridad] || 0;
            const pB = priorityValues[b.prioridad] || 0;
            if (pA !== pB) return pB - pA;

            // By date limit asc
            if (a.fecha_limite && b.fecha_limite) {
                return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
            }
            if (a.fecha_limite) return -1;
            if (b.fecha_limite) return 1;

            return 0;
        });
    }, [tareas, filterEstado, filterPrioridad]);

    // Summaries
    const summaries = useMemo(() => {
        let pendientes = 0;
        let enProgreso = 0;
        let completadas = 0;

        tareas.filter(t => t.activa).forEach(t => {
            if (t.estado === 'Sin empezar') pendientes++;
            else if (t.estado === 'En progreso') enProgreso++;
            else if (t.estado === 'Completada') completadas++;
        });

        return { pendientes, enProgreso, completadas };
    }, [tareas]);

    const getPriorityBadge = (prioridad: string) => {
        switch (prioridad) {
            case 'Alta': return <span className="px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 rounded-full md:text-xs font-medium bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20">Alta</span>;
            case 'Media': return <span className="px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 rounded-full md:text-xs font-medium bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">Media</span>;
            case 'Baja': return <span className="px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 rounded-full md:text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">Baja</span>;
            default: return <span className="px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 rounded-full md:text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">{prioridad}</span>;
        }
    };

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'Sin empezar': return <span className="px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 rounded-full md:text-xs font-medium bg-[#8a8a9a]/10 text-[#8a8a9a] border border-[#8a8a9a]/20 whitespace-nowrap">Sin empezar</span>;
            case 'En progreso': return <span className="px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 rounded-full md:text-xs font-medium bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 whitespace-nowrap">En progreso</span>;
            case 'Completada': return <span className="px-2 py-0.5 text-[10px] md:px-2.5 md:py-1 rounded-full md:text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 whitespace-nowrap">Completada</span>;
            default: return null;
        }
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'Sin fecha';
        const d = new Date(dateStr);
        // Add timezone offset correction if strictly needed, but simple toLocale is usually fine for DB dates if simple
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getResponsablesNames = (tarea: Tarea) => {
        if (!tarea.responsable || tarea.responsable.length === 0) {
            return 'Sin asignar';
        }
        const names = tarea.responsable.map(respId => {
            const user = usuarios.find(u => u.id === respId);
            return user ? user.nombre : 'Desconocido';
        });
        return names.join(', ');
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <h1 className="text-2xl font-bold hidden md:block">Tareas</h1>

                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#d4a853] appearance-none cursor-pointer"
                        value={filterEstado}
                        onChange={e => setFilterEstado(e.target.value)}
                    >
                        <option value="Todos">Todos los Estados</option>
                        <option value="Sin empezar">Sin empezar</option>
                        <option value="En progreso">En progreso</option>
                        <option value="Completada">Completada</option>
                    </select>

                    <select
                        className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#d4a853] appearance-none cursor-pointer"
                        value={filterPrioridad}
                        onChange={e => setFilterPrioridad(e.target.value)}
                    >
                        <option value="Todas">Todas las Prioridades</option>
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                    </select>

                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center gap-2 bg-[#d4a853] hover:bg-[#c39742] text-black font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-[#d4a853]/20"
                    >
                        <Plus size={18} />
                        Nueva Tarea
                    </button>
                </div>
            </div>

            {/* Summary */}
            {!loading && (
                <div className="flex items-center gap-2 text-sm text-[#8a8a9a] bg-[#12121a] p-3 rounded-lg border border-[#2a2a3e] w-fit">
                    <span className="font-semibold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{summaries.pendientes}</span> tareas pendientes <span className="px-1 text-[#2a2a3e]">|</span>
                    <span className="font-semibold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{summaries.enProgreso}</span> en progreso <span className="px-1 text-[#2a2a3e]">|</span>
                    <span className="font-semibold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{summaries.completadas}</span> completadas
                </div>
            )}

            {/* Grid of Tasks */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#d4a853]" />
                </div>
            ) : filteredAndSortedTasks.length === 0 ? (
                <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-12 text-center flex flex-col items-center">
                    <Clock size={48} className="text-[#8a8a9a] mb-4 opacity-50" />
                    <p className="text-[#8a8a9a] text-lg">No hay tareas que coincidan con los filtros.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedTasks.map(tarea => {
                        const isCompleted = tarea.estado === 'Completada';

                        return (
                            <div
                                key={tarea.id}
                                onClick={() => openModal(tarea)}
                                className={`bg-[#12121a] border border-[#2a2a3e] hover:border-[#d4a853] rounded-xl p-4 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px] relative overflow-hidden ${isCompleted ? 'opacity-60 grayscale-[0.3]' : ''}`}
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className={`font-bold text-base leading-tight ${isCompleted ? 'line-through text-gray-500' : 'text-[#f1f1f4]'}`}>
                                        {tarea.tarea}
                                    </h3>
                                    <div className="flex-shrink-0">
                                        {getPriorityBadge(tarea.prioridad)}
                                    </div>
                                </div>

                                {/* Middle row */}
                                <div className="mb-4 flex-grow">
                                    <p className="text-[#8a8a9a] text-sm line-clamp-2 leading-relaxed">
                                        {tarea.descripcion || 'Sin descripción'}
                                    </p>
                                </div>

                                {/* Bottom row */}
                                <div className="flex items-end justify-between gap-2 mt-auto pt-4 border-t border-[#2a2a3e]/50">
                                    <div className="flex flex-col gap-1.5 min-w-0 max-w-[65%]">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate">
                                            <User size={12} className="text-[#8a8a9a] shrink-0" />
                                            <span className="truncate">{getResponsablesNames(tarea)}</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-xs truncate ${!tarea.fecha_limite ? 'text-gray-500' : new Date(tarea.fecha_limite) < new Date() && !isCompleted ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                                            <Calendar size={12} />
                                            <span className="truncate">{formatDate(tarea.fecha_limite)}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-2">
                                        {getStatusBadge(tarea.estado)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Creating / Editing */}
            {isModalOpen && currentTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl w-[95vw] md:w-full md:max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-[#2a2a3e]">
                            <h2 className="text-xl font-bold text-white">
                                {currentTask.id ? 'Editar Tarea' : 'Nueva Tarea'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-[#2a2a3e] min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5">
                            <form id="task-form" onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre de la tarea *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-[#f1f1f4] outline-none focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853]/50 transition-colors"
                                        placeholder="Ej. Revisar inventario del bar principal"
                                        value={currentTask.tarea || ''}
                                        onChange={e => setCurrentTask({ ...currentTask, tarea: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Descripción</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-[#f1f1f4] outline-none focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853]/50 transition-colors resize-none"
                                        placeholder="Detalles sobre la tarea..."
                                        value={currentTask.descripcion || ''}
                                        onChange={e => setCurrentTask({ ...currentTask, descripcion: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Estado</label>
                                        <select
                                            className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-[#f1f1f4] outline-none focus:border-[#d4a853] transition-colors appearance-none cursor-pointer"
                                            value={currentTask.estado || 'Sin empezar'}
                                            onChange={e => {
                                                const newEstado = e.target.value;
                                                const updates: Partial<Tarea> = { estado: newEstado };
                                                if (newEstado === 'Completada' && currentTask.estado !== 'Completada') {
                                                    updates.fecha_finalizacion = new Date().toISOString().split('T')[0];
                                                } else if (newEstado !== 'Completada') {
                                                    updates.fecha_finalizacion = '';
                                                }
                                                setCurrentTask({ ...currentTask, ...updates });
                                            }}
                                        >
                                            <option value="Sin empezar">Sin empezar</option>
                                            <option value="En progreso">En progreso</option>
                                            <option value="Completada">Completada</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Prioridad</label>
                                        <select
                                            className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-[#f1f1f4] outline-none focus:border-[#d4a853] transition-colors appearance-none cursor-pointer"
                                            value={currentTask.prioridad || 'Media'}
                                            onChange={e => setCurrentTask({ ...currentTask, prioridad: e.target.value })}
                                        >
                                            <option value="Alta">Alta</option>
                                            <option value="Media">Media</option>
                                            <option value="Baja">Baja</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Responsable(s)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {usuarios.map(u => {
                                            const isSelected = (currentTask.responsable || []).includes(u.id);
                                            return (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = currentTask.responsable || [];
                                                        const newResponsables = isSelected
                                                            ? current.filter(id => id !== u.id)
                                                            : [...current, u.id];
                                                        setCurrentTask({ ...currentTask, responsable: newResponsables });
                                                    }}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                        ? 'bg-[#d4a853]/20 border-[#d4a853] text-[#d4a853]'
                                                        : 'bg-[#12121a] border-[#2a2a3e] text-[#8a8a9a] hover:border-[#4a4a6e]'
                                                        }`}
                                                >
                                                    <User size={14} className={isSelected ? 'text-[#d4a853]' : 'text-[#8a8a9a]'} />
                                                    {u.nombre}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Fecha Límite</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-[#f1f1f4] outline-none focus:border-[#d4a853] transition-colors [color-scheme:dark]"
                                            value={currentTask.fecha_limite ? currentTask.fecha_limite.split('T')[0] : ''}
                                            onChange={e => setCurrentTask({ ...currentTask, fecha_limite: e.target.value })}
                                        />
                                    </div>

                                    {currentTask.estado === 'Completada' && (
                                        <div className="flex flex-col animate-in fade-in duration-300">
                                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Finalizada el</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg p-2.5 text-[#f1f1f4] outline-none focus:border-[#d4a853] transition-colors [color-scheme:dark]"
                                                value={currentTask.fecha_finalizacion ? currentTask.fecha_finalizacion.split('T')[0] : ''}
                                                onChange={e => setCurrentTask({ ...currentTask, fecha_finalizacion: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-[#2a2a3e] bg-[#1a1a2e] flex items-center justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-lg text-gray-300 border border-[#2a2a3e] hover:bg-[#2a2a3e] transition-colors font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="task-form"
                                disabled={isSaving || !currentTask.tarea?.trim()}
                                className="px-5 py-2.5 rounded-lg bg-[#d4a853] hover:bg-[#c39742] text-black font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(212,168,83,0.39)]"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
