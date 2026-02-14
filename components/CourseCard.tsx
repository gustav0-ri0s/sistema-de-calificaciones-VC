
import React from 'react';
import { AcademicLoad } from '../types';
import { BookOpen, Users, Lock } from 'lucide-react';

interface CourseCardProps {
  course: AcademicLoad;
  onSelect: (course: AcademicLoad) => void;
  isBimestreLocked: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect, isBimestreLocked }) => {
  return (
    <div 
      onClick={() => onSelect(course)}
      className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-institutional transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <BookOpen size={80} className="text-institutional" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-institutional/10 rounded-xl text-institutional group-hover:bg-institutional group-hover:text-white transition-colors">
            <BookOpen size={24} />
          </div>
          {/* La etiqueta de Tutor ha sido removida para separar completamente los módulos */}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-institutional transition-colors">
          {course.courseName}
        </h3>
        
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-4">
          <Users size={16} />
          {course.gradeSection}
        </div>

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium italic">
            {course.competencies.length} Competencias
          </span>
          {isBimestreLocked ? (
            <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
              <Lock size={12} /> Cerrado
            </div>
          ) : (
            <span className="text-institutional font-bold text-sm flex items-center gap-1">
              Calificar →
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
