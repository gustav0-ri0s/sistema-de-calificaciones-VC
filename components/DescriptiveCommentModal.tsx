
import React, { useState } from 'react';
import { Student, UserRole } from '../types';
import { X, MessageSquare, Save, Sparkles, CheckCircle2, ShieldAlert, Loader2, Wand2, Check, RotateCcw, RotateCw, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';


interface DescriptiveCommentModalProps {
  role: UserRole;
  student: Student;
  currentComment: string;
  isApproved: boolean;
  isSent: boolean;
  onClose: () => void;
  onSave: (comment: string, shouldSend?: boolean) => void;
  isLocked: boolean;
  title?: string;
}

const DescriptiveCommentModal: React.FC<DescriptiveCommentModalProps> = ({
  role,
  student,
  currentComment,
  isApproved,
  isSent,
  onClose,
  onSave,
  isLocked,
  title = 'Conclusiones Descriptivas'
}) => {
  const [comment, setComment] = useState(currentComment);
  const [isImproving, setIsImproving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showConfirm, setShowConfirm] = useState(false);

  // Debounced auto-save
  React.useEffect(() => {
    if (comment === currentComment) return;
    if (isLocked) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      onSave(comment, false); // Auto-save always as draft
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [comment]);

  const handleManualSave = () => {
    if (isLocked) return;
    onSave(comment, false);
    onClose();
  };

  const handleSendForReview = () => {
    if (isLocked) return;
    setShowConfirm(true);
  };

  const confirmSend = () => {
    onSave(comment, true);
    setShowConfirm(false);
    onClose();
  };

  const handleImproveWriting = async () => {
    if (!comment.trim() || isImproving) return;
    setIsImproving(true);
    setAiSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke('improve-writing', {
        body: { text: comment }
      });

      if (error) throw error;
      if (data?.improvedText) {
        setAiSuggestion(data.improvedText);
      }
    } catch (err: any) {
      console.error('Error improving writing:', err);
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
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 font-medium">{student.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && <span className="text-[10px] text-gray-400 animate-pulse uppercase font-black">Guardando...</span>}
            {saveStatus === 'saved' && <span className="text-[10px] text-green-500 flex items-center gap-1 uppercase font-black"><Check size={12} /> Borrador guardado</span>}
            {isApproved && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                <CheckCircle2 size={12} /> Visto Bueno
              </div>
            )}
            {!isApproved && isSent && (
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">
                <RotateCw size={12} className="animate-spin" /> En Revisión
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

          {isSent && !isApproved && role === 'Docente' && isEditable && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Info size={16} className="text-blue-500 shrink-0" />
              <p className="text-[11px] text-blue-700 leading-tight">
                Esta apreciación ya ha sido enviada para revisión. Cualquier cambio la devolverá a estado borrador.
              </p>
            </div>
          )}

          {isApproved && role === 'Docente' && isEditable && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={16} className="text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 leading-tight">
                <strong>Advertencia:</strong> Editar este comentario eliminará el "Visto Bueno" y requerirá una nueva revisión.
              </p>
            </div>
          )}

          {!isApproved && !aiSuggestion && (
            <div className="mt-4 flex items-center justify-between gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                <p className="text-[11px] text-indigo-600 leading-tight">
                  Asegúrate de detallar los logros del periodo.
                </p>
              </div>

              {isEditable && (
                <button
                  onClick={handleImproveWriting}
                  disabled={isImproving || !comment.trim()}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
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
                  <span className="text-[10px] font-black uppercase tracking-wider">Propuesta (IA)</span>
                </div>
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed mb-4 italic">"{aiSuggestion}"</p>
              <div className="flex gap-2">
                <button
                  onClick={applySuggestion}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md"
                >
                  <Check size={12} /> Usar Sugerencia
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>

          {isEditable && (
            <div className="flex items-center gap-3">
              {role === 'Docente' ? (
                !isApproved && (
                  <button
                    disabled={isImproving || !comment.trim()}
                    onClick={handleSendForReview}
                    className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Enviar para Revisión
                  </button>
                )
              ) : (
                <button
                  onClick={handleManualSave}
                  className="px-6 py-2 bg-institutional text-white text-sm font-bold rounded-xl shadow-lg shadow-institutional/20 flex items-center gap-2 hover:bg-institutional/90 transition-all active:scale-95"
                >
                  <Save size={16} /> Guardar Cambios
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => setShowConfirm(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-xl font-black text-slate-800 text-center mb-3">¿Enviar para Revisión?</h4>
            <p className="text-sm text-slate-500 text-center mb-8 px-2 font-medium leading-relaxed">
              Una vez enviada, el supervisor podrá verla y darle el visto bueno final. No podrá ser editada por usted mientras esté en revisión.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmSend}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Sí, enviar ahora
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
              >
                No, seguir editando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DescriptiveCommentModal;
