import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams, Link } from 'react-router-dom';
import { ClipboardCheck, Lock, ChevronLeft, LogOut, Star, BookOpen, UserCircle, Home, Heart, Loader2, Plus, Menu } from 'lucide-react';
import { AcademicLoad, Bimestre, GradeEntry, AppreciationEntry, TutorValues, GradeLevel, UserRole, FamilyCommitment, FamilyEvaluation, Student } from './types';
import CourseCard from './components/CourseCard';
import GradingMatrix from './components/GradingMatrix';
import SupervisorStatsDashboard from './components/SupervisorStatsDashboard';
import AcademicMonitoring from './components/AcademicMonitoring';
import AppreciationsReview from './components/AppreciationsReview';
import ReportsModule from './components/ReportsModule';
import { supabase } from './lib/supabase';
import AuthCallback from './components/AuthCallback';
import RequireAuth from './components/RequireAuth';
import Sidebar from './components/Sidebar';
import TeacherCourseList from './components/TeacherCourseList';
import TeacherDashboard from './components/TeacherDashboard';
import AdminConfig from './components/AdminConfig';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL;
const ALLOWED_ROLES = ['DOCENTE', 'SUPERVISOR', 'ADMIN', 'SUBDIRECTOR', 'AUXILIAR', 'SECRETARIA'];

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<AcademicLoad | null>(null);

  // Bimestres State
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [selectedBimestre, setSelectedBimestre] = useState<Bimestre | null>(null);
  const [loadingBimestres, setLoadingBimestres] = useState(true);

  // Data from DB
  const [academicLoad, setAcademicLoad] = useState<AcademicLoad[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [appreciations, setAppreciations] = useState<AppreciationEntry[]>([]);
  const [tutorData, setTutorData] = useState<TutorValues[]>([]);

  const [familyCommitments, setFamilyCommitments] = useState<FamilyCommitment[]>([]);
  const [familyEvaluations, setFamilyEvaluations] = useState<FamilyEvaluation[]>([]);

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        fetchUserProfile(session.user.id);
        fetchBimestres();
        fetchFamilyCommitments();
      } else {
        // Even if not logged in, we might want to fetch bimestres? 
        // Usually better to wait for auth if DB has RLS.
        setLoadingBimestres(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        fetchUserProfile(session.user.id);
        fetchBimestres();
      } else {
        setUserId(null);
        setCurrentUserRole(null);
        setUserFullName('');
        setAcademicLoad([]);
        setBimestres([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [userFullName, setUserFullName] = useState<string>('');

  // Fetch Appreciations, Tutor Data and Family Evaluations when Bimestre Changes
  useEffect(() => {
    if (selectedBimestre) {
      fetchAppreciations(selectedBimestre.id);
      fetchTutorData(selectedBimestre.id);
      fetchFamilyEvaluations(selectedBimestre.id);
    }
  }, [selectedBimestre]);

  // Fetch Grades when Course or Bimestre Changes
  useEffect(() => {
    if (selectedCourse && selectedBimestre) {
      fetchGrades(selectedCourse.classroomId, selectedBimestre.id, selectedCourse.id);
    }
  }, [selectedCourse, selectedBimestre]);

  const fetchBimestres = async () => {
    setLoadingBimestres(true);
    try {
      // 1. Get active academic year
      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeYear) {
        console.warn("No active academic year found.");
        setBimestres([]);
        setLoadingBimestres(false);
        return;
      }

      const { data, error } = await supabase
        .from('bimestres')
        .select('*')
        .eq('academic_year_id', activeYear.id)
        .order('id', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedBimestres: Bimestre[] = data.map((b: any) => ({
          id: b.id.toString(),
          label: b.name,
          isLocked: b.is_locked || false,
          start_date: b.start_date,
          end_date: b.end_date
        }));
        setBimestres(mappedBimestres);
        // Set default selected bimestre (e.g., first one or currently active)
        if (mappedBimestres.length > 0) {
          setSelectedBimestre(prev => prev || mappedBimestres[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching bimestres:', err);
    } finally {
      setLoadingBimestres(false);
    }
  };

  const [progressStats, setProgressStats] = useState<any>(null); // New State

  const fetchProgressStats = async () => {
    if (!selectedBimestre || !userId || currentUserRole !== 'Docente') {
      return;
    }
    // console.log('Fetching stats for', userId, selectedBimestre.id);
    try {
      const { data, error } = await supabase.rpc('get_teacher_completion_stats', {
        p_teacher_id: userId,
        p_bimestre_id: parseInt(selectedBimestre.id)
      });
      if (error) throw error;
      setProgressStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchProgressStats();
  }, [userId, selectedBimestre, currentUserRole]);


  const fetchFamilyCommitments = async () => {
    try {
      const { data, error } = await supabase
        .from('family_commitments')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true });

      if (error) throw error;

      if (data) {
        setFamilyCommitments(data.map((c: any) => ({
          id: c.id.toString(),
          text: c.description
        })));
      }
    } catch (err) {
      console.error('Error fetching family commitments:', err);
    }
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        setUserFullName(profile.full_name || '');
        let appRole: UserRole = 'Docente';
        if (profile.role === 'admin' || profile.role === 'subdirector') appRole = 'Administrador';
        else if (profile.role === 'supervisor') appRole = 'Supervisor';
        setCurrentUserRole(appRole);

        if (appRole === 'Docente') {
          fetchAcademicLoad(uid, profile.tutor_classroom_id);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching profile', err);
    }
  };

  const fetchAcademicLoad = async (uid: string, tutorClassroomId: number | null) => {
    setLoadingCourses(true);
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          id,
          hours_per_week,
          profile_id,
          classroom_id,
          area_id,
          competency_id,
          classrooms (
            id, grade, section, level, is_english_group
          ),
          curricular_areas!inner (
            id, name, level, active,
            competencies (id, name)
          )
        `)
        .eq('profile_id', uid)
        .eq('curricular_areas.active', true);

      if (error) throw error;

      const tId = tutorClassroomId ? Number(tutorClassroomId) : null;

      // Group assignments by classroom and area to handle multi-competency assignments
      const grouped = new Map<string, AcademicLoad>();

      data?.forEach((item: any) => {
        const key = `${item.classroom_id}-${item.area_id}`;
        const allAreaComps = item.curricular_areas?.competencies?.map((c: any) => ({
          id: c.id.toString(),
          name: c.name
        })) || [];

        // Determine competencies for this specific assignment row
        let filteredComps: any[] = [];
        if (item.competency_id === null) {
          // Assigned to the whole area
          filteredComps = allAreaComps;
        } else {
          // Assigned to a specific competency
          const matched = allAreaComps.find((c: any) => c.id.toString() === item.competency_id.toString());
          if (matched) filteredComps = [matched];
        }

        if (filteredComps.length > 0) {
          if (grouped.has(key)) {
            const existing = grouped.get(key)!;
            // Merge competencies, avoiding duplicates
            const existingIds = new Set(existing.competencies.map(c => c.id));
            filteredComps.forEach(c => {
              if (!existingIds.has(c.id)) {
                existing.competencies.push(c);
              }
            });
          } else {
            grouped.set(key, {
              id: item.id.toString(),
              courseName: item.curricular_areas?.name || 'Curso Desconocido',
              gradeSection: item.classrooms
                ? (item.classrooms.is_english_group
                  ? `Inglés ${item.classrooms.section} (${item.classrooms.grade})`
                  : `${item.classrooms.grade}${item.classrooms.section ? ` "${item.classrooms.section}"` : ''}`)
                : 'Sección Desconocida',
              isTutor: tId === Number(item.classroom_id) &&
                (item.curricular_areas?.name?.toUpperCase().includes('TUTOR') ||
                  item.curricular_areas?.name?.toUpperCase().includes('ORIENTACIÓN')),
              teacherName: '',
              classroomId: Number(item.classroom_id) || 0,
              areaId: item.area_id || 0,
              level: item.classrooms?.level,
              isEnglishGroup: item.classrooms?.is_english_group || false,
              competencies: filteredComps
            });
          }
        }
      });

      const mappedLoad = Array.from(grouped.values());

      // If the teacher is a tutor but has no course_assignment in their tutor classroom,
      // inject a virtual entry so the tutoring module still appears
      if (tutorClassroomId && !mappedLoad.some(load => load.classroomId === Number(tutorClassroomId))) {
        const { data: tutorClassroom } = await supabase
          .from('classrooms')
          .select('id, grade, section, level')
          .eq('id', tutorClassroomId)
          .single();

        if (tutorClassroom) {
          mappedLoad.push({
            id: `tutor-virtual-${tutorClassroom.id}`,
            courseName: 'Tutoría',
            gradeSection: `${tutorClassroom.grade} ${tutorClassroom.section}`,
            isTutor: true,
            teacherName: '',
            classroomId: tutorClassroom.id,
            areaId: 0,
            level: tutorClassroom.level,
            competencies: []
          });
        }
      }

      setAcademicLoad(mappedLoad);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchStudents = async (classroomId: number, isEnglishGroup?: boolean) => {
    setLoadingStudents(true);
    if (!classroomId) {
      setStudents([]);
      setLoadingStudents(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, classroom_id, english_classroom_id')
        .eq(isEnglishGroup ? 'english_classroom_id' : 'classroom_id', classroomId)
        .order('last_name', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedStudents: Student[] = data.map(s => ({
          id: s.id,
          fullName: `${s.last_name}, ${s.first_name}`,
          classroomId: s.classroom_id || 0
        }));
        setStudents(mappedStudents);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchAppreciations = async (bimestreId: string) => {
    try {
      let query = supabase
        .from('student_appreciations')
        .select('*')
        .eq('bimestre_id', parseInt(bimestreId));

      // Supervisors and Admins should not see drafts (is_approved is null)
      if (currentUserRole !== 'Docente') {
        query = query.not('is_approved', 'is', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching appreciations:', error);
        return;
      }

      if (data) {
        const mappedAppreciations: AppreciationEntry[] = data.map((a: any) => ({
          studentId: a.student_id,
          comment: a.comment || '',
          isApproved: a.is_approved === true,
          isSent: a.is_approved !== null
        }));
        setAppreciations(mappedAppreciations);
      }
    } catch (err) {
      console.error('Error in fetchAppreciations:', err);
    }
  };

  const fetchGrades = async (classroomId: number, bimestreId: string, courseId?: string, isEnglishGroup?: boolean) => {
    try {
      // Get students first to filter grades
      const { data: sData } = await supabase
        .from('students')
        .select('id')
        .eq(isEnglishGroup ? 'english_classroom_id' : 'classroom_id', classroomId);
      const sIds = sData?.map(s => s.id) || [];

      if (sIds.length === 0) {
        setGrades([]);
        return;
      }

      const { data, error } = await supabase
        .from('student_grades')
        .select('*, competencies!inner(id, curricular_areas!inner(active))')
        .eq('bimestre_id', parseInt(bimestreId))
        .in('student_id', sIds)
        .eq('competencies.curricular_areas.active', true);

      if (error) throw error;

      if (data) {
        setGrades(data.map((g: any) => ({
          studentId: g.student_id,
          courseId: courseId || selectedCourse?.id || '',
          competencyId: g.competency_id.toString(),
          grade: g.grade as GradeLevel,
          descriptiveConclusion: g.descriptive_conclusion || ''
        })));
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
    }
  };

  const fetchTutorData = async (bimestreId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_behavior_grades')
        .select('*')
        .eq('bimestre_id', parseInt(bimestreId));

      if (error) {
        console.error('Error fetching behavior grades:', error);
        return;
      }

      if (data) {
        const mappedTutorData: TutorValues[] = data.map((t: any) => ({
          studentId: t.student_id,
          comportamiento: (t.behavior_grade || '') as GradeLevel,
          tutoriaValores: (t.values_grade || '') as GradeLevel
        }));
        setTutorData(mappedTutorData);
      }
    } catch (err) {
      console.error('Error in fetchTutorData:', err);
    }
  };

  const fetchFamilyEvaluations = async (bimestreId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_evaluations')
        .select('*')
        .eq('bimestre_id', parseInt(bimestreId));

      if (error) throw error;

      if (data) {
        setFamilyEvaluations(data.map((e: any) => ({
          studentId: e.student_id,
          commitmentId: e.commitment_id.toString(),
          grade: e.grade as GradeLevel
        })));
      }
    } catch (err) {
      console.error('Error fetching family evaluations:', err);
    }
  };


  const tutorSections = useMemo(() => {
    // Unique classrooms where isTutor is true
    // In current logic, usually one tutor section per teacher, but filter just in case
    // We need to deduplicate by classroomId if multiple courses in same tutor section
    const unique = new Map();
    academicLoad.forEach(load => {
      if (load.isTutor && !unique.has(load.classroomId)) {
        unique.set(load.classroomId, load);
      }
    });
    return Array.from(unique.values());
  }, [academicLoad]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // window.location.href = PORTAL_URL; // let auth listener handle it
  };

  const handleCourseSelect = async (course: AcademicLoad) => {
    setSelectedCourse(course);
    navigate(`/curso/${course.id}`);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setStudents([]);
    navigate('/mis-cursos');
  };

  const updateGrade = async (studentId: string, competencyId: string, grade: GradeLevel, descriptiveConclusion?: string) => {
    if (!selectedBimestre || selectedBimestre.isLocked) return;

    const compIdStr = competencyId.toString();

    // Optimistic Update
    setGrades(prev => {
      const filtered = prev.filter(g => !(g.studentId === studentId && g.competencyId === compIdStr));
      if (grade === '') return filtered;
      return [...filtered, { studentId, courseId: selectedCourse?.id || '', competencyId: compIdStr, grade, descriptiveConclusion }];
    });

    try {
      if (grade === '') {
        const { error } = await supabase
          .from('student_grades')
          .delete()
          .match({
            student_id: studentId,
            competency_id: parseInt(compIdStr),
            bimestre_id: parseInt(selectedBimestre.id)
          });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('student_grades').upsert({
          student_id: studentId,
          competency_id: parseInt(compIdStr),
          bimestre_id: parseInt(selectedBimestre.id),
          grade: grade,
          descriptive_conclusion: descriptiveConclusion,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id, competency_id, bimestre_id' });

        if (error) throw error;
      }

      fetchProgressStats();

    } catch (err: any) {
      console.error('Error saving grade:', err);
    }
  };

  const updateFamilyEvaluation = (studentId: string, commitmentId: string, grade: GradeLevel) => {
    if (selectedBimestre?.isLocked) return;
    setFamilyEvaluations(prev => {
      const filtered = prev.filter(e => !(e.studentId === studentId && e.commitmentId === commitmentId));
      if (grade === '') return filtered;
      return [...filtered, { studentId, commitmentId, grade }];
    });

    if (!selectedBimestre) return;

    supabase.from('family_evaluations').upsert({
      student_id: studentId,
      commitment_id: parseInt(commitmentId),
      bimestre_id: parseInt(selectedBimestre.id),
      grade: grade,
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id, commitment_id, bimestre_id' }).then(({ error }) => {
      if (error) {
        console.error('Error saving family evaluation:', error);
      } else {
        fetchProgressStats();
      }
    });
  };

  const updateAppreciation = async (studentId: string, comment: string, shouldSend: boolean = false) => {
    if (selectedBimestre?.isLocked) return;

    // Logic:
    // If shouldSend is true: is_approved = false (Pending Review)
    // If shouldSend is false (Save as Draft): is_approved = null (Draft)
    // If we are a supervisor, we don't change the sent status, just the comment.

    // Determine is_approved for DB
    let nextApprovedState: boolean | null = null;
    if (currentUserRole === 'Docente') {
      nextApprovedState = shouldSend ? false : null;
    }

    setAppreciations(prev => {
      const existing = prev.find(a => a.studentId === studentId);
      const filtered = prev.filter(a => a.studentId !== studentId);
      return [...filtered, {
        studentId,
        comment,
        isApproved: currentUserRole === 'Docente' ? false : (existing ? existing.isApproved : false),
        isSent: currentUserRole === 'Docente' ? shouldSend : (existing ? existing.isSent : false)
      }];
    });

    if (!selectedBimestre) return;

    try {
      const updateData: any = {
        student_id: studentId,
        bimestre_id: parseInt(selectedBimestre.id),
        comment: comment,
        tutor_id: userId,
        updated_at: new Date().toISOString()
      };

      if (currentUserRole === 'Docente') {
        updateData.is_approved = nextApprovedState;
      }

      await supabase
        .from('student_appreciations')
        .upsert(updateData, { onConflict: 'student_id, bimestre_id' });

      fetchProgressStats();

    } catch (err) {
      console.error('Error saving appreciation:', err);
    }
  };

  const approveAppreciation = async (studentId: string) => {
    if (currentUserRole !== 'Supervisor' && currentUserRole !== 'Administrador') return;

    const currentApp = appreciations.find(a => a.studentId === studentId);
    if (!currentApp) return;

    const newStatus = !currentApp.isApproved;

    setAppreciations(prev => {
      return prev.map(a => a.studentId === studentId ? { ...a, isApproved: newStatus } : a);
    });

    if (!selectedBimestre) return;

    try {
      const { error } = await supabase
        .from('student_appreciations')
        .update({ is_approved: newStatus, updated_at: new Date().toISOString() })
        .eq('student_id', studentId)
        .eq('bimestre_id', parseInt(selectedBimestre.id));

      if (error) throw error;
    } catch (err) {
      console.error('Error approving appreciation:', err);
      setAppreciations(prev => prev.map(a => a.studentId === studentId ? { ...a, isApproved: !newStatus } : a));
    }
  };

  const updateTutorData = async (studentId: string, field: 'comportamiento' | 'tutoriaValores', value: string) => {
    if (selectedBimestre?.isLocked || currentUserRole === 'Supervisor') return;

    setTutorData(prev => {
      const existing = prev.find(t => t.studentId === studentId) || { studentId, comportamiento: '' as GradeLevel, tutoriaValores: '' as GradeLevel };
      const updated = { ...existing, [field]: value as GradeLevel };
      const filtered = prev.filter(t => t.studentId !== studentId);
      return [...filtered, updated];
    });

    if (!selectedBimestre) return;

    try {
      const currentTutor = tutorData.find(t => t.studentId === studentId) || { comportamiento: '', tutoriaValores: '' };
      const behaviorGrade = field === 'comportamiento' ? value : currentTutor.comportamiento;
      const valuesGrade = field === 'tutoriaValores' ? value : currentTutor.tutoriaValores;

      const { error } = await supabase
        .from('student_behavior_grades')
        .upsert({
          student_id: studentId,
          bimestre_id: parseInt(selectedBimestre.id),
          behavior_grade: behaviorGrade,
          values_grade: valuesGrade,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id, bimestre_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating tutor data:', err);
    }
  };



  const userName = useMemo(() => {
    const toTitleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    if (!userFullName) return userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1);

    if (userFullName.includes(',')) {
      const [lastNames, firstNames] = userFullName.split(',').map(s => s.trim());
      const firstName = firstNames.split(/\s+/)[0];
      const firstLastName = lastNames.split(/\s+/)[0];
      return `${toTitleCase(firstName)} ${toTitleCase(firstLastName)}`;
    }

    const parts = userFullName.trim().split(/\s+/);
    if (parts.length >= 3) {
      const firstName = toTitleCase(parts[0]);
      const firstLastName = toTitleCase(parts.length >= 4 ? parts[2] : parts[1]);
      return `${firstName} ${firstLastName}`;
    }
    if (parts.length === 2) {
      return `${toTitleCase(parts[0])} ${toTitleCase(parts[1])}`;
    }
    return toTitleCase(userFullName);
  }, [userFullName, userEmail]);
  const isStaff = currentUserRole === 'Supervisor' || currentUserRole === 'Administrador';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="*"
        element={
          <RequireAuth allowedRoles={ALLOWED_ROLES}>
            <div className="min-h-screen bg-gray-50 flex flex-col text-sm md:text-base">
              <header className="bg-white border-b sticky top-0 z-[100] shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-2 -ml-2 text-gray-400 lg:hidden hover:bg-gray-100 rounded-lg"
                    >
                      <Menu size={24} />
                    </button>

                    <div className="w-10 h-10 md:w-11 md:h-11 bg-institutional rounded-xl flex items-center justify-center text-white shadow-lg shadow-institutional/20">
                      <ClipboardCheck size={24} />
                    </div>
                    <div>
                      <h1 className="font-bold text-sm md:text-lg text-gray-800 leading-none mb-1">IEP Valores y Ciencias</h1>
                      <p className="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-wider uppercase">Panel {isStaff ? 'Institucional' : 'Docente'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Global Bimestre Selector for Staff and Teachers alike */}
                    <div className="hidden lg:flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                      {loadingBimestres ? (
                        <div className="px-6 py-2"><Loader2 size={16} className="animate-spin text-institutional/30" /></div>
                      ) : (
                        bimestres.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              if (!b.isLocked) setSelectedBimestre(b);
                            }}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${selectedBimestre?.id === b.id
                              ? 'bg-institutional text-white shadow-lg shadow-institutional/20 scale-105'
                              : b.isLocked
                                ? 'text-gray-300 bg-transparent cursor-not-allowed opacity-50'
                                : 'text-gray-400 hover:bg-white hover:shadow-sm'
                              }`}
                          >
                            {b.shortLabel || b.label} {b.isLocked && <Lock size={12} />}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Usuario Activo</span>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900 leading-none">Bienvenido, {userName}</p>
                          <p className="text-[9px] font-black uppercase text-institutional tracking-widest mt-1">{currentUserRole}</p>
                        </div>
                        <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-gray-400">
                          <UserCircle size={22} />
                        </div>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all active:scale-90 border border-red-100">
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex-1 flex max-w-[1600px] mx-auto w-full relative">
                <Sidebar
                  role={currentUserRole}
                  onLogout={handleLogout}
                  tutorSections={tutorSections}
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />

                <main className="flex-1 px-4 py-8 overflow-y-auto">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        isStaff ? (
                          selectedBimestre && (
                            <SupervisorStatsDashboard
                              bimestre={selectedBimestre}
                            />
                          )
                        ) : (
                          <TeacherDashboard
                            academicLoad={academicLoad}
                            tutorSections={tutorSections}
                            selectedBimestre={selectedBimestre}
                            userName={userName}
                            progressStats={progressStats}
                          />
                        )
                      }
                    />

                    <Route
                      path="/monitoreo"
                      element={
                        isStaff && selectedBimestre ? (
                          <AcademicMonitoring
                            role={currentUserRole}
                            bimestre={selectedBimestre}
                            allBimestres={bimestres}
                            onBimestreChange={(b) => setSelectedBimestre(b)}
                            grades={grades}
                            appreciations={appreciations}
                            tutorData={tutorData}
                            familyCommitments={familyCommitments}
                            familyEvaluations={familyEvaluations}
                            onApproveAppreciation={approveAppreciation}
                            onUpdateAppreciation={updateAppreciation}
                            onUpdateGrade={updateGrade}
                          />
                        ) : <Navigate to="/" />
                      }
                    />

                    <Route
                      path="/apreciaciones"
                      element={
                        isStaff && selectedBimestre ? (
                          <AppreciationsReview
                            role={currentUserRole}
                            bimestre={selectedBimestre}
                            allBimestres={bimestres}
                            onBimestreChange={(b) => setSelectedBimestre(b)}
                            onApproveAppreciation={approveAppreciation}
                            onUpdateAppreciation={updateAppreciation}
                          />
                        ) : <Navigate to="/" />
                      }
                    />

                    <Route
                      path="/reportes"
                      element={
                        isStaff ? <ReportsModule /> : <Navigate to="/" />
                      }
                    />

                    <Route
                      path="/configuracion"
                      element={
                        currentUserRole === 'Administrador' ? <AdminConfig /> : <Navigate to="/" />
                      }
                    />

                    <Route
                      path="/mis-cursos"
                      element={
                        <TeacherCourseList
                          academicLoad={academicLoad}
                          tutorSections={tutorSections}
                          selectedBimestre={selectedBimestre}
                        />
                      }
                    />

                    <Route
                      path="/curso/:id"
                      element={
                        <CourseRouteWrapper
                          selectedCourse={selectedCourse}
                          setSelectedCourse={setSelectedCourse}
                          academicLoad={academicLoad}
                          fetchStudents={fetchStudents}
                          fetchGrades={fetchGrades}
                          loadingStudents={loadingStudents}
                          selectedBimestre={selectedBimestre}
                          currentUserRole={currentUserRole}
                          students={students}
                          grades={grades}
                          appreciations={appreciations}
                          tutorData={tutorData}
                          familyCommitments={familyCommitments}
                          familyEvaluations={familyEvaluations}
                          updateGrade={updateGrade}
                          updateAppreciation={updateAppreciation}
                          approveAppreciation={approveAppreciation}
                          updateTutorData={updateTutorData}
                          updateFamilyEvaluation={updateFamilyEvaluation}
                          handleBackToDashboard={handleBackToCourses}
                          loadingCourses={loadingCourses}
                        />
                      }
                    />

                    <Route
                      path="/tutoria/:classroomId"
                      element={
                        <TutorRouteWrapper
                          selectedCourse={selectedCourse}
                          setSelectedCourse={setSelectedCourse}
                          academicLoad={academicLoad}
                          fetchStudents={fetchStudents}
                          fetchGrades={fetchGrades}
                          loadingStudents={loadingStudents}
                          selectedBimestre={selectedBimestre}
                          currentUserRole={currentUserRole}
                          students={students}
                          grades={grades}
                          appreciations={appreciations}
                          tutorData={tutorData}
                          familyCommitments={familyCommitments}
                          familyEvaluations={familyEvaluations}
                          updateGrade={updateGrade}
                          updateAppreciation={updateAppreciation}
                          approveAppreciation={approveAppreciation}
                          updateTutorData={updateTutorData}
                          updateFamilyEvaluation={updateFamilyEvaluation}
                          handleBackToDashboard={handleBackToCourses}
                          loadingCourses={loadingCourses}
                        />
                      }
                    />

                    <Route
                      path="/familia/:classroomId"
                      element={
                        <FamilyRouteWrapper
                          selectedCourse={selectedCourse}
                          setSelectedCourse={setSelectedCourse}
                          academicLoad={academicLoad}
                          fetchStudents={fetchStudents}
                          fetchGrades={fetchGrades}
                          loadingStudents={loadingStudents}
                          selectedBimestre={selectedBimestre}
                          currentUserRole={currentUserRole}
                          students={students}
                          grades={grades}
                          appreciations={appreciations}
                          tutorData={tutorData}
                          familyCommitments={familyCommitments}
                          familyEvaluations={familyEvaluations}
                          updateGrade={updateGrade}
                          updateAppreciation={updateAppreciation}
                          approveAppreciation={approveAppreciation}
                          updateTutorData={updateTutorData}
                          updateFamilyEvaluation={updateFamilyEvaluation}
                          handleBackToDashboard={handleBackToCourses}
                          loadingCourses={loadingCourses}
                        />
                      }
                    />

                    {/* Redirección por defecto si la ruta no existe */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </RequireAuth>
        }
      />
    </Routes>
  );
};

// Helper components for Routes to avoid large inline code and handle initial student fetch
const CourseRouteWrapper = ({
  selectedCourse, setSelectedCourse, academicLoad, fetchStudents, fetchGrades, loadingStudents, selectedBimestre,
  currentUserRole, students, grades, appreciations, tutorData, familyCommitments, familyEvaluations,
  updateGrade, updateAppreciation, approveAppreciation, updateTutorData, updateFamilyEvaluation, handleBackToDashboard, loadingCourses
}: any) => {
  const { id } = useParams<{ id: string }>();
  const course = academicLoad.find((c: any) => c.id === id);

  useEffect(() => {
    if (course && selectedBimestre) {
      fetchStudents(course.classroomId, course.isEnglishGroup);
      fetchGrades(course.classroomId, selectedBimestre.id, course.id, course.isEnglishGroup);
      setSelectedCourse(course);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, selectedBimestre, academicLoad]);

  if (loadingCourses) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-institutional" size={48} />
    </div>
  );

  if (academicLoad.length > 0 && !course) {
    console.warn("Course not found for ID:", id);
    return <Navigate to="/" replace />;
  }

  if (!course) return null;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <button onClick={handleBackToDashboard} className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group active:scale-90">
            <ChevronLeft className="text-gray-400 group-hover:text-institutional" size={24} />
          </button>
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {course.courseName}
            </h2>
            <p className="text-sm text-gray-500 font-bold">{course.gradeSection} • {selectedBimestre?.label}</p>
          </div>
        </div>
      </div>

      {loadingStudents ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-institutional" size={48} />
        </div>
      ) : selectedBimestre ? (
        <GradingMatrix
          role={currentUserRole}
          course={course}
          students={students}
          isTutorMode={false}
          isFamilyMode={false}
          bimestre={selectedBimestre}
          grades={grades}
          appreciations={appreciations}
          tutorData={tutorData}
          familyCommitments={familyCommitments}
          familyEvaluations={familyEvaluations}
          onUpdateGrade={updateGrade}
          onUpdateAppreciation={updateAppreciation}
          onApproveAppreciation={approveAppreciation}
          onUpdateTutorData={updateTutorData}
          onUpdateFamilyEvaluation={updateFamilyEvaluation}
        />
      ) : null}
    </div>
  );
};

