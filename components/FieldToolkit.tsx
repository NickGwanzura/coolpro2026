
import React, { useState } from 'react';
import { CheckSquare, FileText, AlertTriangle, Save, WifiOff } from 'lucide-react';

const FieldToolkit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'leaks'>('checklist');
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const checklistItems = [
    "Leak test with Nitrogen @ 25 Bar for 24 hours",
    "Evacuation below 500 Microns",
    "Superheat checked at evaporator outlet",
    "Compressor oil level verified",
    "Label unit with refrigerant GWP data"
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button 
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'checklist' 
              ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Commissioning Checklist
        </button>
        <button 
          onClick={() => setActiveTab('leaks')}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'leaks' 
              ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          Refrigerant Log
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'checklist' ? (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">New Installation Verification</h4>
            <div className="space-y-3">
              {checklistItems.map((item, i) => (
                <label 
                  key={i} 
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input 
                    type="checkbox" 
                    checked={checkedItems.includes(i)}
                    onChange={() => toggleCheck(i)}
                    className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-gray-700 font-medium">{item}</span>
                </label>
              ))}
            </div>
            <div className="pt-6">
              <button className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                <Save className="h-4 w-4" />
                Complete & Save Locally
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Offline Warning */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">
                  You have <strong>3 unsynced logs</strong> in your local storage.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  These will be uploaded when you regain internet connection.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Facility Name</label>
                <input 
                  className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                  placeholder="Supermarket A-1" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Refrigerant Added (kg)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                  placeholder="0.00" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Refrigerant Type</label>
                <select className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                  <option>R-410A</option>
                  <option>R-290</option>
                  <option>R-744 (CO2)</option>
                  <option>R-32</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Action Type</label>
                <select className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                  <option>Charge</option>
                  <option>Recovery</option>
                  <option>Leak Repair</option>
                </select>
              </div>
            </div>
            
            <button className="flex items-center justify-center gap-2 bg-blue-600 text-white w-full py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              <WifiOff className="h-4 w-4" />
              Log Event (Offline Ready)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldToolkit;
