
import React, { useState } from 'react';
import { AcademicLoad, Bimestre, GradeEntry, AppreciationEntry, TutorValues, GradeLevel, Student, UserRole, FamilyCommitment, FamilyEvaluation } from '../types';
import { MessageSquare, CheckCircle2, Info, Lock, Eye, Check, User, FileText, CheckCircle } from 'lucide-react';
import DescriptiveCommentModal from './DescriptiveCommentModal';
import { generateGlobalReportCard } from '../utils/pdfGenerator';

interface GradingMatrixProps {
  role: UserRole;
  course: AcademicLoad;
  students: Student[]; // Added prop
  isTutorMode: boolean;
  isFamilyMode?: boolean;
  bimestre: Bimestre;
  grades: GradeEntry[];
  appreciations: AppreciationEntry[];
  tutorData: TutorValues[];
  familyCommitments?: FamilyCommitment[];
  familyEvaluations?: FamilyEvaluation[];
  onUpdateGrade: (sId: string, cId: string, grade: GradeLevel, descriptiveConclusion?: string) => void;
  onUpdateAppreciation: (sId: string, comment: string) => void;
  onApproveAppreciation: (sId: string) => void;
  onUpdateTutorData: (sId: string, field: 'comportamiento' | 'tutoriaValores', value: string) => void;
  onUpdateFamilyEvaluation: (sId: string, fcId: string, grade: GradeLevel) => void;
}

