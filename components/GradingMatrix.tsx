
import React, { useState } from 'react';
import { AcademicLoad, Bimestre, GradeEntry, AppreciationEntry, TutorValues, GradeLevel, Student, UserRole, FamilyCommitment, FamilyEvaluation } from '../types';
import { MessageSquare, CheckCircle2, Info, Lock, Eye, Check, User, FileText, CheckCircle, Heart, Plus, RotateCw, Save } from 'lucide-react';
import DescriptiveCommentModal from './DescriptiveCommentModal';
import MassiveConclusionModal from './MassiveConclusionModal';
import { generateGlobalReportCard } from '../utils/pdfGenerator';
import { supabase } from '../lib/supabase';

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
  onUpdateAppreciation: (sId: string, comment: string, shouldSend?: boolean) => void;
  onApproveAppreciation: (sId: string) => void;
  onUpdateTutorData: (sId: string, field: 'comportamiento' | 'tutoriaValores', value: string) => void;
  onUpdateFamilyEvaluation: (sId: string, fcId: string, grade: GradeLevel) => void;
  onGeneratePDF: (studentId: string) => void;
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
  onUpdateFamilyEvaluation,
  onGeneratePDF
}) => {
  const [activeCommentStudent, setActiveCommentStudent] = useState<Student | null>(null);
  const [showMassiveConclusionModal, setShowMassiveConclusionModal] = useState(false);
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
    // Auto-popup removed as per request. Visual indicator handles the "Mandatory" status.
    onUpdateGrade(student.id, competencyId, grade, currentConclusion);
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
    onGeneratePDF(student.id);
  };

  const getGradeColorClass = (grade: GradeLevel) => {
    switch (grade) {
      case 'AD': return 'bg-blue-100 ring-2 ring-blue-300';
      case 'A': return 'bg-emerald-100 ring-2 ring-emerald-300';
      case 'B': return 'bg-amber-100 ring-2 ring-amber-300';
      case 'C': return 'bg-red-100 ring-2 ring-red-300';
      default: return 'bg-slate-50 ring-1 ring-slate-200';
    }
  };

  const getGradeTextColor = (grade: GradeLevel) => {
    switch (grade) {
      case 'AD': return 'text-blue-900';
      case 'A': return 'text-emerald-900';
      case 'B': return 'text-amber-900';
      case 'C': return 'text-red-900';
      default: return 'text-slate-400';
    }
  };

  const renderGradeOptions = (placeholder: string = '-') => (
    <>
      <option value="" className="text-slate-400 bg-white">{placeholder}</option>
      <option value="AD" style={{ color: '#1e40af', backgroundColor: '#eff6ff', fontWeight: 'bold' }}>AD - Logro Destacado</option>
      <option value="A" style={{ color: '#047857', backgroundColor: '#ecfdf5', fontWeight: 'bold' }}>A - Logro Esperado</option>
      <option value="B" style={{ color: '#b45309', backgroundColor: '#fffbeb', fontWeight: 'bold' }}>B - En Proceso</option>
      <option value="C" style={{ color: '#b91c1c', backgroundColor: '#fef2f2', fontWeight: 'bold' }}>C - En Inicio</option>
    </>
  );

  const handleMassiveUpdate = (
    competencyId: string,
    filterType: 'all_with_grade' | 'specific_grade' | 'empty_conclusion',
    filterValue: string,
    text: string
  ) => {
    const targetCompetencies = competencyId === 'ALL'
      ? course.competencies
      : course.competencies.filter(c => c.id === competencyId);

    targetCompetencies.forEach(comp => {
      students.forEach(student => {
        const entry = grades.find(g => g.studentId === student.id && g.competencyId === comp.id);
        const currentGrade = entry?.grade;
        const currentConclusion = entry?.descriptiveConclusion || '';

        if (!currentGrade) return; // Only update if there is a grade

        let shouldUpdate = false;
        if (filterType === 'all_with_grade') shouldUpdate = true;
        if (filterType === 'specific_grade') shouldUpdate = currentGrade === filterValue;
        if (filterType === 'empty_conclusion') shouldUpdate = !currentConclusion || currentConclusion.trim() === '';

        if (shouldUpdate) {
          onUpdateGrade(student.id, comp.id, currentGrade, text);
        }
      });
    });
    setShowMassiveConclusionModal(false);
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

      {/* Indicador de Auto-guardado para Docentes */}
      {!bimestre.isLocked && (role === 'Docente' || role === 'Docente_Ingles') && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {!isTutorMode && !isFamilyMode && (
            <button
              onClick={() => setShowMassiveConclusionModal(true)}
              className="px-5 py-2.5 bg-institutional text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-institutional/90 transition-all flex items-center gap-2 shadow-lg shadow-institutional/20 active:scale-95 w-fit"
            >
              <MessageSquare size={16} />
              Conclusiones Masivas
            </button>
          )}

          <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-right-4 self-end md:self-auto ml-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Cambios se guardan automáticamente</span>
          </div>
        </div>
      )}

      {/* COMPROMISOS DE LA FAMILIA - LISTADO DE ÍTEMS */}
      {isFamilyMode && (
        <div className="animate-in slide-in-from-top duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {familyCommitments.map((fc) => (
              <div key={fc.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm flex items-center gap-5 group hover:border-[#38bdf8] hover:shadow-xl hover:shadow-[#38bdf8]/5 transition-all duration-300">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-[#38bdf8] group-hover:bg-[#38bdf8]/5 transition-all border border-slate-100">
                  <CheckCircle size={22} />
                </div>
                <span className="text-xs font-black text-slate-500 uppercase leading-snug group-hover:text-slate-900 transition-colors">{fc.text}</span>
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
                          <div className="flex-1 relative group">
                            <select
                              disabled={bimestre.isLocked || role === 'Supervisor'}
                              value={grade}
                              onChange={(e) => handleGradeChange(student, comp.id, e.target.value as GradeLevel)}
                              className={`w-full p-3.5 rounded-xl border-none font-black text-sm text-center ${getGradeColorClass(grade)} transition-all focus:ring-4 focus:ring-blue-200 text-transparent selection:bg-transparent appearance-none`}
                            >
                              {renderGradeOptions('Nota')}
                            </select>
                            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-black text-sm ${getGradeTextColor(grade)}`}>
                              {grade || 'Nota'}
                            </div>
                          </div>

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
                        <div className="relative group w-full">
                          <select
                            disabled={bimestre.isLocked || role === 'Supervisor'}
                            value={tData.comportamiento}
                            onChange={(e) => onUpdateTutorData(student.id, 'comportamiento', e.target.value as GradeLevel)}
                            className={`w-full p-3.5 rounded-xl border-none font-black text-sm text-center ${getGradeColorClass(tData.comportamiento)} transition-all text-transparent appearance-none`}
                          >
                            {renderGradeOptions()}
                          </select>
                          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-black text-sm ${getGradeTextColor(tData.comportamiento)}`}>
                            {tData.comportamiento || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black text-amber-600 uppercase">Valores</span>
                        <div className="relative group w-full">
                          <select
                            disabled={bimestre.isLocked || role === 'Supervisor'}
                            value={tData.tutoriaValores}
                            onChange={(e) => onUpdateTutorData(student.id, 'tutoriaValores', e.target.value as GradeLevel)}
                            className={`w-full p-3.5 rounded-xl border-none font-black text-sm text-center ${getGradeColorClass(tData.tutoriaValores)} transition-all text-transparent appearance-none`}
                          >
                            {renderGradeOptions()}
                          </select>
                          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-black text-sm ${getGradeTextColor(tData.tutoriaValores)}`}>
                            {tData.tutoriaValores || '-'}
                          </div>
                        </div>
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
      <div className="hidden md:flex flex-col gap-3">
        {(isFamilyMode || isTutorMode) && (
          <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 border border-slate-100 rounded-2xl w-fit self-end">
            <Info size={14} className="text-slate-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Deslice horizontalmente para ver todas las columnas →
            </span>
          </div>
        )}
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex-col">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
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
                  <th className="w-20 bg-transparent shrink-0"></th>
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
                              <div className={`w-3 h-3 rounded-full shrink-0 ${appreciation.isApproved ? 'bg-green-500 shadow-sm shadow-green-200' : appreciation.isSent ? 'bg-blue-500 animate-pulse' : appreciation.comment.trim() !== '' ? 'bg-amber-400' : 'bg-gray-200'}`} title={appreciation.isApproved ? 'Aprobado' : appreciation.isSent ? 'En Revisión' : appreciation.comment.trim() !== '' ? 'Borrador' : 'Sin completar'}></div>
                            )}
                            <span className="truncate">{student.fullName}</span>
                          </div>
                          {(role === 'Supervisor' || role === 'Administrador' || isTutorMode) && (
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
                            <td key={fc.id} className="p-3 border-l border-gray-50">
                              <div className="relative group w-full">
                                <select
                                  disabled={bimestre.isLocked || role === 'Supervisor'}
                                  value={grade}
                                  onChange={(e) => onUpdateFamilyEvaluation(student.id, fc.id, e.target.value as GradeLevel)}
                                  className={`w-full p-4 rounded-2xl border-none font-black text-sm text-center ${getGradeColorClass(grade)} ${bimestre.isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'} transition-all text-transparent appearance-none`}
                                >
                                  {renderGradeOptions()}
                                </select>
                                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-black text-sm ${getGradeTextColor(grade)}`}>
                                  {grade || '-'}
                                </div>
                              </div>
                            </td>
                          );
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
                                <div className="relative group w-full">
                                  <select
                                    disabled={bimestre.isLocked || role === 'Supervisor'}
                                    value={grade}
                                    onChange={(e) => handleGradeChange(student, comp.id, e.target.value as GradeLevel)}
                                    className={`w-full p-4 rounded-2xl border-none focus:ring-4 focus:ring-institutional/20 transition-all text-center font-black text-sm ${getGradeColorClass(grade)} ${bimestre.isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer appearance-none hover:shadow-md hover:scale-[1.02]'
                                      } text-transparent`}
                                  >
                                    {renderGradeOptions()}
                                  </select>
                                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-black text-sm ${getGradeTextColor(grade)}`}>
                                    {grade || '-'}
                                  </div>
                                </div>

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
                            <div className="relative group w-full">
                              <select
                                disabled={bimestre.isLocked || role === 'Supervisor'}
                                value={tData.comportamiento}
                                onChange={(e) => onUpdateTutorData(student.id, 'comportamiento', e.target.value as GradeLevel)}
                                className={`w-full p-4 rounded-2xl border-none font-black text-sm text-center ${getGradeColorClass(tData.comportamiento)} ${bimestre.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} text-transparent appearance-none transition-all`}
                              >
                                {renderGradeOptions()}
                              </select>
                              <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-black text-sm ${getGradeTextColor(tData.comportamiento)}`}>
                                {tData.comportamiento || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border-l border-amber-100/50">
                            <div className="relative group w-full">
                              <select
                                disabled={bimestre.isLocked || role === 'Supervisor'}
                                value={tData.tutoriaValores}
                                onChange={(e) => onUpdateTutorData(student.id, 'tutoriaValores', e.target.value as GradeLevel)}
                                className={`w-full p-4 rounded-2xl border-none font-black text-sm text-center ${getGradeColorClass(tData.tutoriaValores)} ${bimestre.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} text-transparent appearance-none transition-all`}
                              >
                                {renderGradeOptions()}
                              </select>
                              <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-black text-sm ${getGradeTextColor(tData.tutoriaValores)}`}>
                                {tData.tutoriaValores || '-'}
                              </div>
                            </div>
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
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${appreciation.isApproved ? 'bg-green-50 border-green-200 text-green-600' : appreciation.isSent ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                                      }`}>
                                      {appreciation.isApproved ? <Check size={18} strokeWidth={4} /> : appreciation.isSent ? <RotateCw size={18} className="animate-spin" /> : <Save size={18} />}
                                      <span className="text-[10px] font-black uppercase">{appreciation.isApproved ? 'Aprobado' : appreciation.isSent ? 'En Revisión' : 'Borrador'}</span>
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
                      <td className="w-20 bg-transparent shrink-0 border-none"></td>
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
            isApproved={false}
            isSent={true}
            onClose={() => setActiveConclusionData(null)}
            onSave={(val, shouldSend) => {
              onUpdateGrade(
                activeConclusionData.student.id,
                activeConclusionData.competencyId,
                activeConclusionData.grade,
                val
              );
              if (shouldSend) setActiveConclusionData(null);
            }}
            isLocked={bimestre.isLocked}
            title="Conclusiones Descriptivas"
          />
        )}

        {activeCommentStudent && (
          <DescriptiveCommentModal
            role={role}
            student={activeCommentStudent}
            currentComment={getAppreciation(activeCommentStudent.id).comment}
            isApproved={getAppreciation(activeCommentStudent.id).isApproved}
            isSent={getAppreciation(activeCommentStudent.id).isSent}
            onClose={() => setActiveCommentStudent(null)}
            onSave={(val, shouldSend) => {
              onUpdateAppreciation(activeCommentStudent.id, val, shouldSend);
              if (shouldSend) setActiveCommentStudent(null);
            }}
            isLocked={bimestre.isLocked}
            title="Apreciación Académica"
          />
        )}

        {showMassiveConclusionModal && !isTutorMode && !isFamilyMode && (
          <MassiveConclusionModal
            role={role}
            course={course}
            students={students}
            grades={grades}
            onClose={() => setShowMassiveConclusionModal(false)}
            onSave={handleMassiveUpdate}
            isLocked={bimestre.isLocked}
          />
        )}
      </div>
    </div>
  );
};

export default GradingMatrix;

