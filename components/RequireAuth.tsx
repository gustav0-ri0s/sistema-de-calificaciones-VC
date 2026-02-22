import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, LogOut, ChevronLeft } from 'lucide-react';

interface RequireAuthProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL;

const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    const returnTo = encodeURIComponent(window.location.href);
                    window.location.href = `${PORTAL_URL}?view=login&returnTo=${returnTo}`;
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, active')
                    .eq('id', session.user.id)
                    .single();

                if (profileError || !profile || !profile.active) {
                    console.error('Error fetching profile or user inactive:', profileError);
                    if (isMounted) {
                        setIsAuthorized(false);
                        setIsLoading(false);
                    }
                    return;
                }

                const userRole = (profile.role || '').toUpperCase().trim();
                const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase().trim());

                if (isMounted) {
                    if (normalizedAllowedRoles.includes(userRole)) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                if (isMounted) {
                    setIsAuthorized(false);
                    setIsLoading(false);
                }
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, [allowedRoles, navigate, location]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = `${PORTAL_URL}?view=login`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Verificando credenciales...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans">
                <div className="max-w-md w-full">
                    <div className="bg-[#1e293b] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                        {/* Background elements */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-500"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

                        <div className="relative text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 mb-6 border border-red-500/20">
                                <Lock className="w-10 h-10 text-red-500" />
                            </div>

                            <h1 className="text-3xl font-bold text-white mb-2">Acceso Denegado</h1>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Tu cuenta no cuenta con los permisos necesarios para acceder a este módulo. Por favor, contacta al administrador si crees que esto es un error.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => window.location.href = PORTAL_URL}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10 active:scale-[0.98]"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Volver al Portal
                                </button>

                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all shadow-lg shadow-red-500/25 active:scale-[0.98]"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Cerrar Sesión Corriente
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-slate-500 mt-8 text-sm">
                        &copy; {new Date().getFullYear()} Sistema de Gestión Escolar - Victoria de la Cruz
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default RequireAuth;
