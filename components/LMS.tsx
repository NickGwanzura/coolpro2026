
import React from 'react';
import { Course } from '../types';
import { Play, CheckCircle, Clock, BookOpen } from 'lucide-react';

// Fixed: Added missing isDownloaded property to comply with the Course type definition in types.ts.
const courses: Course[] = [
  { id: '1', title: 'Intro to Natural Refrigerants (R-290)', description: 'Safe handling of flammable refrigerants in light commercial units.', modules: 5, progress: 100, level: 'BASIC', isDownloaded: true },
  { id: '2', title: 'Transcritical CO2 Systems', description: 'Advanced cycle design, high pressure components, and safety controls.', modules: 12, progress: 45, level: 'ADVANCED', isDownloaded: false },
  { id: '3', title: 'Kigali Amendment & Compliance', description: 'Reporting requirements, leak rate calculations, and global quotas.', modules: 4, progress: 0, level: 'GWP_SPECIALIST', isDownloaded: false },
];

const levelColors = {
  BASIC: 'bg-emerald-100 text-emerald-700',
  ADVANCED: 'bg-blue-100 text-blue-700',
  GWP_SPECIALIST: 'bg-purple-100 text-purple-700',
};

const LMS: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => {
        const isCompleted = course.progress === 100;
        const isInProgress = course.progress > 0 && course.progress < 100;
        
        return (
          <div 
            key={course.id} 
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
          >
            {/* Image Area */}
            <div className="h-40 bg-gray-100 relative overflow-hidden">
              <img 
                src={`https://picsum.photos/seed/${course.id}/400/200`} 
                alt={course.title} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
              />
              <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${levelColors[course.level as keyof typeof levelColors]}`}>
                  {course.level.replace('_', ' ')}
                </span>
              </div>
              {course.isDownloaded && (
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-900/80 text-white rounded-full">
                    <Clock className="h-3 w-3" /> Offline
                  </span>
                </div>
              )}
            </div>
            
            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col">
              <h4 className="font-semibold text-gray-900 mb-2 leading-tight">{course.title}</h4>
              <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-2">{course.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {course.modules} modules
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Progress</span>
                  <span className="font-semibold text-gray-900">{course.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <button 
                  className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                    isCompleted 
                      ? 'bg-gray-100 text-gray-500 cursor-default' 
                      : isInProgress
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Certified
                    </>
                  ) : isInProgress ? (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Course
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LMS;
