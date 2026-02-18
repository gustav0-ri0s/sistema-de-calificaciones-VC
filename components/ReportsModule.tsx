
import React from 'react';
import { BarChart3, TrendingDown, TrendingUp, Users } from 'lucide-react';

const ReportsModule: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reportes y Estadísticas</h1>
                <p className="text-gray-500 font-medium">Análisis detallado para la toma de decisiones</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
                    <div className="p-4 bg-gray-50 text-gray-300 rounded-full">
                        <TrendingUp size={48} />
                    </div>
                    <h3 className="text-xl font-black text-gray-800">Rendimiento por Áreas</h3>
                    <p className="text-sm text-gray-400">Próximamente: Gráficos de promedio de notas por curso y salón.</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
                    <div className="p-4 bg-gray-50 text-gray-300 rounded-full">
                        <Users size={48} />
                    </div>
                    <h3 className="text-xl font-black text-gray-800">Compromiso Familiar</h3>
                    <p className="text-sm text-gray-400">Próximamente: Análisis de evaluaciones de padres de familia.</p>
                </div>
            </div>
        </div>
    );
};

export default ReportsModule;
