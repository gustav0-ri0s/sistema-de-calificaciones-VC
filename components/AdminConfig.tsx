
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, CheckCircle2, XCircle, Loader2, Search, Info, AlertCircle } from 'lucide-react';

interface CurricularArea {
    id: number;
    name: string;
    level: string;
    active: boolean;
}

const AdminConfig: React.FC = () => {
    const [areas, setAreas] = useState<CurricularArea[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curricular_areas')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setAreas(data || []);
        } catch (err) {
            console.error('Error fetching areas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const toggleAreaStatus = async (id: number, currentStatus: boolean) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('curricular_areas')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setAreas(prev => prev.map(a => a.id === id ? { ...a, active: !currentStatus } : a));
        } catch (err) {
            console.error('Error updating area status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredAreas = areas.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.level.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Configuración del Sistema</h2>
                    <p className="text-gray-500 font-medium">Gestión de áreas curriculares y visibilidad.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8 border-b bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-institutional/10 rounded-2xl text-institutional">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800">Áreas Curriculares</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Activar o desactivar visibilidad</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar área..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl w-full md:w-80 focus:ring-4 focus:ring-institutional/10 transition-all font-bold text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin text-institutional" size={48} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Área Curricular</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nivel</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Estado</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredAreas.map((area) => (
                                    <tr key={area.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-6">
                                            <span className="font-bold text-gray-800">{area.name}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-lg tracking-wider border border-gray-200">
                                                {area.level}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-center">
                                                {area.active ? (
                                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                                        <CheckCircle2 size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Activo</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full border border-rose-100">
                                                        <XCircle size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Inactivo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                disabled={updatingId === area.id}
                                                onClick={() => toggleAreaStatus(area.id, area.active)}
                                                className={`
                                                    px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95
                                                    ${area.active
                                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'
                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                    }
                                                    ${updatingId === area.id ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {updatingId === area.id ? (
                                                    <Loader2 size={14} className="animate-spin mx-auto" />
                                                ) : area.active ? (
                                                    'Desactivar'
                                                ) : (
                                                    'Activar'
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAreas.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-gray-400 font-bold italic">
                                            No se encontraron áreas curriculares.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-sm">
                <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                    <Info size={24} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-black text-amber-800 uppercase tracking-tight">Nota sobre las áreas inactivas</h4>
                    <p className="text-sm text-amber-900/70 font-medium leading-relaxed">
                        Desactivar un área ocultará todos los cursos asociados de la vista de los docentes y del monitoreo académico.
                        Los datos existentes no se borrarán, pero no serán accesibles hasta que el área se active de nuevo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminConfig;
