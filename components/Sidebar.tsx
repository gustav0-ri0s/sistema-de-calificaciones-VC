import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, UserCheck, Heart, LogOut, Home } from 'lucide-react';
import { UserRole, AcademicLoad } from '../types';

interface SidebarProps {
    role: UserRole | null;
    onLogout: () => void;
    tutorSections?: AcademicLoad[];
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout, tutorSections = [] }) => {
    const location = useLocation();
    const isDocente = role === 'Docente';
    const isStaff = role === 'Supervisor' || role === 'Administrador';

    const firstTutorSection = tutorSections.length > 0 ? tutorSections[0] : null;

    const menuItems = [
        {
            to: '/',
            label: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            show: true
        },
        {
            to: '/mis-cursos',
            label: 'Carga Académica',
            icon: <BookOpen size={20} />,
            show: isDocente
        },
        {
            to: '/monitoreo',
            label: 'Monitoreo',
            icon: <BookOpen size={20} />,
            show: isStaff
        },
        {
            to: '/apreciaciones',
            label: 'Apreciaciones',
            icon: <Heart size={20} />,
            show: isStaff
        },
        {
            to: '/reportes',
            label: 'Reportes',
            icon: <UserCheck size={20} />,
            show: isStaff
        },
        {
            to: firstTutorSection ? `/tutoria/${firstTutorSection.classroomId}` : '#',
            label: 'Tutoría',
            icon: <UserCheck size={20} />,
            show: isDocente && !!firstTutorSection
        },
        {
            to: firstTutorSection ? `/familia/${firstTutorSection.classroomId}` : '#',
            label: 'Familia',
            icon: <Heart size={20} />,
            show: isDocente && !!firstTutorSection
        }
    ];

    return (
        <aside className="hidden lg:flex w-72 flex-col bg-white border-r h-[calc(100vh-5rem)] sticky top-20 transition-all duration-300">
            <nav className="flex-1 p-6 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-4">Menú Principal</p>

                {menuItems.filter(item => item.show).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${isActive
                                ? 'bg-institutional text-white shadow-lg shadow-institutional/20 ring-4 ring-institutional/10'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-institutional'
                            }`
                        }
                    >
                        <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-gray-100 space-y-2">
                <button
                    onClick={() => window.location.href = import.meta.env.VITE_PORTAL_URL || '/'}
                    className="w-full flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-institutional rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100 group"
                >
                    <Home size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">Volver al Portal</span>
                </button>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all group"
                >
                    <LogOut size={20} className="transition-transform group-hover:rotate-12" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
