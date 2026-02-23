import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
    const navigate = useNavigate();

    const isProcessed = useRef(false);

    useEffect(() => {
        const handleAuth = async () => {
            if (isProcessed.current) return;
            isProcessed.current = true;

            const hash = window.location.hash;
            if (!hash) {
                navigate('/');
                return;
            }

            // El hash viene con #access_token=...&refresh_token=...&returnTo=...
            const params = new URLSearchParams(hash.substring(1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            const returnTo = params.get('returnTo') || '/';

            if (access_token && refresh_token) {
                const { error } = await supabase.auth.setSession({
                    access_token,
                    refresh_token,
                });

                if (error) {
                    console.error('Error setting session:', error);
                    navigate('/');
                } else {
                    localStorage.removeItem('vc_last_activity');
                    // Limpiar hash y redirigir
                    window.history.replaceState(null, '', window.location.pathname);
                    navigate(returnTo);
                }
            } else {
                navigate('/');
            }
        };

        handleAuth();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium">Procesando sesión...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
