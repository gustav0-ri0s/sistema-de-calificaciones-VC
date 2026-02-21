import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (role: UserRole, email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Fetch user profile to get the role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          // Map DB role to Frontend Role type
          let appRole: UserRole = 'Docente';
          if (profile.role === 'admin' || profile.role === 'subdirector') appRole = 'Administrador';
          else if (profile.role === 'supervisor') appRole = 'Supervisor';
          else if (profile.role === 'docente_ingles') appRole = 'Docente_Ingles';

          onLogin(appRole, email);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-login-gradient flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[450px] bg-white rounded-[3.5rem] shadow-[0_20px_60px_-15px_rgba(87,197,213,0.3)] overflow-hidden flex flex-col items-center pb-8">
        {/* Header Section */}
        <div className="w-full bg-institutional pt-12 pb-10 flex flex-col items-center text-white text-center relative">
          <div className="w-28 h-28 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 p-4">
            <img
              src="https://vctarapoto.edu.pe/wp-content/uploads/2023/04/LOGO-VC-TARAPOTO-300x300.png"
              alt="Logo VC"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-3xl font-black italic tracking-tight mb-1 uppercase">Incidencias</h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-80">Sistema de Gestión Pedagógica</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="w-full px-10 pt-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@vctarapoto.edu.pe"
              className="w-full bg-[#F7F9FB] border-none rounded-3xl py-5 px-8 text-gray-600 font-medium placeholder:text-gray-300 focus:ring-4 focus:ring-institutional/10 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F7F9FB] border-none rounded-3xl py-5 px-8 text-gray-600 font-medium placeholder:text-gray-300 focus:ring-4 focus:ring-institutional/10 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-institutional text-white py-6 rounded-3xl font-black text-lg shadow-lg shadow-institutional/30 flex items-center justify-center gap-3 hover:brightness-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <LogIn size={24} strokeWidth={3} />}
            {loading ? 'Validando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>

      <footer className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">
        I.E.P. VALORES Y CIENCIAS © 2026
      </footer>
    </div>
  );
};

export default Login;
