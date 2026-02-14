
import { AcademicLoad, Student, Bimestre } from './types';

export const MOCK_ACADEMIC_LOAD: AcademicLoad[] = [
  {
    id: 'c1',
    courseName: 'Matemática',
    gradeSection: '2do Primaria A',
    isTutor: true,
    teacherName: 'Prof. Juan Pérez',
    classroomId: 0, // Placeholder
    areaId: 0, // Placeholder
    competencies: [
      { id: 'm1', name: 'Resuelve problemas de cantidad' },
      { id: 'm2', name: 'Resuelve problemas de regularidad, equivalencia y cambio' },
      { id: 'm3', name: 'Resuelve problemas de forma, movimiento y localización' },
      { id: 'm4', name: 'Resuelve problemas de gestión de datos e incertidumbre' }
    ]
  },
  {
    id: 'c2',
    courseName: 'Comunicación',
    gradeSection: '2do Primaria A',
    isTutor: false,
    teacherName: 'Prof. María García',
    classroomId: 0, // Placeholder
    areaId: 0, // Placeholder
    competencies: [
      { id: 'com1', name: 'Se comunica oralmente en su lengua materna' },
      { id: 'com2', name: 'Lee diversos tipos de textos escritos en su lengua materna' },
      { id: 'com3', name: 'Escribe diversos tipos de textos en su lengua materna' }
    ]
  },
  {
    id: 'c3',
    courseName: 'Ciencia y Tecnología',
    gradeSection: '3ro Primaria B',
    isTutor: false,
    teacherName: 'Prof. Ricardo Soto',
    classroomId: 0, // Placeholder
    areaId: 0, // Placeholder
    competencies: [
      { id: 'ct1', name: 'Indaga mediante métodos científicos' },
      { id: 'ct2', name: 'Explica el mundo físico basándose en conocimientos' },
      { id: 'ct3', name: 'Diseña y construye soluciones tecnológicas' }
    ]
  }
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', fullName: 'Alarcón Torres, Luis Daniel', classroomId: 0 },
  { id: 's2', fullName: 'Bermúdez Soto, María Paz', classroomId: 0 },
  { id: 's3', fullName: 'Cáceres Mendoza, Juan Diego', classroomId: 0 },
  { id: 's4', fullName: 'Delgado Ruiz, Valentina', classroomId: 0 },
  { id: 's5', fullName: 'Espinoza Castro, Mateo', classroomId: 0 },
  { id: 's6', fullName: 'Fuentes Rojas, Luciana', classroomId: 0 }
];

export const BIMESTRES: Bimestre[] = [
  { id: '1', label: 'I Bimestre', isLocked: true },
  { id: '2', label: 'II Bimestre', isLocked: false },
  { id: '3', label: 'III Bimestre', isLocked: false },
  { id: '4', label: 'IV Bimestre', isLocked: false }
];
