
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, AlertCircle, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Bimestre } from '../types';

interface SupervisorStatsProps {
    bimestre: Bimestre;
}

const SupervisorStatsDashboard: React.FC<SupervisorStatsProps> = ({ bimestre }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        pendingAppreciations: 0,
        lowGradesCount: 0,
        completionRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // 1. Get the academic year ID for this bimestre
                const { data: bimestreData } = await supabase
                    .from('bimestres')
                    .select('academic_year_id')
                    .eq('id', parseInt(bimestre.id))
                    .single();

                const yearId = bimestreData?.academic_year_id;

                // 2. Total Students (Filtered by year)
                let studentQuery = supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('academic_status', 'matriculado');

                if (yearId) {
                    studentQuery = studentQuery.eq('academic_year_id', yearId);
                }

                const { count: studentCount } = await studentQuery;

                // 3. Active Courses (Filtered by year if possible)
                let courseQuery = supabase
                    .from('course_assignments')
                    .select('*', { count: 'exact', head: true });

                if (yearId) {
                    courseQuery = courseQuery.eq('academic_year_id', yearId);
                }

                const { count: courseCount } = await courseQuery;

                // 4. Pending Appreciations for current bimestre
                const { count: pendingApps } = await supabase
                    .from('student_appreciations')
                    .select('*', { count: 'exact', head: true })
                    .eq('bimestre_id', parseInt(bimestre.id))
                    .eq('is_approved', false);

                // 5. Low Grades (C) for current bimestre
                const { count: lowGrades } = await supabase
                    .from('student_grades')
                    .select('*', { count: 'exact', head: true })
                    .eq('bimestre_id', parseInt(bimestre.id))
                    .eq('grade', 'C');

                // 6. Calculate GLOBAL Completion Rate
                // This is an estimation for the dashboard:
                // Sum(students_in_room * (competencies_in_room + static_slots))
                let totalExpectedSlots = 0;
                let totalFilledSlots = 0;

                const { data: classrooms } = await supabase
                    .from('classrooms')
                    .select('id, is_english_group')
                    .eq('active', true);

                if (classrooms && classrooms.length > 0) {
                    // Get all active competencies to map them to areas
                    const { data: allCompetencies } = await supabase
                        .from('competencies')
                        .select('id, area_id');

                    // Get all current grades count efficiently
                    const { count: filledGrades } = await supabase
                        .from('student_grades')
                        .select('*', { count: 'exact', head: true })
                        .not('grade', 'is', null)
                        .eq('bimestre_id', parseInt(bimestre.id));

                    // Get all assignments to know which competencies are active for each room
                    const { data: assignments } = await supabase
                        .from('course_assignments')
                        .select('classroom_id, area_id, competency_id')
                        .eq('academic_year_id', yearId);

                    // Get student count per classroom
                    const { data: classStudentCounts } = await supabase
                        .from('students')
                        .select('classroom_id, id')
                        .eq('academic_status', 'matriculado')
                        .eq('academic_year_id', yearId);

                    const studentsByClass = classStudentCounts?.reduce((acc: any, s) => {
                        if (s.classroom_id) {
                            acc[s.classroom_id] = (acc[s.classroom_id] || 0) + 1;
                        }
                        return acc;
                    }, {});

                    // Calculate denominator
                    classrooms.forEach(room => {
                        const roomStudents = studentsByClass[room.id] || 0;
                        if (roomStudents === 0) return;

                        // Filter assignments for this room
                        const roomAssignments = assignments?.filter(a => a.classroom_id === room.id) || [];
                        let roomCompetencies = 0;

                        roomAssignments.forEach(attr => {
                            if (attr.competency_id) {
                                roomCompetencies += 1;
                            } else {
                                // All competencies for that area
                                const areaComps = allCompetencies?.filter(c => c.area_id === attr.area_id).length || 0;
                                roomCompetencies += areaComps;
                            }
                        });

                        // Add static slots (Appreciation + Behavior + Values)
                        // Family evaluation is 1 summary usually or per commitment. Let's keep it simple: Area Grades + 3 more.
                        totalExpectedSlots += roomStudents * (roomCompetencies + 3);
                    });

                    // For the numerator, we take filled grades + approved appreciations + behavior records
                    const { count: filledApps } = await supabase
                        .from('student_appreciations')
                        .select('*', { count: 'exact', head: true })
                        .eq('bimestre_id', parseInt(bimestre.id))
                        .eq('is_approved', true);

                    const { count: filledBehavior } = await supabase
                        .from('student_behavior_grades')
                        .select('*', { count: 'exact', head: true })
                        .eq('bimestre_id', parseInt(bimestre.id));

                    // Behavior table has behavior_grade and values_grade. 
                    // Let's assume each row counts as 2 slots if both filled.
                    totalFilledSlots = (filledGrades || 0) + (filledApps || 0) + ((filledBehavior || 0) * 2);
                }

                const completionRate = totalExpectedSlots > 0
                    ? Math.round((totalFilledSlots / totalExpectedSlots) * 100)
                    : 0;

                setStats({
                    totalStudents: studentCount || 0,
                    totalCourses: courseCount || 0,
                    pendingAppreciations: pendingApps || 0,
                    lowGradesCount: lowGrades || 0,
                    completionRate: Math.min(completionRate, 100)
                });

            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [bimestre.id]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Panel General</h1>
                <p className="text-gray-500 font-medium">Resumen ejecutivo del {bimestre.label}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1: Students */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black text-gray-800">{stats.totalStudents}</h3>
                        <p className="text-sm font-bold text-gray-400 mt-1">Estudiantes Matriculados</p>
                    </div>
                </div>

                {/* Card 2: Pending Appreciations */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between group hover:scale-[1.02] transition-all relative overflow-hidden">
                    {stats.pendingAppreciations > 0 && (
                        <div className="absolute top-0 right-0 p-4">
                            <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl transition-colors ${stats.pendingAppreciations > 0 ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : 'bg-green-50 text-green-500'}`}>
                            <AlertCircle size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Atención</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black text-gray-800">{stats.pendingAppreciations}</h3>
                        <p className="text-sm font-bold text-gray-400 mt-1">Apreciaciones Pendientes</p>
                    </div>
                </div>

                {/* Card 3: C Grades */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Riesgo</span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black text-gray-800">{stats.lowGradesCount}</h3>
                        <p className="text-sm font-bold text-gray-400 mt-1">Notas "C" Registradas</p>
                    </div>
                </div>

                {/* Card 4: Global Progress (Mocked for now) */}
                <div className="bg-institutional p-8 rounded-[2.5rem] shadow-xl shadow-institutional/30 flex flex-col justify-between text-white relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <h3 className="text-4xl font-black">{stats.completionRate}%</h3>
                        <p className="text-sm font-bold text-blue-100 mt-1">Avance Global del Bimestre</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 h-2 bg-black/20 rounded-full overflow-hidden relative z-10">
                        <div className="h-full bg-white rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
                    </div>
                </div>

            </div>

            {/* Quick Actions / Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div
                    role="button"
                    onClick={() => navigate('/monitoreo')}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition-all flex items-center gap-6 group cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-institutional group-hover:text-white transition-all">
                        <BookOpen size={30} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-institutional transition-colors">Monitoreo Académico</h3>
                        <p className="text-sm text-gray-500">Revisar avance de notas por salón</p>
                    </div>
                </div>

                <div
                    role="button"
                    onClick={() => navigate('/apreciaciones')}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition-all flex items-center gap-6 group cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <CheckCircle2 size={30} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-rose-500 transition-colors">Revisión de Apreciaciones</h3>
                        <p className="text-sm text-gray-500">Aprobar o corregir comentarios de tutoría</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SupervisorStatsDashboard;
