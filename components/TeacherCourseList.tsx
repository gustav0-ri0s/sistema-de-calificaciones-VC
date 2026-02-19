import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Heart, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { AcademicLoad, Bimestre } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

interface TeacherCourseListProps {
    academicLoad: AcademicLoad[];
    tutorSections: AcademicLoad[];
    selectedBimestre: Bimestre | null;
}

interface CourseProgress {
    assignmentId: string;
    totalExpected: number;
    filledCount: number;
    percentage: number;
}

const TeacherCourseList: React.FC<TeacherCourseListProps> = ({ academicLoad, tutorSections, selectedBimestre }) => {
    const navigate = useNavigate();
    const [progressData, setProgressData] = useState<Record<string, CourseProgress>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedBimestre && academicLoad.length > 0) {
            fetchProgress();
        }
    }, [selectedBimestre, academicLoad]);

    const fetchProgress = async () => {
        setLoading(true);
        try {
            const results: Record<string, CourseProgress> = {};

            // For each course, we need:
            // 1. Participant count (students in classroom)
            // 2. Competency count
            // 3. Filled grades count

            for (const course of academicLoad) {
                // Get student count for this classroom
                const { count: studentCount } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('classroom_id', course.classroomId);

                const totalStudents = studentCount || 0;
                const totalCompetencies = course.competencies.length;
                const totalExpected = totalStudents * totalCompetencies;

                if (totalExpected === 0) {
                    results[course.id] = { assignmentId: course.id, totalExpected: 0, filledCount: 0, percentage: 0 };
                    continue;
                }

                // Get filled grades count
                // Optimization: Get student IDs first
                const { data: students } = await supabase
                    .from('students')
                    .select('id')
                    .eq('classroom_id', course.classroomId);

                const studentIds = students?.map(s => s.id) || [];
                const competencyIds = course.competencies.map(c => parseInt(c.id));

                if (studentIds.length > 0 && competencyIds.length > 0) {
                    const { count: filledCount } = await supabase
                        .from('student_grades')
                        .select('*', { count: 'exact', head: true })
                        .eq('bimestre_id', parseInt(selectedBimestre!.id))
                        .in('student_id', studentIds)
                        .in('competency_id', competencyIds);

                    const filled = filledCount || 0;
                    results[course.id] = {
                        assignmentId: course.id,
                        totalExpected,
                        filledCount: filled,
                        percentage: Math.round((filled / totalExpected) * 100)
                    };
                } else {
                    results[course.id] = { assignmentId: course.id, totalExpected: 0, filledCount: 0, percentage: 0 };
                }
            }

            // Special case for Tutoría (Appreciations + Behavior + Values)
            for (const section of tutorSections) {
                const { count: studentCount } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('classroom_id', section.classroomId);

                const totalStudents = studentCount || 0;
                // Expectations for Tutoria: Appreciation(1) + Behavior(1) + Values(1) = 3 per student
                const totalExpected = totalStudents * 3;

                if (totalExpected > 0) {
                    const { data: students } = await supabase
                        .from('students')
                        .select('id')
                        .eq('classroom_id', section.classroomId);
                    const studentIds = students?.map(s => s.id) || [];

                    // Count Appreciations
                    const { count: appCount } = await supabase
                        .from('student_appreciations')
                        .select('*', { count: 'exact', head: true })
                        .eq('bimestre_id', parseInt(selectedBimestre!.id))
                        .in('student_id', studentIds);

                    // Count Behavior/Values
                    const { data: behaviorData } = await supabase
                        .from('student_behavior_grades')
                        .select('behavior_grade, values_grade')
                        .eq('bimestre_id', parseInt(selectedBimestre!.id))
                        .in('student_id', studentIds);

                    let filledTutor = (appCount || 0);
                    behaviorData?.forEach(row => {
                        if (row.behavior_grade) filledTutor++;
                        if (row.values_grade) filledTutor++;
                    });

                    results[`tutor-${section.classroomId}`] = {
                        assignmentId: `tutor-${section.classroomId}`,
                        totalExpected,
                        filledCount: filledTutor,
                        percentage: Math.round((filledTutor / totalExpected) * 100)
                    };

                    // Count Family Evaluations
                    const { count: famCommitments } = await supabase
                        .from('family_commitments')
                        .select('*', { count: 'exact', head: true })
                        .eq('active', true);

                    const totalFamExpected = totalStudents * (famCommitments || 0);
                    if (totalFamExpected > 0) {
                        const { count: famFilled } = await supabase
                            .from('family_evaluations')
                            .select('*', { count: 'exact', head: true })
                            .eq('bimestre_id', parseInt(selectedBimestre!.id))
                            .in('student_id', studentIds);

                        results[`fam-${section.classroomId}`] = {
                            assignmentId: `fam-${section.classroomId}`,
                            totalExpected: totalFamExpected,
                            filledCount: famFilled || 0,
                            percentage: Math.min(100, Math.round(((famFilled || 0) / totalFamExpected) * 100))
                        };
                    }
                }
            }

            setProgressData(results);
        } catch (err) {
            console.error('Error calculating progress:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2 uppercase">Carga Académica</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Listado Informativo y Progreso de Llenado</p>
            </div>

            {loading && (
                <div className="mb-8 flex items-center justify-center py-4 bg-institutional/5 border border-institutional/10 rounded-3xl gap-3 text-institutional font-black uppercase text-[11px] tracking-[0.2em] animate-in fade-in slide-in-from-top-4 duration-500">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Recalculando progreso...</span>
                </div>
            )}

            <div className="space-y-6">
                {/* TUTORIA CARD (If exists) */}
                {tutorSections.map(section => {
                    const tutorProgress = progressData[`tutor-${section.classroomId}`];
                    const famProgress = progressData[`fam-${section.classroomId}`];

                    return (
                        <div key={`tutor-row-${section.id}`} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center">
                                <Star size={32} fill="currentColor" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 uppercase mb-1">Módulo de Tutoría</h3>
                                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{section.gradeSection}</p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="text-center group">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Tutoría/Conducta</p>
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                                            <circle cx="32" cy="32" r="28" fill="transparent" stroke="#d97706" strokeWidth="6"
                                                strokeDasharray={175.92} strokeDashoffset={175.92 - (175.92 * (tutorProgress?.percentage || 0)) / 100}
                                                strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                        </svg>
                                        <span className="absolute text-xs font-black text-amber-700">{tutorProgress?.percentage || 0}%</span>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Familia</p>
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                                            <circle cx="32" cy="32" r="28" fill="transparent" stroke="#10b981" strokeWidth="6"
                                                strokeDasharray={175.92} strokeDashoffset={175.92 - (175.92 * (famProgress?.percentage || 0)) / 100}
                                                strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                        </svg>
                                        <span className="absolute text-xs font-black text-emerald-700">{famProgress?.percentage || 0}%</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to={`/tutoria/${section.classroomId}`}
                                className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-amber-50 hover:text-amber-600 transition-all active:scale-95 group"
                            >
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    );
                })}

                {/* ACADEMIC COURSES */}
                {academicLoad.filter(c => !c.isTutor).map(course => {
                    const p = progressData[course.id];
                    return (
                        <div key={course.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 group/row">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center group-hover/row:bg-blue-600 group-hover/row:text-white transition-all shadow-inner">
                                <BookOpen size={30} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 uppercase mb-1">{course.courseName}</h3>
                                <div className="flex items-center gap-3">
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{course.gradeSection}</p>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{course.competencies.length} Competencias</p>
                                </div>
                            </div>

                            <div className="text-center min-w-[120px]">
                                <p className="text-[10px] font-black uppercase text-slate-300 mb-2 tracking-widest">Progreso de Notas</p>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-institutional transition-all duration-1000 ease-out" style={{ width: `${p?.percentage || 0}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black">
                                    <span className="text-institutional uppercase tracking-widest">{p?.filledCount || 0} / {p?.totalExpected || 0}</span>
                                    <span className="text-slate-400">{p?.percentage || 0}%</span>
                                </div>
                            </div>

                            <Link
                                to={`/curso/${course.id}`}
                                className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-institutional hover:text-white transition-all active:scale-95 group"
                            >
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    );
                })}


            </div>
        </div>
    );
};

export default TeacherCourseList;