const GradingMatrix: React.FC<GradingMatrixProps> = ({
  role,
  course,
  students,
  isTutorMode,
  isFamilyMode = false,
  bimestre,
  grades,
  appreciations,
  tutorData,
  familyCommitments = [],
  familyEvaluations = [],
  onUpdateGrade,
  onUpdateAppreciation,
  onApproveAppreciation,
  onUpdateTutorData,
  onUpdateFamilyEvaluation
}) => {
  const [activeCommentStudent, setActiveCommentStudent] = useState<Student | null>(null);
  const [activeConclusionData, setActiveConclusionData] = useState<{
    student: Student;
    competencyId: string;
    grade: GradeLevel;
    conclusion: string;
  } | null>(null);

  const getGradeValue = (studentId: string, competencyId: string) => {
    return grades.find(g => g.studentId === studentId && g.competencyId === competencyId)?.grade || '';
  };

  const getGradeConclusion = (studentId: string, competencyId: string) => {
    return grades.find(g => g.studentId === studentId && g.competencyId === competencyId)?.descriptiveConclusion || '';
  };

  const isConclusionMandatory = (grade: GradeLevel) => {
    if (!course.level) return false;
    const level = course.level.toUpperCase();
    if (level.includes('PRIMARIA')) {
      return grade === 'B' || grade === 'C';
    }
    if (level.includes('SECUNDARIA')) {
      return grade === 'C';
    }
    return false;
  };

  const handleGradeChange = (student: Student, competencyId: string, grade: GradeLevel) => {
    if (grade === '') {
      onUpdateGrade(student.id, competencyId, grade, '');
      return;
    }

    const currentConclusion = getGradeConclusion(student.id, competencyId);

    if (isConclusionMandatory(grade) && !currentConclusion) {
      setActiveConclusionData({
        student,
        competencyId,
        grade,
        conclusion: currentConclusion
      });
    } else {
      onUpdateGrade(student.id, competencyId, grade, currentConclusion);
    }
  };

  const getFamilyGrade = (studentId: string, fcId: string) => {
    return familyEvaluations.find(e => e.studentId === studentId && e.commitmentId === fcId)?.grade || '';
  };

  const getAppreciation = (studentId: string) => {
    return appreciations.find(a => a.studentId === studentId) || { studentId, comment: '', isApproved: false };
  };

  const getTutorData = (studentId: string) => {
    return tutorData.find(t => t.studentId === studentId) || { studentId, comportamiento: '' as GradeLevel, tutoriaValores: '' as GradeLevel };
  };

  const handlePdfDownload = (student: Student) => {
    const appEntry = getAppreciation(student.id);
    const tutData = getTutorData(student.id);
    const stdGrades = grades.filter(g => g.studentId === student.id);
    generateGlobalReportCard(student, bimestre, [course], stdGrades, appEntry, tutData);
  };

  const getGradeColorClass = (grade: GradeLevel) => {
    switch (grade) {
      case 'AD': return 'text-[#1E40AF] font-black bg-blue-50 ring-1 ring-blue-200';
      case 'A': return 'text-[#047857] font-black bg-emerald-50 ring-1 ring-emerald-200';
      case 'B': return 'text-[#B45309] font-black bg-amber-50 ring-1 ring-amber-200';
      case 'C': return 'text-[#B91C1C] font-black bg-red-50 ring-1 ring-red-200';
      default: return 'text-gray-300 bg-gray-50/30 ring-1 ring-gray-100';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Banner de bloqueo */}
      {bimestre.isLocked && (
        <div className="bg-red-600 p-4 px-8 flex items-center justify-between shadow-lg rounded-3xl">
          <div className="flex items-center gap-3 text-white">
            <Lock size={18} className="text-red-100 shrink-0" />
            <span className="text-sm font-black uppercase tracking-widest">Bimestre Cerrado</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-white font-bold text-xs border border-white/30 whitespace-nowrap">
            <Eye size={12} /> Solo Lectura
          </div>
        </div>
      )}

      {/* COMPROMISOS DE LA FAMILIA - LISTADO DE ÍTEMS */}
      {isFamilyMode && (
        <div className="animate-in slide-in-from-top duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyCommitments.map((fc) => (
              <div key={fc.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-institutional transition-all">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-200 group-hover:text-institutional group-hover:bg-institutional/5 transition-all">
                  <CheckCircle size={20} />
                </div>
                <span className="text-xs font-black text-gray-500 uppercase leading-snug group-hover:text-gray-800">{fc.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {students.map((student) => {
          const appreciation = getAppreciation(student.id);
          const tData = getTutorData(student.id);

          return (
            <div key={student.id} className="bg-white rounded-[2.5rem] p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                  <h3 className="font-black text-gray-800 text-sm">{student.fullName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {appreciation.isApproved && <CheckCircle2 size={18} className="text-green-500" />}
                </div>
              </div>

              <div className="space-y-4">
                {isFamilyMode ? (
                  familyCommitments.map((fc) => (
                    <div key={fc.id} className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">{fc.text}</span>
                      <select
                        disabled={bimestre.isLocked || role === 'Supervisor'}
                        value={getFamilyGrade(student.id, fc.id)}
                        onChange={(e) => onUpdateFamilyEvaluation(student.id, fc.id, e.target.value as GradeLevel)}
                        className={`w-full p-3.5 rounded-xl border-none font-black text-sm text-center ${getGradeColorClass(getFamilyGrade(student.id, fc.id))}`}
                      >
                        <option value="">Nota</option>
                        <option value="AD">AD</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  ))
                ) : !isTutorMode ? (
                  course.competencies.map((comp) => {
                    const grade = getGradeValue(student.id, comp.id);
                    const conclusion = getGradeConclusion(student.id, comp.id);
                    const isMandatory = isConclusionMandatory(grade);
                    const hasConclusion = conclusion.trim() !== '';

                    return (
                      <div key={comp.id} className="flex flex-col gap-1.5 border-b border-gray-50 pb-2 mb-2 last:border-0 last:mb-0">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight line-clamp-1">{comp.name}</span>
                        <div className="flex gap-2">
                          <select
                            disabled={bimestre.isLocked || role === 'Supervisor'}
                            value={grade}
                            onChange={(e) => handleGradeChange(student, comp.id, e.target.value as GradeLevel)}
                            className={`flex-1 p-3.5 rounded-xl border-none font-black text-sm text-center ${getGradeColorClass(grade)}`}
                          >
                            <option value="">Nota</option>
                            <option value="AD">AD</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>

                          {grade && (
                            <button
                              onClick={() => setActiveConclusionData({
                                student,
                                competencyId: comp.id,
                                grade,
                                conclusion
                              })}
                              className={`p-3.5 rounded-xl border-2 transition-all shrink-0 ${hasConclusion
                                ? 'bg-institutional border-institutional text-white shadow-md shadow-institutional/20'
                                : isMandatory
                                  ? 'bg-red-50 border-red-200 text-red-500 animate-pulse'
                                  : 'bg-white border-gray-200 text-gray-300'
                                }`}
                            >
                              <MessageSquare size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black text-amber-600 uppercase">Conducta</span>
                        <select
                          disabled={bimestre.isLocked || role === 'Supervisor'}
                          value={tData.comportamiento}
                          onChange={(e) => onUpdateTutorData(student.id, 'comportamiento', e.target.value as GradeLevel)}
                          className={`w-full p-3.5 rounded-xl border-none font-black text-sm text-center ${getGradeColorClass(tData.comportamiento)}`}
                        >
                          <option value="">-</option>
                          <option value="AD">AD</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black text-amber-600 uppercase">Valores</span>
                        <select
                          disabled={bimestre.isLocked || role === 'Supervisor'}
                          value={tData.tutoriaValores}
                          onChange={(e) => onUpdateTutorData(student.id, 'tutoriaValores', e.target.value as GradeLevel)}
                          className={`w-full p-3.5 rounded-xl border-none font-black text-sm text-center ${getGradeColorClass(tData.tutoriaValores)}`}
                        >
                          <option value="">-</option>
                          <option value="AD">AD</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-institutional uppercase">Apreciación</span>
                        {appreciation.comment.trim() !== '' && (
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase ${appreciation.isApproved ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}>
                            <Check size={12} strokeWidth={4} />
                            {appreciation.isApproved ? 'Aprobado' : 'Pendiente'}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveCommentStudent(student)}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 transition-all ${appreciation.comment.trim() !== ''
                            ? 'bg-institutional border-institutional text-institutional shadow-md'
                            : 'bg-white border-gray-200 text-gray-400'
                            }`}
                        >
                          <MessageSquare size={16} />
                          {appreciation.comment.trim() !== '' ? 'Editar Texto' : 'Redactar'}
                        </button>

                        {(role === 'Supervisor' || role === 'Administrador') && !bimestre.isLocked && appreciation.comment.trim() !== '' && (
                          <button
                            onClick={() => onApproveAppreciation(student.id)}
                            className={`px-4 rounded-xl border-2 transition-all ${appreciation.isApproved
                              ? 'bg-rose-500 border-rose-600 text-white'
                              : 'bg-green-600 border-green-700 text-white shadow-md shadow-green-200'
                              }`}
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO (Tabla) */}
      <div className="hidden md:flex bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex-col">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className={`${isFamilyMode ? 'bg-slate-50' : isTutorMode ? 'bg-amber-50' : 'bg-gray-50'} border-b border-gray-100`}>
                <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-white z-30 w-[300px] shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)]">
                  Estudiante
                </th>

                {isFamilyMode ? (
                  familyCommitments.map((fc) => (
                    <th key={fc.id} className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-tight w-48 border-l border-gray-50">
                      <div className="line-clamp-2 leading-tight" title={fc.text}>{fc.text}</div>
                    </th>
                  ))
                ) : !isTutorMode ? (
                  course.competencies.map((comp) => (
                    <th key={comp.id} className="p-8 text-[10px] font-black text-gray-500 uppercase tracking-tight w-48 border-l border-gray-50">
                      <div className="line-clamp-2 leading-tight" title={comp.name}>{comp.name}</div>
                    </th>
                  ))
                ) : (
                  <>
                    <th className="p-8 text-[10px] font-black text-amber-700 uppercase tracking-widest w-40 border-l border-amber-100">Conducta</th>
                    <th className="p-8 text-[10px] font-black text-amber-700 uppercase tracking-widest w-40 border-l border-amber-100">Tutoría Valores</th>
                    {(role === 'Supervisor' || role === 'Administrador' || isTutorMode) && (
                      <th className="p-8 text-[10px] font-black text-institutional uppercase tracking-widest text-center w-64 border-l border-gray-100 bg-cyan-50/30">Estado Apreciación</th>
                    )}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                const appreciation = getAppreciation(student.id);
                const tData = getTutorData(student.id);

                return (
                  <tr key={student.id} className="group/row hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 text-base font-bold text-gray-700 sticky left-0 bg-white group-hover/row:bg-gray-50/90 z-20 shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 overflow-hidden">
                          {(role === 'Supervisor' || role === 'Administrador' || isTutorMode) && (
                            <div className={`w-3 h-3 rounded-full shrink-0 ${appreciation.comment.trim() !== '' ? 'bg-green-500 shadow-sm shadow-green-200' : 'bg-gray-200'}`}></div>
                          )}
                          <span className="truncate">{student.fullName}</span>
                        </div>
                        {(role === 'Supervisor' || role === 'Administrador') && (
                          <button
                            onClick={() => handlePdfDownload(student)}
                            className="p-3 text-rose-500 opacity-0 group-hover/row:opacity-100 hover:bg-rose-50 rounded-2xl transition-all"
                            title="Descargar Libreta"
                          >
                            <FileText size={20} />
                          </button>
                        )}
                      </div>
                    </td>

                    {isFamilyMode ? (
                      familyCommitments.map((fc) => {
                        const grade = getFamilyGrade(student.id, fc.id);
                        return (
                          <td key={fc.id} className="p-4 border-l border-gray-50">
                            <select
                              disabled={bimestre.isLocked || role === 'Supervisor'}
                              value={grade}
                              onChange={(e) => onUpdateFamilyEvaluation(student.id, fc.id, e.target.value as GradeLevel)}
                              className={`w-full p-4 rounded-2xl border-none focus:ring-4 focus:ring-institutional/20 transition-all text-center font-black text-sm ${getGradeColorClass(grade)} ${bimestre.isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer appearance-none hover:shadow-md'
                                }`}
                            >
                              <option value="">-</option>
                              <option value="AD">AD</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                            </select>
                          </td>
                        )
                      })
                    ) : !isTutorMode ? (
                      course.competencies.map((comp) => {
                        const grade = getGradeValue(student.id, comp.id);
                        const conclusion = getGradeConclusion(student.id, comp.id);
                        const isMandatory = isConclusionMandatory(grade);
                        const hasConclusion = conclusion.trim() !== '';

                        return (
                          <td key={comp.id} className="p-3 border-l border-gray-50">
                            <div className="flex flex-col gap-2">
                              <select
                                disabled={bimestre.isLocked || role === 'Supervisor'}
                                value={grade}
                                onChange={(e) => handleGradeChange(student, comp.id, e.target.value as GradeLevel)}
                                className={`w-full p-4 rounded-2xl border-none focus:ring-4 focus:ring-institutional/20 transition-all text-center font-black text-sm ${getGradeColorClass(grade)} ${bimestre.isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer appearance-none hover:shadow-md'
                                  }`}
                              >
                                <option value="">-</option>
                                <option value="AD">AD</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>

                              {grade && (
                                <button
                                  onClick={() => setActiveConclusionData({
                                    student,
                                    competencyId: comp.id,
                                    grade,
                                    conclusion
                                  })}
                                  title={isMandatory ? 'C. Descriptiva (Obligatoria)' : 'C. Descriptiva (Opcional)'}
                                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${hasConclusion
                                    ? 'bg-institutional/10 border-institutional text-institutional'
                                    : isMandatory
                                      ? 'bg-red-50 border-red-200 text-red-500 animate-pulse'
                                      : 'bg-gray-50 border-gray-100 text-gray-300'
                                    } hover:brightness-95`}
                                >
                                  <MessageSquare size={12} />
                                  {hasConclusion ? 'Ver Conclusión' : isMandatory ? 'C. Obligatoria' : 'Agregar C.'}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td className="p-3 border-l border-amber-100/50">
                          <select
                            disabled={bimestre.isLocked || role === 'Supervisor'}
                            value={tData.comportamiento}
                            onChange={(e) => onUpdateTutorData(student.id, 'comportamiento', e.target.value as GradeLevel)}
                            className={`w-full p-4 rounded-2xl border-none font-black text-sm text-center ${getGradeColorClass(tData.comportamiento)} ${bimestre.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="">-</option>
                            <option value="AD">AD</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                        <td className="p-3 border-l border-amber-100/50">
                          <select
                            disabled={bimestre.isLocked || role === 'Supervisor'}
                            value={tData.tutoriaValores}
                            onChange={(e) => onUpdateTutorData(student.id, 'tutoriaValores', e.target.value as GradeLevel)}
                            className={`w-full p-4 rounded-2xl border-none font-black text-sm text-center ${getGradeColorClass(tData.tutoriaValores)} ${bimestre.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="">-</option>
                            <option value="AD">AD</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                        {(role === 'Supervisor' || role === 'Administrador' || isTutorMode) && (
                          <td className="p-3 text-center border-l border-gray-100 bg-gray-50/30">
                            <div className="flex items-center justify-center gap-6">
                              <button
                                onClick={() => setActiveCommentStudent(student)}
                                className={`p-3 px-5 rounded-2xl transition-all border-2 flex flex-col items-center ${appreciation.comment.trim() !== ''
                                  ? 'bg-institutional/10 border-institutional text-institutional hover:bg-institutional hover:text-white shadow-lg shadow-institutional/20'
                                  : 'bg-white border-gray-200 text-gray-300 hover:border-institutional hover:text-institutional'
                                  }`}
                              >
                                <MessageSquare size={22} />
                                <span className="text-[9px] font-black uppercase mt-1">Redactar</span>
                              </button>

                              {appreciation.comment.trim() !== '' && (role === 'Supervisor' || role === 'Administrador' || isTutorMode) && (
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${appreciation.isApproved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                                    }`}>
                                    <Check size={18} strokeWidth={4} />
                                    <span className="text-[10px] font-black uppercase">{appreciation.isApproved ? 'Aprobado' : 'Pendiente'}</span>
                                  </div>
                                  {(role === 'Supervisor' || role === 'Administrador') && !bimestre.isLocked && (
                                    <button
                                      onClick={() => onApproveAppreciation(student.id)}
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
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda y Ayuda */}
      <div className="p-6 bg-white rounded-3xl md:rounded-none md:rounded-b-[2.5rem] border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          {(role === 'Supervisor' || role === 'Administrador' || isTutorMode) && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Aprobado</span>
              </div>
            </>
          )}
        </div>
        {!isTutorMode && !isFamilyMode && (
          <div className="flex items-center gap-2 text-gray-400">
            <Info size={14} />
            <p className="text-[9px] font-black uppercase tracking-tighter">Use los módulos de Tutoría o Padres para información socioemocional.</p>
          </div>
        )}
      </div>

      {activeConclusionData && (
        <DescriptiveCommentModal
          role={role}
          student={activeConclusionData.student}
          currentComment={activeConclusionData.conclusion}
          isApproved={false} // Conclusions are currently not approved individually or we don't have that state yet
          onClose={() => setActiveConclusionData(null)}
          onSave={(val) => {
            onUpdateGrade(
              activeConclusionData.student.id,
              activeConclusionData.competencyId,
              activeConclusionData.grade,
              val
            );
            setActiveConclusionData(null);
          }}
          isLocked={bimestre.isLocked}
        />
      )}

      {activeCommentStudent && (
        <DescriptiveCommentModal
          role={role}
          student={activeCommentStudent}
          currentComment={getAppreciation(activeCommentStudent.id).comment}
          isApproved={getAppreciation(activeCommentStudent.id).isApproved}
          onClose={() => setActiveCommentStudent(null)}
          onSave={(val) => {
            onUpdateAppreciation(activeCommentStudent.id, val);
            setActiveCommentStudent(null);
          }}
          isLocked={bimestre.isLocked}
        />
      )}
    </div>
  );
};

export default GradingMatrix;
