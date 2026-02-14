
import React, { useState, useEffect } from 'react';
import { UserRole, Student, AcademicLoad, GradeEntry, AppreciationEntry, TutorValues, Bimestre, GradeLevel, FamilyCommitment, FamilyEvaluation } from '../types';
import { ShieldCheck, Users, FileText, AlertCircle, CheckCircle, Search, LayoutGrid, ChevronRight, ArrowLeft, Info, X, Lock, GraduationCap, Heart, Star, Loader2 } from 'lucide-react';
import { generateGlobalReportCard } from '../utils/pdfGenerator';
import { supabase } from '../lib/supabase';

interface SupervisorDashboardProps {
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
}

interface SectionStats {
  id: number;
  name: string;
  level: string;
  studentCount: number;
  totalCourses: number;
  progress: number;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  role,
  bimestre,
  allBimestres,
  onBimestreChange,
  grades,
  appreciations,
  onApproveAppreciation
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedSectionName, setSelectedSectionName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditingStudent, setAuditingStudent] = useState<Student | null>(null);

  // Real Data State
  const [sectionsData, setSectionsData] = useState<SectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionStudents, setSectionStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sectionCourses, setSectionCourses] = useState<AcademicLoad[]>([]); // To audit specific courses

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

            // Calculate mocked progress for now (since we don't have a grades table yet)
            // In future: Query 'grades' table count vs expected count
            const mockProgress = 0; // Default to 0 until grades are in DB

            return {
              id: c.id,
              name: `${c.grade} "${c.section}" ${c.level.charAt(0).toUpperCase() + c.level.slice(1)}`,
              level: c.level,
              studentCount: studentCount || 0,
              totalCourses: courseCount || 0,
              progress: mockProgress
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
  }, []);

  // Fetch Students when a section is selected
  useEffect(() => {
    const fetchSectionDetails = async () => {
      if (!selectedSectionId) return;

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

        const mappedCourses: any[] = (courses || []).map((c: any) => ({
          id: c.id.toString(),
          courseName: c.curricular_areas?.name,
          teacherName: c.profiles?.full_name || 'Sin Asignar',
          competencies: c.curricular_areas?.competencies || []
        }));
        setSectionCourses(mappedCourses);

      } catch (err) {
        console.error('Error fetching section details:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchSectionDetails();
  }, [selectedSectionId]);


  const getStudentAudit = (studentId: string) => {
    // This now needs to use sectionCourses instead of MOCK_ACADEMIC_LOAD
    return sectionCourses.map(course => {
      // Still using local state 'grades' for now, as DB grades table logic isn't built yet
      const comps = (course.competencies || []).map((c: any) => {
        const gradeEntry = grades.find((g: any) => g.studentId === studentId && g.competencyId === c.id.toString());
        return {
          name: c.name,
          isFilled: !!gradeEntry,
          grade: (gradeEntry?.grade || '') as GradeLevel
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

    const studentGrades = grades.filter(g => g.studentId === studentId); // Local state check
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-institutional" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-institutional">Staff Institucional</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {selectedSectionId ? `Sección: ${selectedSectionName}` : 'Panel de Supervisión'}
            </h2>
            <p className="text-gray-500 font-medium">Gestión institucional y auditoría de carga académica.</p>
          </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sectionsData.length === 0 ? (
            <div className="col-span-full text-center p-10 text-gray-400">No se encontraron salones activos.</div>
          ) : (
            sectionsData.map((section) => (
              <div
                key={section.id}
                onClick={() => { setSelectedSectionId(section.id); setSelectedSectionName(section.name); }}
                className="group bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl border border-gray-100 transition-all cursor-pointer hover:-translate-y-2"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-institutional/10 text-institutional rounded-2xl group-hover:bg-institutional group-hover:text-white transition-all">
                    <LayoutGrid size={28} />
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500`}>
                    {section.level}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-800 mb-2">{section.name}</h3>
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
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado (Simulado)</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sectionStudents.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(student => {
                    const status = getStatusForStudent(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="p-6">
                          <span className="font-bold text-gray-700 text-base">{student.fullName}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-xs text-gray-400 italic">Datos de prueba</span>
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
              {/* Simplified Audit View */}
              {(getStudentAudit(auditingStudent.id) || []).length === 0 ? (
                <div className="text-center text-gray-400">No hay cursos asignados para auditar.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getStudentAudit(auditingStudent.id).map((courseAudit, idx) => (
                    <div key={idx} className="p-6 rounded-[2rem] border-2 border-gray-100 bg-gray-50/50">
                      <h4 className="font-black text-gray-800 uppercase text-xs tracking-tight mb-2">{courseAudit.courseName}</h4>
                      <span className="text-[10px] text-gray-400 block mb-4">{courseAudit.teacherName}</span>
                      <div className="space-y-1">
                        {(courseAudit.comps || []).map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${c.isFilled ? 'bg-green-500' : 'bg-red-400'}`}></div>
                            <span className="text-[10px] text-gray-600">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;
