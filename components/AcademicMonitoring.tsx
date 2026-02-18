import React, { useState, useEffect } from 'react';
import { UserRole, Student, AcademicLoad, GradeEntry, AppreciationEntry, TutorValues, Bimestre, GradeLevel, FamilyCommitment, FamilyEvaluation } from '../types';
import { ShieldCheck, Users, FileText, CheckCircle2, Search, LayoutGrid, ChevronRight, ArrowLeft, Info, X, Lock, Loader2, MessageSquare, Briefcase, GraduationCap, Download, RotateCw, Check } from 'lucide-react';
import DescriptiveCommentModal from './DescriptiveCommentModal';
import { supabase } from '../lib/supabase';
import { generateGlobalReportCard } from '../utils/pdfGenerator';

interface AcademicMonitoringProps {
  role: UserRole;
  bimestre: Bimestre;
  allBimestres: Bimestre[];
  onBimestreChange: (b: Bimestre) => void;
  grades: GradeEntry[];
  appreciations: AppreciationEntry[];
  tutorData: TutorValues[];
  familyCommitments: FamilyCommitment[];
  familyEvaluations: FamilyEvaluation[];
  onApproveAppreciation: (sId: string) => void;
  onUpdateAppreciation: (sId: string, comment: string) => void;
  onUpdateGrade: (studentId: string, competencyId: string, grade: GradeLevel, descriptiveConclusion?: string) => void;
}

interface SectionStats {
  id: number;
  name: string;
  level: string;
  studentCount: number;
  totalCourses: number;
  progress: number;
  pendingAppreciations: number;
}

