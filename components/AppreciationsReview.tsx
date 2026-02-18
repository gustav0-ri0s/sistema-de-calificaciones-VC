
import React, { useState, useEffect } from 'react';
import { UserRole, Student, Bimestre } from '../types';
import { MessageSquare, CheckCircle2, RotateCw, Check, X, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DescriptiveCommentModal from './DescriptiveCommentModal';

interface AppreciationsReviewProps {
    role: UserRole;
    bimestre: Bimestre;
    allBimestres: Bimestre[];
    onBimestreChange: (b: Bimestre) => void;
    onApproveAppreciation: (sId: string) => void;
    onUpdateAppreciation: (sId: string, comment: string) => void;
}

const AppreciationsReview: React.FC<AppreciationsReviewProps> = ({
    role,
    bimestre,
    allBimestres,
    onBimestreChange,
    onApproveAppreciation,
    onUpdateAppreciation
}) => {
    const [loading, setLoading] = useState(true);
    const [appreciationsList, setAppreciationsList] = useState<any[]>([]);
    const [activeCommentStudent, setActiveCommentStudent] = useState<Student | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAppreciations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_appreciations')
                .select(`
          student_id,
          comment,
          is_approved,
          students (
            id,
            first_name,
            last_name,
            classrooms (
              grade,
              section,
              level
            )
          )
        `)
                .eq('bimestre_id', parseInt(bimestre.id));

            if (error) throw error;

            if (data) {
                const mapped = data.map((item: any) => ({
                    studentId: item.student_id,
                    comment: item.comment,
                    isApproved: item.is_approved,
                    studentName: `${item.students?.last_name}, ${item.students?.first_name}`,
                    classroom: `${item.students?.classrooms?.grade} ${item.students?.classrooms?.section} ${item.students?.classrooms?.level}`,
                    studentObj: {
                        id: item.student_id,
                        fullName: `${item.students?.last_name}, ${item.students?.first_name}`,
                        classroomId: 0 // Not needed for this view
                    }
                }));
                setAppreciationsList(mapped);
            }
        } catch (err) {
            console.error('Error fetching appreciations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppreciations();
    }, [bimestre.id]);

    const filteredList = appreciationsList.filter(item => {
        const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.classroom.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'pending' && !item.isApproved) ||
            (filter === 'approved' && item.isApproved);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Revisión de Apreciaciones</h2>
                    <p className="text-gray-500 font-medium">Gestión de comentarios de tutoría - {bimestre.label}</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {allBimestres.map(b => (
                        <button
                            key={b.id}
                            onClick={() => !b.isLocked && onBimestreChange(b)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${bimestre.id === b.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex gap-2">
                    {[
                        { id: 'pending', label: 'Pendientes', icon: <RotateCw size={14} /> },
                        { id: 'approved', label: 'Aprobados', icon: <CheckCircle2 size={14} /> },
                        { id: 'all', label: 'Todos', icon: <Filter size={14} /> }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${filter === f.id
                                ? 'bg-institutional text-white shadow-md'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar estudiante o salón..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-institutional/20 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Cargando apreciaciones...</div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-gray-400">
                        No se encontraron apreciaciones con los filtros actuales.
                    </div>
                ) : (
                    filteredList.map((item) => (
                        <div key={item.studentId} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-black text-gray-800 text-lg">{item.studentName}</h3>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black uppercase rounded-md tracking-wide">{item.classroom}</span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-600 italic border-l-4 border-institutional relative">
                                    <MessageSquare className="absolute top-2 right-2 text-gray-200" size={16} />
                                    "{item.comment}"
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                                <button
                                    onClick={() => setActiveCommentStudent(item.studentObj)}
                                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-institutional transition-all text-xs font-bold uppercase"
                                >
                                    Editar
                                </button>

                                {!item.isApproved ? (
                                    <button
                                        onClick={() => {
                                            onApproveAppreciation(item.studentId);
                                            // Optimistic update
                                            setAppreciationsList(prev => prev.map(p => p.studentId === item.studentId ? { ...p, isApproved: true } : p));
                                        }}
                                        className="flex-1 px-6 py-2 rounded-xl bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Aprobar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            onApproveAppreciation(item.studentId);
                                            // Optimistic update
                                            setAppreciationsList(prev => prev.map(p => p.studentId === item.studentId ? { ...p, isApproved: false } : p));
                                        }}
                                        className="flex-1 px-6 py-2 rounded-xl bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all text-xs font-black uppercase flex items-center justify-center gap-2"
                                    >
                                        <RotateCw size={14} /> Revertir
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {activeCommentStudent && (
                <DescriptiveCommentModal
                    role={role}
                    student={activeCommentStudent}
                    currentComment={appreciationsList.find(a => a.studentId === activeCommentStudent.id)?.comment || ''}
                    isApproved={appreciationsList.find(a => a.studentId === activeCommentStudent.id)?.isApproved || false}
                    onClose={() => setActiveCommentStudent(null)}
                    onSave={(val) => {
                        onUpdateAppreciation(activeCommentStudent.id, val);
                        setActiveCommentStudent(null);
                        // Optimistic
                        setAppreciationsList(prev => prev.map(p => p.studentId === activeCommentStudent.id ? { ...p, comment: val } : p));
                    }}
                    isLocked={bimestre.isLocked}
                    title="Apreciación Académica"
                />
            )}
        </div>
    );
};

export default AppreciationsReview;
