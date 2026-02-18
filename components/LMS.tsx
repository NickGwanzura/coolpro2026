
import React from 'react';
import { Course } from '../types';

// Fixed: Added missing isDownloaded property to comply with the Course type definition in types.ts.
const courses: Course[] = [
  { id: '1', title: 'Intro to Natural Refrigerants (R-290)', description: 'Safe handling of flammable refrigerants in light commercial units.', modules: 5, progress: 100, level: 'BASIC', isDownloaded: true },
  { id: '2', title: 'Transcritical CO2 Systems', description: 'Advanced cycle design, high pressure components, and safety controls.', modules: 12, progress: 45, level: 'ADVANCED', isDownloaded: false },
  { id: '3', title: 'Kigali Amendment & Compliance', description: 'Reporting requirements, leak rate calculations, and global quotas.', modules: 4, progress: 0, level: 'GWP_SPECIALIST', isDownloaded: false },
];

const LMS: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <div key={course.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-cyan-500 transition-colors shadow-sm group">
          <div className="h-40 bg-slate-100 relative">
             <img src={`https://picsum.photos/seed/${course.id}/400/200`} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
             <div className="absolute top-4 left-4">
               <span className={`px-2 py-1 text-[10px] font-black tracking-widest text-white rounded uppercase ${course.level === 'BASIC' ? 'bg-emerald-500' : course.level === 'ADVANCED' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                 {course.level}
               </span>
             </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <h4 className="font-bold text-slate-800 mb-2 leading-tight">{course.title}</h4>
            <p className="text-slate-500 text-sm mb-6 flex-1">{course.description}</p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-500" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
              <button className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${course.progress === 100 ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>
                {course.progress === 100 ? 'Certified' : course.progress > 0 ? 'Resume' : 'Start Course'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LMS;
