import React, { useMemo } from 'react';
import {
    Users,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Star,
    Heart,
    ArrowRight,
    ClipboardList,
    Mail,
    MessageCircle
} from 'lucide-react';
import { AcademicLoad, Bimestre } from '../types';
import { Link } from 'react-router-dom';

interface TeacherDashboardProps {
    academicLoad: AcademicLoad[];
    tutorSections: AcademicLoad[];
    selectedBimestre: Bimestre | null;
    userName: string;
    progressStats: any; // Using any for simplicity as structure is dynamic jsonb
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
    academicLoad,
    tutorSections,
    selectedBimestre,
    userName,
    progressStats
}) => {

    const stats = useMemo(() => {
        return {
            totalCourses: academicLoad.length,
            totalStudents: academicLoad.length > 0 ? 30 : 0, // In a real app we'd sum unique students
            tutorCount: tutorSections.length,
            isBimestreOpen: !selectedBimestre?.isLocked,
            progressStats
        };
    }, [academicLoad, tutorSections, selectedBimestre, progressStats]);

    const progress = useMemo(() => {
        if (!stats.progressStats) return 0;

        const { course_stats, tutor_stats } = stats.progressStats;

        // Calculate totals
        const totalNeeded =
            (course_stats?.total_needed || 0) +
            (tutor_stats?.behavior_needed || 0) +
            (tutor_stats?.family_needed || 0) +
            (tutor_stats?.appreciations_needed || 0);

        if (totalNeeded === 0) return 0;

        const totalFilled =
            (course_stats?.total_filled || 0) +
            (tutor_stats?.behavior_filled || 0) +
            (tutor_stats?.family_filled || 0) +
            (tutor_stats?.appreciations_approved || 0);

        // Check for blockers
        // If there are missing mandatory conclusions, we might want to cap the progress or show a warning.
        // For now, simple percentage logic.

        return Math.round((totalFilled / totalNeeded) * 100);
    }, [stats.progressStats]);

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
            {/* Welcome Header */}
            <div className="mb-12">
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-3 tracking-tight">
                    ¡Hola, {userName.split(' ')[0]}! 👋
                </h2>
                <p className="text-slate-500 font-bold text-lg md:text-xl">
                    Este es tu resumen para el <span className="text-institutional">{selectedBimestre?.label}</span>.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-800 leading-none">{stats.totalCourses}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Cursos Asignados</p>
                        </div>
                    </div>
                    <Link to="/mis-cursos" className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all">
                        Ver Carga Académica <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-amber-500/5 transition-all">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">
                            <Star size={28} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-800 leading-none">{stats.tutorCount}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Secciones de Tutoría</p>
                        </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {stats.tutorCount > 0 ? 'Módulo de Tutoría Activo' : 'Sin tutoría asignada'}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-emerald-500/5 transition-all relative overflow-hidden">
                    <div className="flex items-center gap-5 mb-6 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                            {progress === 100 ? <CheckCircle2 size={28} /> : <ClipboardList size={28} />}
                        </div>
                        <div>
                            <p className={`text-3xl font-black leading-none ${progress === 100 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {progress}%
                            </p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Avance Bimestral</p>
                        </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-institutional'
                                }`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>{stats.isBimestreOpen ? 'En Progreso' : 'Cerrado'}</span>
                        {stats.progressStats?.course_stats?.missing_conclusions > 0 && (
                            <span className="text-red-500 flex items-center gap-1">
                                <AlertCircle size={10} />
                                Faltan Conclusiones
                            </span>
                        )}
                    </div>

                    {progress === 100 && (
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <CheckCircle2 size={120} />
                        </div>
                    )}
                </div>
            </div>



            {/* Upcoming Reminders (Future feature placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Anuncios del Colegio</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-start gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shrink-0 shadow-sm">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dirección Académica</p>
                                <p className="text-sm font-bold text-slate-700">
                                    Recuerden que el cierre de notas del {selectedBimestre?.label} {selectedBimestre?.end_date ? (
                                        <>es el próximo <span className="text-institutional font-black">{new Date(selectedBimestre.end_date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>.</>
                                    ) : 'está próximo a finalizar.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shrink-0 shadow-sm">
                                <CheckCircle2 size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Novedad</p>
                                <p className="text-sm font-bold text-slate-700">Se ha habilitado la nueva función de "Conclusiones Descriptivas Masivas" en el módulo de cursos.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-institutional p-10 rounded-[2.5rem] shadow-2xl shadow-institutional/30 text-white flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <MessageCircle size={120} fill="currentColor" />
                    </div>

                    <div className="relative z-10">
                        <h4 className="text-xl font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">¿Necesitas Ayuda?</h4>

                        <div className="space-y-6 mb-8">
                            <div className="flex items-center gap-4 group/item">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover/item:bg-white group-hover/item:text-institutional transition-all shadow-lg shadow-black/5">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase opacity-60 font-black tracking-widest mb-0.5">Soporte Técnico</p>
                                    <p className="font-bold text-sm select-all">informatica@muivc.com</p>
                                </div>
                            </div>

                            <a
                                href="https://w.app/vyc"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 group/item cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center backdrop-blur-sm group-hover/item:bg-green-500 text-green-400 group-hover/item:text-white transition-all shadow-lg shadow-green-500/10 border border-green-500/30">
                                    <MessageCircle size={18} fill="currentColor" />
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase opacity-60 font-black tracking-widest mb-0.5">WhatsApp / Celular</p>
                                    <p className="font-bold text-sm group-hover/item:text-green-400 transition-colors">Contáctanos aquí</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    <a
                        href="https://w.app/vyc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-10 w-full py-4 bg-white/10 hover:bg-white hover:text-institutional text-white transition-all rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-white/20 flex items-center justify-center gap-3 group/btn"
                    >
                        <span>Ir a WhatsApp</span>
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
