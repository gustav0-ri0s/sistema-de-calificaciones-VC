
import React, { useState, useMemo } from 'react';
import { AcademicLoad, GradeEntry, GradeLevel, Student, UserRole } from '../types';
import { X, MessageSquare, Save, Sparkles, Loader2, Wand2, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MassiveConclusionModalProps {
    role: UserRole;
    course: AcademicLoad;
    students: Student[];
    grades: GradeEntry[];
    onClose: () => void;
    onSave: (competencyId: string, filterType: 'all_with_grade' | 'specific_grade' | 'empty_conclusion', filterValue: string, text: string) => void;
    isLocked: boolean;
}

const MassiveConclusionModal: React.FC<MassiveConclusionModalProps> = ({
    role,
    course,
    students,
    grades,
    onClose,
    onSave,
    isLocked
}) => {
    const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>(course.competencies[0]?.id || '');
    const [filterType, setFilterType] = useState<'all_with_grade' | 'specific_grade' | 'empty_conclusion'>('specific_grade');
    const [filterValue, setFilterValue] = useState<string>('AD');
    const [comment, setComment] = useState('');
    const [isImproving, setIsImproving] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    const affectedStudentsCount = useMemo(() => {
        if (!selectedCompetencyId) return 0;

        let count = 0;
        const targetCompetencies = selectedCompetencyId === 'ALL'
            ? course.competencies
            : course.competencies.filter(c => c.id === selectedCompetencyId);

        targetCompetencies.forEach(comp => {
            students.forEach(student => {
                const entry = grades.find(g => g.studentId === student.id && g.competencyId === comp.id);
                const grade = entry?.grade || '';
                const conclusion = entry?.descriptiveConclusion || '';

                if (!grade) return; // Must have a grade to have a conclusion

                let shouldCount = false;
                if (filterType === 'all_with_grade') shouldCount = true;
                if (filterType === 'specific_grade') shouldCount = grade === filterValue;
                if (filterType === 'empty_conclusion') shouldCount = !conclusion || conclusion.trim() === '';

                if (shouldCount) count++;
            });
        });

        return count;
    }, [students, grades, selectedCompetencyId, filterType, filterValue, course.competencies]);

    const handleSave = () => {
        if (isLocked) return;
        onSave(selectedCompetencyId, filterType, filterValue, comment);
    };

    const handleImproveWriting = async () => {
        if (!comment.trim() || isImproving) return;
        setIsImproving(true);
        setAiSuggestion(null);
        try {
            const { data, error } = await supabase.functions.invoke('improve-writing', {
                body: { text: comment }
            });

            if (error) throw error;
            if (data?.improvedText) {
                setAiSuggestion(data.improvedText);
            }
        } catch (err: any) {
            console.error('Error improving writing:', err);
        } finally {
            setIsImproving(false);
        }
    };

    const applySuggestion = () => {
        if (aiSuggestion) {
            setComment(aiSuggestion);
            setAiSuggestion(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-institutional/10 text-institutional rounded-xl">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Conclusiones Descriptivas Masivas</h3>
                            <p className="text-xs text-gray-500 font-medium">Aplique el mismo comentario a múltiples estudiantes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Competency Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Competencia</label>
                            <select
                                value={selectedCompetencyId}
                                onChange={(e) => setSelectedCompetencyId(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-institutional/20 transition-all"
                            >
                                <option value="ALL" className="font-black text-institutional">✨ Todas las competencias</option>
                                {course.competencies.map(comp => (
                                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Aplicar a:</label>
                            <div className="flex gap-2">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-institutional/20 transition-all"
                                >
                                    <option value="specific_grade">Estudiantes con nota...</option>
                                    <option value="empty_conclusion">Sin conclusión descriptiva</option>
                                    <option value="all_with_grade">Todos (con nota registrada)</option>
                                </select>

                                {filterType === 'specific_grade' && (
                                    <select
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className="w-24 p-3 rounded-xl bg-gray-50 border border-gray-200 font-black text-sm text-center text-gray-700 outline-none focus:ring-2 focus:ring-institutional/20 transition-all"
                                    >
                                        <option value="AD">AD</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800">
                        <AlertTriangle size={20} className="shrink-0" />
                        <p className="text-xs font-medium">
                            Se aplicará este comentario a <strong className="text-lg">{affectedStudentsCount}</strong> estudiantes.
                            {affectedStudentsCount === 0 && " (No se encontraron estudiantes que coincidan con el filtro)"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Conclusión Descriptiva</label>
                        <textarea
                            disabled={isLocked || affectedStudentsCount === 0}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={5}
                            className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-institutional/50 focus:bg-white transition-all text-sm text-gray-700 placeholder:text-gray-300 resize-none"
                            placeholder="Escriba aquí la conclusión descriptiva..."
                        ></textarea>

                        {/* AI Tools */}
                        {!aiSuggestion && (
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleImproveWriting}
                                    disabled={isImproving || !comment.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {isImproving ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                    Mejorar redacción con IA
                                </button>
                            </div>
                        )}

                        {aiSuggestion && (
                            <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100 border-dashed animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Sparkles size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Sugerencia IA</span>
                                    </div>
                                    <button onClick={() => setAiSuggestion(null)} className="text-gray-400 hover:text-gray-600">
                                        <X size={14} />
                                    </button>
                                </div>
                                <p className="text-xs text-indigo-900 leading-relaxed mb-4 italic">"{aiSuggestion}"</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={applySuggestion}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md"
                                    >
                                        <Check size={12} /> Usar Sugerencia
                                    </button>
                                    <button
                                        onClick={handleImproveWriting}
                                        className="p-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLocked || affectedStudentsCount === 0 || !comment.trim()}
                        className="px-6 py-2.5 bg-institutional text-white text-sm font-bold rounded-xl shadow-lg shadow-institutional/20 flex items-center gap-2 hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                        <Save size={16} /> Aplicar a {affectedStudentsCount} estudiantes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MassiveConclusionModal;
