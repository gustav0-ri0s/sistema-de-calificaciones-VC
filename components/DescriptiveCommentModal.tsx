
import React, { useState } from 'react';
import { Student, UserRole } from '../types';
import { X, MessageSquare, Save, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DescriptiveCommentModalProps {
  role: UserRole;
  student: Student;
  currentComment: string;
  isApproved: boolean;
  onClose: () => void;
  onSave: (comment: string) => void;
  isLocked: boolean;
}

const DescriptiveCommentModal: React.FC<DescriptiveCommentModalProps> = ({
  role,
  student,
  currentComment,
  isApproved,
  onClose,
  onSave,
  isLocked
}) => {
  const [comment, setComment] = useState(currentComment);

  const handleSave = () => {
    if (isLocked) return;
    onSave(comment);
  };

  const isEditable = !isLocked;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-institutional/10 text-institutional rounded-xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Conclusiones Descriptivas</h3>
              <p className="text-xs text-gray-500 font-medium">{student.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isApproved && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                <CheckCircle2 size={12} /> Visto Bueno
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Avance y/o dificultades detectadas:</label>
          <textarea
            disabled={!isEditable}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            className={`w-full p-4 rounded-2xl outline-none focus:ring-2 transition-all text-sm text-gray-700 placeholder:text-gray-300 resize-none ${isEditable
              ? 'bg-gray-50 border border-gray-200 focus:ring-institutional/50 focus:bg-white'
              : 'bg-gray-100 border-transparent cursor-not-allowed italic'
              }`}
            placeholder="Escriba aquí el progreso del estudiante..."
          ></textarea>

          {isApproved && role === 'Docente' && isEditable && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={16} className="text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 leading-tight">
                <strong>Advertencia:</strong> Editar este comentario eliminará el "Visto Bueno" del supervisor y requerirá una nueva aprobación.
              </p>
            </div>
          )}

          {!isApproved && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <Sparkles size={16} className="text-blue-500" />
              <p className="text-[11px] text-blue-600 leading-tight">
                <strong>Tip pedagógico:</strong> Describa logros concretos basados en el estándar de aprendizaje del ciclo.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isEditable ? 'Cancelar' : 'Cerrar'}
          </button>
          {isEditable && (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-institutional text-white text-sm font-bold rounded-xl shadow-lg shadow-institutional/20 flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all"
            >
              <Save size={16} /> Guardar Cambios
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescriptiveCommentModal;