const AcademicMonitoring: React.FC<AcademicMonitoringProps> = ({
  role,
  bimestre,
  allBimestres,
  onBimestreChange,
  grades,
  appreciations,
  onApproveAppreciation,
  onUpdateAppreciation,
  onUpdateGrade
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedSectionName, setSelectedSectionName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditingStudent, setAuditingStudent] = useState<Student | null>(null);
  const [activeCommentStudent, setActiveCommentStudent] = useState<Student | null>(null);

  // Force reset on mount to prevent "direct redirection" ghost state
  useEffect(() => {
    setSelectedSectionId(null);
  }, []);

  // Real Data State
  const [sectionsData, setSectionsData] = useState<SectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionStudents, setSectionStudents] = useState<Student[]>([]);
  const [sectionGrades, setSectionGrades] = useState<GradeEntry[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingGradeData, setEditingGradeData] = useState<{
    student: Student;
    competencyId: string;
    grade: GradeLevel;
    conclusion: string;
  } | null>(null);
  const [sectionCourses, setSectionCourses] = useState<AcademicLoad[]>([]); // To audit specific courses

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'incomplete'>('all');

  // Computed Filtered & Sorted Sections
  const filteredSections = sectionsData
    .filter(section => {
      if (filterStatus === 'pending') return section.pendingAppreciations > 0;
      if (filterStatus === 'completed') return section.progress === 100;
      if (filterStatus === 'incomplete') return section.progress < 100;
      return true;
    })
    .sort((a, b) => {
      // 1. Priority: Pending Appreciations (Descending)
      if (a.pendingAppreciations > 0 && b.pendingAppreciations === 0) return -1;
      if (a.pendingAppreciations === 0 && b.pendingAppreciations > 0) return 1;
      if (a.pendingAppreciations > 0 && b.pendingAppreciations > 0) return b.pendingAppreciations - a.pendingAppreciations;

      // 2. Secondary: Progress (Ascending for incomplete, Descending for completed?)
      // Let's just keep it stable by ID or Name
      return a.id - b.id;
    });

  // Fetch Global Stats (All Classrooms)
  useEffect(() => {
    const fetchGlobalStats = async () => {
      setLoading(true);
      try {
        // 1. Get all active classrooms
        const { data: classrooms, error: classError } = await supabase
          .from('classrooms')
          .select('id, grade, section, level')
          .eq('active', true)
          .order('level', { ascending: false })
          .order('grade', { ascending: true })
          .order('section', { ascending: true });

        if (classError) throw classError;

        if (classrooms) {
          // In a real scenario, we would do a more complex query or RPC to get counts
          // For now, we will do parallel fetching for counts to keep it simple but working
          const statsPromises = classrooms.map(async (c) => {
            // Count students
            const { count: studentCount } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('classroom_id', c.id)
              .eq('academic_status', 'matriculado'); // Adjust status if needed

            // Count courses assigned to this classroom
            const { count: courseCount } = await supabase
              .from('course_assignments')
              .select('*', { count: 'exact', head: true })
              .eq('classroom_id', c.id);

            // Calculate REAL progress
            const studentsInClass = (await supabase.from('students').select('id').eq('classroom_id', c.id)).data?.map(s => s.id) || [];

            let realProgress = 0;
            if (studentsInClass.length > 0) {
              // 1. Get total expected slots (Students * Competencies)
              const { data: classCourses } = await supabase
                .from('course_assignments')
                .select('curricular_areas(id, competencies(id))')
                .eq('classroom_id', c.id);

              let totalCompetenciesInClass = 0;
              classCourses?.forEach((cc: any) => {
                totalCompetenciesInClass += cc.curricular_areas?.competencies?.length || 0;
              });

              const totalSlots = studentsInClass.length * totalCompetenciesInClass;

              // 2. Get filled grades count
              const { data: gData, error: gError } = await supabase
                .from('student_grades')
                .select('id')
                .in('student_id', studentsInClass)
                .eq('bimestre_id', parseInt(bimestre.id));

              if (totalSlots > 0 && gData) {
                realProgress = Math.round((gData.length / totalSlots) * 100);
              }
            }

            // Count pending appreciations
            let pendingCount = 0;
            if (studentsInClass.length > 0) {
              const { count } = await supabase
                .from('student_appreciations')
                .select('*', { count: 'exact', head: true })
                .eq('bimestre_id', parseInt(bimestre.id))
                .eq('is_approved', false)
                .in('student_id', studentsInClass);
              pendingCount = count || 0;
            }

            return {
              id: c.id,
              name: `${c.grade} "${c.section}" ${c.level.charAt(0).toUpperCase() + c.level.slice(1)}`,
              level: c.level,
              studentCount: studentCount || 0,
              totalCourses: courseCount || 0,
              progress: realProgress,
              pendingAppreciations: pendingCount
            };
          });

          const results = await Promise.all(statsPromises);
          setSectionsData(results);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStats();
  }, [bimestre.id, refreshTrigger]);

  // Fetch Students when a section is selected
  useEffect(() => {
    const fetchSectionDetails = async () => {
      if (!selectedSectionId) {
        setSectionGrades([]);
        return;
      }

      setLoadingStudents(true);
      try {
        // Get Students
        const { data: students, error: sError } = await supabase
          .from('students')
          .select('id, first_name, last_name, classroom_id')
          .eq('classroom_id', selectedSectionId)
          .order('last_name');

        if (sError) throw sError;

        const mappedStudents = (students || []).map(s => ({
          id: s.id,
          fullName: `${s.last_name}, ${s.first_name}`,
          classroomId: s.classroom_id || 0
        }));
        setSectionStudents(mappedStudents);

        // Get Courses for Audit
        const { data: courses, error: cError } = await supabase
          .from('course_assignments')
          .select(`
              id,
              curricular_areas ( name, competencies (id, name) ),
              profiles ( full_name )
           `)
          .eq('classroom_id', selectedSectionId);

        if (cError) throw cError;

        const mappedCourses: AcademicLoad[] = (courses || []).map((c: any) => ({
          id: c.id.toString(),
          courseName: c.curricular_areas?.name,
          teacherName: c.profiles?.full_name || 'Sin Asignar',
          competencies: c.curricular_areas?.competencies || [],
          // Required fields for AcademicLoad
          gradeSection: selectedSectionName || '',
          isTutor: false,
          classroomId: selectedSectionId || 0,
          areaId: 0
        }));
        setSectionCourses(mappedCourses);

        // Get Grades for this section
        const studentIds = mappedStudents.map(s => s.id);
        if (studentIds.length > 0) {
          const { data: gData, error: gError } = await supabase
            .from('student_grades')
            .select('*')
            .in('student_id', studentIds)
            .eq('bimestre_id', parseInt(bimestre.id));

          if (gError) throw gError;

          if (gData) {
            setSectionGrades(gData.map((g: any) => ({
              studentId: g.student_id,
              courseId: '',
              competencyId: g.competency_id.toString(),
              grade: g.grade as GradeLevel,
              descriptiveConclusion: g.descriptive_conclusion || ''
            })));
          }
        }

      } catch (err) {
        console.error('Error fetching section details:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchSectionDetails();
  }, [selectedSectionId, bimestre.id, refreshTrigger]);


  const getStudentAudit = (studentId: string) => {
    // This now needs to use sectionCourses instead of MOCK_ACADEMIC_LOAD
    return sectionCourses.map(course => {
      // Use sectionGrades (local) instead of grades (prop)
      const comps = (course.competencies || []).map((c: any) => {
        const gradeEntry = sectionGrades.find((g) => g.studentId === studentId && g.competencyId === c.id.toString());
        return {
          id: c.id,
          name: c.name,
          isFilled: !!gradeEntry,
          grade: (gradeEntry?.grade || '') as GradeLevel,
          descriptiveConclusion: gradeEntry?.descriptiveConclusion || ''
        };
      });
      return { courseName: course.courseName, teacherName: course.teacherName, type: 'academic' as const, comps };
    });
  };

  const getStatusForStudent = (studentId: string) => {
    // This is simplified as we don't have persisted grades yet
    // Just showing 0% or based on local state if any
    const totalCompetencies = sectionCourses.reduce((acc, curr) => acc + (curr.competencies?.length || 0), 0);

    // Avoid division by zero
    if (totalCompetencies === 0) return { progress: 0, isApproved: false, hasAppreciation: false };

    const studentGrades = sectionGrades.filter(g => g.studentId === studentId); // Local state check
    const progress = Math.round((studentGrades.length / totalCompetencies) * 100);
    const appreciation = appreciations.find(a => a.studentId === studentId); // Local state check

    return {
      progress,
      isApproved: appreciation?.isApproved || false,
      hasAppreciation: (appreciation?.comment || '').trim().length > 0
    };
  };

  // Helper for PDF (needs adaptation to real data structure later)
  const handleGeneratePDF = (student: Student) => {
    alert("La generación de PDF requiere guardar primero las notas en la Base de Datos.");
    // Logic would be: fetch all grades for student from DB -> Generate
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Bimestre Switcher */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md::items-center justify-between gap-6">
          {!selectedSectionId ? (
            <div className="flex items-center gap-4">
              <div className="p-4 bg-institutional/10 rounded-3xl text-institutional">
                <LayoutGrid size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-slate-400 font-bold text-sm">Resumen de avance por salón</p>
                  <button
                    onClick={() => {
                      setLoading(true);
                      // Triggering a re-renders by setting loading and the effect will run as it has no other deps except bimestre
                      // But to be sure, let's just use a local trigger
                      setRefreshTrigger(prev => prev + 1);
                    }}
                    className="p-1 px-2 hover:bg-slate-100 rounded-lg text-institutional transition-all flex items-center gap-1.5"
                    title="Actualizar Datos"
                  >
                    <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span className="text-[10px] font-black uppercase">Actualizar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="text-institutional" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-institutional">Staff Institucional</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Sección: {selectedSectionName}
              </h2>
              <p className="text-gray-500 font-medium">Gestión institucional y auditoría de carga académica.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner overflow-x-auto no-scrollbar max-w-full">
              {allBimestres.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (!b.isLocked) {
                      onBimestreChange(b);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${bimestre.id === b.id
                    ? 'bg-institutional text-white shadow-md'
                    : b.isLocked
                      ? 'text-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                      : 'text-gray-400 hover:bg-gray-200 cursor-pointer'
                    }`}
                >
                  {b.label} {b.isLocked && <Lock size={10} />}
                </button>
              ))}
            </div>

            {selectedSectionId && (
              <button
                onClick={() => { setSelectedSectionId(null); setSelectedSectionName(null); }}
                className="flex items-center gap-2 px-6 py-4 bg-gray-900 text-white hover:bg-gray-800 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-gray-200"
              >
                <ArrowLeft size={16} /> Salones
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-institutional" size={48} />
        </div>
      ) : !selectedSectionId ? (
        /* VISTA DE SALONES (SECCIONES) REA */
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Pendientes Revisión' },
              { id: 'completed', label: '100% Completado' },
              { id: 'incomplete', label: 'Falta Completar' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${filterStatus === f.id
                  ? 'bg-institutional text-white border-institutional shadow-lg shadow-institutional/20 ring-2 ring-institutional/20'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSections.length === 0 ? (
              <div className="col-span-full text-center p-10 bg-gray-50 rounded-[2.5rem] text-gray-400 font-medium">
                No se encontraron salones con este filtro.
              </div>
            ) : (
              filteredSections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => { setSelectedSectionId(section.id); setSelectedSectionName(section.name); }}
                  className={`group relative bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2 overflow-hidden ${section.pendingAppreciations > 0 ? 'border-2 border-red-500 shadow-red-200' : 'border border-gray-100'}`}
                >
                  {section.pendingAppreciations > 0 && (
                    <div className="absolute top-0 right-0 left-0 bg-red-500 py-2 flex items-center justify-center gap-2 text-white shadow-md z-10">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-md"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Pendiente de Revisión ({section.pendingAppreciations})</span>
                    </div>
                  )}

                  <div className={`flex justify-between items-start mb-6 ${section.pendingAppreciations > 0 ? 'mt-6' : ''}`}>
                    <div className="p-4 bg-institutional/10 text-institutional rounded-2xl group-hover:bg-institutional group-hover:text-white transition-all">
                      <LayoutGrid size={28} />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500`}>
                      {section.level}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-gray-800">{section.name}</h3>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${section.progress === 100 ? 'bg-green-500' : 'bg-institutional'}`} style={{ width: `${section.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
                    <span>Progreso</span>
                    <span>{section.progress}%</span>
                  </div>
                  <div className="space-y-2 mb-8">
                    <p className="text-gray-400 font-bold flex items-center gap-2 text-xs"><Users size={14} /> {section.studentCount} Estudiantes</p>
                    <p className="text-gray-400 font-bold flex items-center gap-2 text-xs"><FileText size={14} /> {section.totalCourses} Cursos Asignados</p>
                  </div>

                  <div className="flex items-center justify-between text-institutional font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                    Auditar Sección <ChevronRight size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* VISTA DETALLE DE ESTUDIANTES POR SECCIÓN */
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 bg-gray-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-gray-400" /> Matriz de Estudiantes
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-6 py-3 bg-white border border-gray-200 rounded-xl w-full md:w-64 focus:ring-4 focus:ring-institutional/10 transition-all text-xs font-bold"
              />
            </div>
          </div>

          {loadingStudents ? (
            <div className="flex justify-center p-10">
              <Loader2 className="animate-spin text-institutional" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Auditoría</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Apreciación Tutor</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Detalle Académico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sectionStudents.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(student => {
                    const status = getStatusForStudent(student.id);
                    const appreciation = appreciations.find(a => a.studentId === student.id) || { studentId: student.id, comment: '', isApproved: false };

                    return (
                      <tr key={student.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="p-6">
                          <span className="font-bold text-gray-700 text-base">{student.fullName}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 font-bold">{status.progress}% Completado</span>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-institutional rounded-full transition-all" style={{ width: `${status.progress}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-6">
                            <button
                              onClick={() => setActiveCommentStudent(student)}
                              className={`p-3 px-5 rounded-2xl transition-all border-2 flex flex-col items-center ${appreciation.comment.trim() !== ''
                                ? 'bg-institutional/10 border-institutional text-institutional hover:bg-institutional hover:text-white shadow-lg shadow-institutional/20'
                                : 'bg-white border-gray-200 text-gray-300 hover:border-institutional hover:text-institutional'
                                }`}
                            >
                              <MessageSquare size={18} />
                              <span className="text-[9px] font-black uppercase mt-1">
                                {appreciation.comment.trim() !== '' ? 'Editar' : 'Redactar'}
                              </span>
                            </button>

                            {appreciation.comment.trim() !== '' && (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${appreciation.isApproved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                                  }`}>
                                  {appreciation.isApproved ? <CheckCircle2 size={16} /> : <Check size={16} />}
                                  <span className="text-[10px] font-black uppercase">{appreciation.isApproved ? 'Aprobado' : 'Pendiente'}</span>
                                </div>
                                {!bimestre.isLocked && (
                                  <button
                                    onClick={() => {
                                      // Call parent handler
                                      onApproveAppreciation(student.id);

                                      // Optimistically update local stats
                                      setSectionsData(prev => prev.map(section => {
                                        if (section.id === selectedSectionId) {
                                          return {
                                            ...section,
                                            pendingAppreciations: appreciation.isApproved
                                              ? section.pendingAppreciations + 1 // Currently approved -> unapproving -> add to pending
                                              : Math.max(0, section.pendingAppreciations - 1) // Currently pending -> approving -> remove from pending
                                          };
                                        }
                                        return section;
                                      }));
                                    }}
                                    className={`p-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${appreciation.isApproved ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-green-600 text-white border-green-700 shadow-md active:scale-95'
                                      }`}
                                  >
                                    {appreciation.isApproved ? 'Quitar Visto' : 'Dar Visto Bueno'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-6 flex items-center justify-center gap-3">
                          <button
                            onClick={() => setAuditingStudent(student)}
                            className="p-3 bg-institutional/10 text-institutional hover:bg-institutional hover:text-white rounded-xl transition-all shadow-sm"
                            title="Ver Detalle de Llenado"
                          >
                            <Search size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {sectionStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 font-bold">No hay estudiantes registrados en esta sección.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE APRECIACIÓN */}
      {activeCommentStudent && (
        <DescriptiveCommentModal
          role={role}
          student={activeCommentStudent}
          currentComment={appreciations.find(a => a.studentId === activeCommentStudent.id)?.comment || ''}
          isApproved={appreciations.find(a => a.studentId === activeCommentStudent.id)?.isApproved || false}
          onClose={() => setActiveCommentStudent(null)}
          onSave={(val) => {
            onUpdateAppreciation(activeCommentStudent.id, val);
            setActiveCommentStudent(null);
          }}
          isLocked={bimestre.isLocked}
        />
      )}

      {/* MODAL DE AUDITORÍA DETALLADA */}
      {auditingStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setAuditingStudent(null)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 text-institutional mb-1">
                  <Info size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Auditoría de Competencias</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900">{auditingStudent.fullName}</h3>
              </div>
              <button onClick={() => setAuditingStudent(null)} className="p-3 hover:bg-white rounded-2xl border border-gray-100 text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {(getStudentAudit(auditingStudent.id) || []).length === 0 ? (
                <div className="text-center text-gray-400">No hay cursos asignados para auditar.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(getStudentAudit(auditingStudent.id) || []).map((courseAudit, idx) => (
                    <div key={idx} className="p-6 rounded-[2rem] border-2 border-gray-100 bg-gray-50/50">
                      <h4 className="font-black text-gray-800 uppercase text-xs tracking-tight mb-2">{courseAudit.courseName}</h4>
                      <span className="text-[10px] text-gray-400 block mb-4">{courseAudit.teacherName}</span>
                      <div className="space-y-1">
                        {(courseAudit.comps || []).map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between w-full bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <span className="text-[10px] text-gray-600 font-bold">{c.name}</span>
                            <div className="flex flex-col items-end gap-1">
                              {c.isFilled ? (
                                <button
                                  onClick={() => setEditingGradeData({
                                    student: auditingStudent,
                                    competencyId: c.id.toString(),
                                    grade: c.grade as GradeLevel,
                                    conclusion: c.descriptiveConclusion
                                  })}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition-all hover:scale-105 ${c.grade === 'AD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    c.grade === 'A' ? 'bg-green-50 text-green-700 border-green-100' :
                                      c.grade === 'B' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                  {c.grade}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingGradeData({
                                    student: auditingStudent,
                                    competencyId: c.id.toString(),
                                    grade: '',
                                    conclusion: ''
                                  })}
                                  className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded-md transition-colors"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                                  <span className="text-[9px] font-black text-red-300 uppercase">Sin Nota</span>
                                </button>
                              )}
                              {c.descriptiveConclusion && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-institutional/5 text-institutional rounded-lg border border-institutional/10">
                                  <MessageSquare size={10} />
                                  <span className="text-[8px] font-bold uppercase truncate max-w-[80px]">Ver C.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* TARJETA DE TUTORÍA */}
                  <div className="p-6 rounded-[2rem] border-2 border-gray-100 bg-gray-50/50">
                    <h4 className="font-black text-gray-800 uppercase text-xs tracking-tight mb-2">TUTORÍA</h4>
                    <span className="text-[10px] text-gray-400 block mb-4">Evaluación del Tutor</span>
                    <div className="space-y-1">
                      {(() => {
                        const tutorEntry = tutorData.find(t => t.studentId === auditingStudent.id) || { comportamiento: '', tutoriaValores: '' };
                        return [
                          { label: 'COMPORTAMIENTO', grade: tutorEntry.comportamiento },
                          { label: 'TUTORÍA DE VALORES', grade: tutorEntry.tutoriaValores }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between w-full bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <span className="text-[10px] text-gray-600 font-bold">{item.label}</span>
                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition-all ${!item.grade ? 'bg-gray-50 text-gray-300 border-gray-100' :
                                item.grade === 'AD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  item.grade === 'A' ? 'bg-green-50 text-green-700 border-green-100' :
                                    item.grade === 'B' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      'bg-red-50 text-red-700 border-red-100'
                              }`}>
                              {item.grade || '-'}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* TARJETA DE PADRES DE FAMILIA */}
                  <div className="p-6 rounded-[2rem] border-2 border-gray-100 bg-gray-50/50">
                    <h4 className="font-black text-gray-800 uppercase text-xs tracking-tight mb-2">PADRES DE FAMILIA</h4>
                    <span className="text-[10px] text-gray-400 block mb-4">Compromisos Familiares</span>
                    <div className="space-y-1">
                      {familyCommitments.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">No hay compromisos definidos.</p>
                      ) : (
                        familyCommitments.map((commitment) => {
                          const evaluation = familyEvaluations.find(e => e.studentId === auditingStudent.id && e.commitmentId === commitment.id.toString());
                          const grade = evaluation?.grade || '';

                          return (
                            <div key={commitment.id} className="flex items-center justify-between w-full bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                              <span className="text-[10px] text-gray-600 font-bold max-w-[70%] truncate" title={commitment.description}>{commitment.description}</span>
                              <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition-all ${!grade ? 'bg-gray-50 text-gray-300 border-gray-100' :
                                  grade === 'AD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    grade === 'A' ? 'bg-green-50 text-green-700 border-green-100' :
                                      grade === 'B' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                {grade || '-'}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE NOTA (SOPORTE PARA SUPERVISOR) */}
      {editingGradeData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingGradeData(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck className="text-institutional" size={24} />
              Modificar Calificación
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Nombre del Estudiante</label>
                <div className="p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700">{editingGradeData.student.fullName}</div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Calificación</label>
                <div className="grid grid-cols-5 gap-2">
                  {['', 'AD', 'A', 'B', 'C'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setEditingGradeData({ ...editingGradeData, grade: g as GradeLevel })}
                      className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${editingGradeData.grade === g
                        ? 'bg-institutional border-institutional text-white'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                    >
                      {g === '' ? '-' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Conclusión Descriptiva</label>
                <textarea
                  value={editingGradeData.conclusion}
                  onChange={(e) => setEditingGradeData({ ...editingGradeData, conclusion: e.target.value })}
                  placeholder="Ingrese la conclusión descriptiva aquí..."
                  className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-4 focus:ring-institutional/10 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingGradeData(null)}
                  className="flex-1 py-4 rounded-2xl text-xs font-black uppercase text-slate-400 hover:bg-slate-50 transition-all border-2 border-transparent"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Start loading for immediate feedback if needed
                    const studentId = editingGradeData.student.id;
                    const compId = editingGradeData.competencyId;
                    const gradeVal = editingGradeData.grade;
                    const concVal = editingGradeData.conclusion;

                    // Save to DB
                    await onUpdateGrade(
                      studentId,
                      compId,
                      gradeVal,
                      concVal
                    );

                    // Update local state for immediate visual consistency in detailed view
                    setSectionGrades(prev => {
                      const compIdStr = compId.toString();
                      const filtered = prev.filter(g => !(g.studentId === studentId && g.competencyId === compIdStr));
                      if (gradeVal === '') return filtered;

                      return [...filtered, {
                        studentId: studentId,
                        competencyId: compIdStr,
                        courseId: '',
                        grade: gradeVal,
                        descriptiveConclusion: concVal
                      }];
                    });

                    // Recalculate global stats for this section (Optimistic)
                    setSectionsData(prev => prev.map(s => {
                      if (s.id === selectedSectionId) {
                        // This is a rough estimation, for precise count we'd need more logic
                        // but setting refreshTrigger is better
                        return s;
                      }
                      return s;
                    }));

                    // Trigger a real refresh of stats
                    setRefreshTrigger(prev => prev + 1);

                    setEditingGradeData(null);
                  }}
                  className="flex-1 py-4 bg-institutional text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-institutional/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicMonitoring;
