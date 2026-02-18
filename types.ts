
export type GradeLevel = 'AD' | 'A' | 'B' | 'C' | 'D' | '';
export type UserRole = 'Docente' | 'Supervisor' | 'Administrador';

export interface Competency {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  fullName: string;
  classroomId?: number; // Added for DB link
}

export interface AcademicLoad {
  id: string;
  courseName: string;
  gradeSection: string;
  isTutor: boolean;
  competencies: Competency[];
  teacherName: string;
  classroomId: number; // Added for DB link
  areaId: number;     // Added for DB link
  level?: string;      // Added for Level validation (Primaria/Secundaria)
}

export interface Bimestre {
  id: string;
  label: string;
  isLocked: boolean;
  start_date?: string;
  end_date?: string;
}

export interface GradeEntry {
  studentId: string;
  courseId: string;
  competencyId: string;
  grade: GradeLevel;
  descriptiveConclusion?: string;
}

export interface AppreciationEntry {
  studentId: string;
  comment: string;
  isApproved: boolean;
  isSent: boolean;
}

export interface TutorValues {
  studentId: string;
  comportamiento: GradeLevel;
  tutoriaValores: GradeLevel;
}

export interface FamilyCommitment {
  id: string;
  text: string;
}

export interface FamilyEvaluation {
  studentId: string;
  commitmentId: string;
  grade: GradeLevel;
}

export interface StudentGradesConsolidated {
  student: Student;
  courses: {
    course: AcademicLoad;
    grades: GradeEntry[];
  }[];
  appreciation: AppreciationEntry;
  tutorData: TutorValues;
}
