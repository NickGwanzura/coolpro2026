
import React, { useState, useEffect } from 'react';
import { Icons } from './constants';
import SizingTool from './components/SizingTool';
import ComplianceDashboard from './components/ComplianceDashboard';
import LMS from './components/LMS';
import FieldToolkit from './components/FieldToolkit';
import Documentation from './components/Documentation';
import RewardsHub from './components/RewardsHub';
import { UserRole } from './types';

type Tab = 'dashboard' | 'sizing' | 'field' | 'training' | 'rewards' | 'blueprint';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [role, setRole] = useState<UserRole>(UserRole.TECHNICIAN);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans selection:bg-cyan-100 selection:text-cyan-900">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col sticky top-0 md:h-screen z-50">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/20">CP</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CoolPro Toolkit</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Refrigeration Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Icons.Dashboard />} label="Compliance Hub" />
          <NavItem active={activeTab === 'sizing'} onClick={() => setActiveTab('sizing')} icon={<Icons.Thermometer />} label="Sizing Engine" />
          <NavItem active={activeTab === 'field'} onClick={() => setActiveTab('field')} icon={<Icons.Sync />} label="Field Operations" />
          <NavItem active={activeTab === 'training'} onClick={() => setActiveTab('training')} icon={<Icons.Book />} label="LMS Academy" />
          <NavItem active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Icons.Award />} label="Incentives" />
          
          <div className="pt-6 pb-2 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Developer</div>
          <NavItem active={activeTab === 'blueprint'} onClick={() => setActiveTab('blueprint')} icon={<Icons.Shield />} label="System Blueprint" />
        </nav>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 text-[10px] font-bold py-1.5 px-3 rounded-full ${isOffline ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              {isOffline ? 'OFFLINE MODE' : 'SYSTEM ONLINE'}
            </div>
            {isSyncing && <div className="text-[10px] text-cyan-400 font-bold animate-pulse">SYNCING...</div>}
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600">
              <Icons.User className="text-slate-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">J. Doe (Technician)</p>
              <p className="text-[10px] text-slate-500">Cape Town, South Africa</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 sticky top-0 z-40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? 'Regulatory Dashboard' : activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={triggerSync} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                <Icons.Sync className={isSyncing ? 'animate-spin' : ''} />
             </button>
             <div className="h-6 w-px bg-slate-200"></div>
             <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-1.5 outline-none text-slate-600 focus:ring-2 focus:ring-cyan-500"
             >
                <option value={UserRole.TECHNICIAN}>Technician View</option>
                <option value={UserRole.REGULATOR}>Regulator View</option>
             </select>
          </div>
        </header>

        <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <ComplianceDashboard role={role} />}
          {activeTab === 'sizing' && <SizingTool />}
          {activeTab === 'field' && <FieldToolkit />}
          {activeTab === 'training' && <LMS />}
          {activeTab === 'rewards' && <RewardsHub />}
          {activeTab === 'blueprint' && <Documentation />}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
  >
    <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-cyan-400'} transition-colors`}>
      {icon}
    </span>
    <span className="font-bold text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
  </button>
);

export default App;