const TutorRouteWrapper = ({
  selectedCourse, setSelectedCourse, academicLoad, fetchStudents, fetchGrades, loadingStudents, selectedBimestre,
  currentUserRole, students, grades, appreciations, tutorData, familyCommitments, familyEvaluations,
  updateGrade, updateAppreciation, approveAppreciation, updateTutorData, updateFamilyEvaluation, handleBackToDashboard, loadingCourses
}: any) => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const course = academicLoad.find((c: any) => c.classroomId.toString() === classroomId && c.isTutor);

  useEffect(() => {
    if (course && selectedBimestre) {
      fetchStudents(course.classroomId, false);
      fetchGrades(course.classroomId, selectedBimestre.id, course.id, false);
      setSelectedCourse(course);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [classroomId, selectedBimestre, academicLoad]);

  if (loadingCourses) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-institutional" size={48} />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Cargando datos de tutoría...</p>
      </div>
    </div>
  );

  if (academicLoad.length > 0 && !course) {
    console.warn("Tutor course not found for classroom:", classroomId);
    return <Navigate to="/" replace />;
  }
  if (!course) return null;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <button onClick={handleBackToDashboard} className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group active:scale-90">
            <ChevronLeft className="text-gray-400 group-hover:text-institutional" size={24} />
          </button>
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Módulo de Tutoría</h2>
            <p className="text-sm text-gray-500 font-bold">{course.gradeSection} • {selectedBimestre?.label}</p>
          </div>
        </div>
      </div>

      {loadingStudents ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-institutional" size={48} />
        </div>
      ) : selectedBimestre ? (
        <GradingMatrix
          role={currentUserRole}
          course={course}
          students={students}
          isTutorMode={true}
          isFamilyMode={false}
          bimestre={selectedBimestre}
          grades={grades}
          appreciations={appreciations}
          tutorData={tutorData}
          familyCommitments={familyCommitments}
          familyEvaluations={familyEvaluations}
          onUpdateGrade={updateGrade}
          onUpdateAppreciation={updateAppreciation}
          onApproveAppreciation={approveAppreciation}
          onUpdateTutorData={updateTutorData}
          onUpdateFamilyEvaluation={updateFamilyEvaluation}
        />
      ) : null}
    </div>
  );
};

