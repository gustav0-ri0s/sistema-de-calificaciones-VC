
import React, { useState } from 'react';
import { Student, UserRole } from '../types';
import { X, MessageSquare, Save, Sparkles, CheckCircle2, ShieldAlert, Loader2, Wand2, Check, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';


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
  const [isImproving, setIsImproving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const handleSave = () => {
    if (isLocked) return;
    onSave(comment);
  };

  const handleImproveWriting = async () => {
    if (!comment.trim() || isImproving) return;
    setIsImproving(true);
    setAiSuggestion(null);
    try {
      console.log('Iniciando mejora de escritura con IA...');
      const { data, error } = await supabase.functions.invoke('improve-writing', {
        body: { text: comment }
      });

      if (error) {
        console.error('Error de Supabase Function:', error);
        alert(`Error al conectar con la IA: ${error.message || 'Error desconocido'}`);
        throw error;
      }

      if (data?.error) {
        console.error('Error devuelto por la IA:', data.error);
        alert(`La IA devolvió un error: ${data.error}`);
        return;
      }

      if (data?.improvedText) {
        console.log('Mejora recibida:', data.improvedText);
        setAiSuggestion(data.improvedText);
      } else {
        alert('La IA no devolvió ninguna sugerencia. Revisa que el texto sea válido.');
      }
    } catch (err: any) {
      console.error('Error fatal al mejorar escritura:', err);
      alert(`Error inesperado: ${err.message || 'Consulta la consola (F12) para más detalles.'}`);
    } finally {
      setIsImproving(false);
    }
  };

  const applySuggestion = () => {
    if (aiSuggestion) {
      setComment(aiSuggestion);
      setAiSuggestion(null);
    }
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

          {!isApproved && !aiSuggestion && (
            <div className="mt-4 flex items-center justify-between gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <p className="text-[11px] text-blue-600 leading-tight">
                  <strong>Tip pedagógico:</strong> Describa logros concretos basados en el estándar de aprendizaje del ciclo.
                </p>
              </div>

              {isEditable && (
                <button
                  onClick={handleImproveWriting}
                  disabled={isImproving || !comment.trim()}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                  title="Mejorar redacción con Inteligencia Artificial"
                >
                  {isImproving ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Mejorar con IA
                </button>
              )}
            </div>
          )}

          {aiSuggestion && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100 border-dashed animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Propuesta de Mejora (IA)</span>
                </div>
                <button onClick={() => setAiSuggestion(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed mb-4 italic">"{aiSuggestion}"</p>
              <div className="flex gap-2">
                <button
                  onClick={applySuggestion}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md"
                >
                  <Check size={12} /> Usar Sugerencia
                </button>
                <button
                  onClick={handleImproveWriting}
                  className="p-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                  title="Generar otra"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
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
