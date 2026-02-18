import React, { useMemo } from 'react';
import {
    Users,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Star,
    Heart,
    ArrowRight,
    ClipboardList
} from 'lucide-react';
import { AcademicLoad, Bimestre } from '../types';
import { Link } from 'react-router-dom';

interface TeacherDashboardProps {
    academicLoad: AcademicLoad[];
    tutorSections: AcademicLoad[];
    selectedBimestre: Bimestre | null;
    userName: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
    academicLoad,
    tutorSections,
    selectedBimestre,
    userName
}) => {

    const stats = useMemo(() => {
        return {
            totalCourses: academicLoad.length,
            totalStudents: academicLoad.length > 0 ? 30 : 0, // In a real app we'd sum unique students
            tutorCount: tutorSections.length,
            isBimestreOpen: !selectedBimestre?.isLocked
        };
    }, [academicLoad, tutorSections, selectedBimestre]);

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

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                            {stats.isBimestreOpen ? <ClipboardList size={28} /> : <AlertCircle size={28} />}
                        </div>
                        <div>
                            <p className={`text-2xl font-black leading-none ${stats.isBimestreOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {stats.isBimestreOpen ? 'Bimestre Abierto' : 'Bimestre Cerrado'}
                            </p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Estado de Llenado</p>
                        </div>
                    </div>
                    <div className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 ${stats.isBimestreOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                        {stats.isBimestreOpen ? 'Ya puedes registrar notas' : 'Solo consulta disponible'}
                    </div>
                </div>
            </div>

            {/* Tutor Modules Quick Access */}
            {tutorSections.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-8">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Módulos de Tutoría</h3>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {tutorSections.map((section) => (
                            <React.Fragment key={`dash-tutor-${section.id}`}>
                                <Link to={`/tutoria/${section.classroomId}`} className="group relative bg-white border-2 border-amber-200 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer ring-8 ring-amber-50/50 block overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                                        <Star size={120} fill="currentColor" className="text-amber-500" />
                                    </div>
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="p-5 bg-amber-100 text-amber-600 rounded-[1.5rem] group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner translate-y-0 group-hover:-translate-y-1">
                                            <Star size={32} fill="currentColor" />
                                        </div>
                                        <span className="px-4 py-2 bg-amber-600 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-lg shadow-amber-600/20">Módulo de Tutoría</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-2 relative z-10 tracking-tight leading-none">{section.gradeSection}</h3>
                                    <p className="text-slate-400 font-bold mb-8 flex items-center gap-2 relative z-10 uppercase text-xs tracking-widest">Control Socioemocional y Conducta</p>
                                    <div className="pt-8 border-t border-amber-50 flex items-center justify-between text-amber-600 font-black text-xs uppercase tracking-[0.2em] relative z-10 group-hover:gap-4 transition-all">
                                        <span>Acceder al Registro</span>
                                        <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </Link>

                                <Link to={`/familia/${section.classroomId}`} className="group relative bg-white border-2 border-slate-200 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer ring-8 ring-slate-50/50 block overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                                        <Heart size={120} fill="currentColor" className="text-slate-900" />
                                    </div>
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="p-5 bg-slate-100 text-slate-600 rounded-[1.5rem] group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner translate-y-0 group-hover:-translate-y-1">
                                            <Heart size={32} />
                                        </div>
                                        <span className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-lg shadow-slate-900/20">Compromisos Padres</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-2 relative z-10 tracking-tight leading-none">{section.gradeSection}</h3>
                                    <p className="text-slate-400 font-bold mb-8 flex items-center gap-2 relative z-10 uppercase text-xs tracking-widest">Seguimiento Participación Hogar</p>
                                    <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-slate-900 font-black text-xs uppercase tracking-[0.2em] relative z-10 group-hover:gap-4 transition-all">
                                        <span>Evaluar Familia</span>
                                        <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </Link>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

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
                                <p className="text-sm font-bold text-slate-700">Recuerden que el cierre de notas del {selectedBimestre?.label} es el próximo Viernes.</p>
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

                <div className="bg-institutional p-10 rounded-[2.5rem] shadow-2xl shadow-institutional/30 text-white flex flex-col justify-between">
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-widest mb-4">¿Necesitas Ayuda?</h4>
                        <p className="text-white/70 font-bold text-sm leading-relaxed mb-8">
                            Si tienes problemas con el sistema o falta algún curso en tu carga, contacta a Soporte Técnico.
                        </p>
                    </div>
                    <button className="w-full py-4 bg-white/20 hover:bg-white hover:text-institutional transition-all rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/30">
                        Contactar Soporte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