const FamilyRouteWrapper = ({
  selectedCourse, setSelectedCourse, academicLoad, fetchStudents, fetchGrades, loadingStudents, selectedBimestre,
  currentUserRole, students, grades, appreciations, tutorData, familyCommitments, familyEvaluations,
  updateGrade, updateAppreciation, approveAppreciation, updateTutorData, updateFamilyEvaluation, handleBackToDashboard, loadingCourses
}: any) => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const course = academicLoad.find((c: any) => c.classroomId.toString() === classroomId && c.isTutor);

  useEffect(() => {
    if (course && selectedBimestre) {
      fetchStudents(course.classroomId, false);
      fetchGrades(course.classroomId, selectedBimestre.id, course.id, false);
      setSelectedCourse(course);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [classroomId, selectedBimestre, academicLoad]);

  if (loadingCourses) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text- institutional" size={48} />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Cargando compromisos de familia...</p>
      </div>
    </div>
  );

  if (academicLoad.length > 0 && !course) {
    console.warn("Family course not found for classroom:", classroomId);
    return <Navigate to="/" replace />;
  }
  if (!course) return null;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <button onClick={handleBackToDashboard} className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group active:scale-90">
            <ChevronLeft className="text-gray-400 group-hover:text-institutional" size={24} />
          </button>
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Compromisos de la Familia</h2>
            <p className="text-sm text-gray-500 font-bold">{course.gradeSection} • {selectedBimestre?.label}</p>
          </div>
        </div>
      </div>

      {loadingStudents ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-institutional" size={48} />
        </div>
      ) : selectedBimestre ? (
        <GradingMatrix
          role={currentUserRole}
          course={course}
          students={students}
          isTutorMode={false}
          isFamilyMode={true}
          bimestre={selectedBimestre}
          grades={grades}
          appreciations={appreciations}
          tutorData={tutorData}
          familyCommitments={familyCommitments}
          familyEvaluations={familyEvaluations}
          onUpdateGrade={updateGrade}
          onUpdateAppreciation={updateAppreciation}
          onApproveAppreciation={approveAppreciation}
          onUpdateTutorData={updateTutorData}
          onUpdateFamilyEvaluation={updateFamilyEvaluation}
        />
      ) : null}
    </div>
  );
};

export default App;
