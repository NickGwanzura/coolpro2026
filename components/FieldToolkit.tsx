
import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  FileText,
  AlertTriangle,
  Save,
  WifiOff,
  Download,
  History,
  PlusCircle,
  Archive,
  Upload,
  FileCheck,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { RefrigerantLog, Installation, JobType, JobTypeLabels } from '../types';
import { jsPDF } from 'jspdf';

const FieldToolkit: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'checklist' | 'installations' | 'leaks'>('checklist');
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // Installation State
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [installationForm, setInstallationForm] = useState({
    clientName: '',
    jobDetails: '',
    floorSpace: '',
    jobType: 'COLD_ROOM' as JobType,
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logbook State
  const [logs, setLogs] = useState<RefrigerantLog[]>([
    {
      id: '1',
      technicianId: 'tech-001',
      technicianName: 'Demo Technician',
      clientName: 'Shoprite Downtown',
      location: 'Store 4, Aisle 2',
      jobType: 'COLD_ROOM',
      refrigerantType: 'R-290',
      amount: 15.5,
      actionType: 'Charge',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      technicianId: 'tech-001',
      technicianName: 'Demo Technician',
      clientName: 'Pick n Pay Highlands',
      location: 'Cold Storage Room',
      jobType: 'C40_FREEZER',
      refrigerantType: 'R-744 (CO2)',
      amount: 45.0,
      actionType: 'Recovery',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    }
  ]);

  const [formData, setFormData] = useState({
    clientName: '',
    location: '',
    jobType: 'COLD_ROOM' as JobType,
    refrigerantType: 'R-290',
    amount: '',
    actionType: 'Charge' as 'Charge' | 'Recovery' | 'Leak Repair'
  });

  const toggleCheck = (index: number) => {
    setCheckedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const checklistItems = [
    "NEW INSTALLATION OF NITROGEN INERT GAS BRAZING",
    "PRESSURE TEST WITH FREE DRY NITROGEN",
    "EVACUATION",
    "Charging system according to manufacturer's spec and instructions"
  ];

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setUploadedImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit installation
  const handleInstallationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installationForm.clientName || !installationForm.jobDetails) return;

    const newInstallation: Installation = {
      id: Math.random().toString(36).substr(2, 9),
      technicianId: user?.id || 'unknown',
      technicianName: user?.name || 'Anonymous',
      clientName: installationForm.clientName,
      jobDetails: installationForm.jobDetails,
      floorSpace: installationForm.floorSpace,
      jobType: installationForm.jobType,
      installationDate: new Date().toISOString(),
      status: 'pending',
      images: uploadedImages,
      cocRequested: false,
      cocApproved: false
    };

    setInstallations([newInstallation, ...installations]);
    setInstallationForm({
      clientName: '',
      jobDetails: '',
      floorSpace: '',
      jobType: 'COLD_ROOM',
    });
    setUploadedImages([]);
  };

  // Request COC
  const requestCOC = (id: string) => {
    setInstallations(prev => prev.map(inst => 
      inst.id === id ? { ...inst, cocRequested: true } : inst
    ));
  };

  // Approve COC (simulated)
  const approveCOC = (id: string) => {
    setInstallations(prev => prev.map(inst => 
      inst.id === id ? { 
        ...inst, 
        cocApproved: true, 
        cocApprovalDate: new Date().toISOString(),
        status: 'approved' as const
      } : inst
    ));
  };

  // Generate COC Certificate PDF
  const generateCOCCertificate = (installation: Installation) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF CONFORMITY', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('COOLPRO Refrigeration Services', 105, 35, { align: 'center' });
    
    // Certificate Number
    doc.setFontSize(10);
    doc.text(`Certificate No: COC-${installation.id.toUpperCase()}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 58);
    
    // Client Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Details', 20, 75);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client Name: ${installation.clientName}`, 25, 85);
    doc.text(`Job Type: ${JobTypeLabels[installation.jobType]}`, 25, 93);
    doc.text(`Floor Space: ${installation.floorSpace || 'N/A'}`, 25, 101);
    
    // Job Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Installation Details', 20, 118);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const jobDetailsLines = doc.splitTextToSize(installation.jobDetails, 170);
    doc.text(jobDetailsLines, 25, 128);
    
    // Technician Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Technician', 20, 150);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${installation.technicianName}`, 25, 160);
    doc.text(`Installation Date: ${new Date(installation.installationDate).toLocaleDateString()}`, 25, 168);
    
    // Approval
    if (installation.cocApproved) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Certificate Approved', 20, 185);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Approval Date: ${installation.cocApprovalDate ? new Date(installation.cocApprovalDate).toLocaleDateString() : 'N/A'}`, 25, 195);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text('This certificate is issued subject to COOLPRO terms and conditions', 105, 270, { align: 'center' });
    doc.text('Generated by COOLPRO Digital Toolkit', 105, 278, { align: 'center' });
    
    doc.save(`COC-Certificate-${installation.id}.pdf`);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.amount) return;

    const newLog: RefrigerantLog = {
      id: Math.random().toString(36).substr(2, 9),
      technicianId: user?.id || 'unknown',
      technicianName: user?.name || 'Anonymous',
      clientName: formData.clientName,
      location: formData.location,
      jobType: formData.jobType,
      refrigerantType: formData.refrigerantType,
      amount: parseFloat(formData.amount),
      actionType: formData.actionType,
      timestamp: new Date().toISOString(),
    };

    setLogs([newLog, ...logs]);
    setFormData({
      clientName: '',
      location: '',
    jobType: 'COLD_ROOM' as JobType,
    refrigerantType: 'R-290',
    amount: '',
      actionType: 'Charge'
    });
  };

  const downloadPDF = (log: RefrigerantLog) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text('COOLPRO Field Service Log', 20, 20);

    doc.setFontSize(12);
    doc.text(`Log ID: ${log.id}`, 20, 30);
    doc.text(`Date: ${new Date(log.timestamp).toLocaleString()}`, 20, 40);

    // Technician Info
    doc.setFontSize(16);
    doc.text('Technician Information', 20, 60);
    doc.setFontSize(12);
    doc.text(`Name: ${log.technicianName}`, 20, 70);
    doc.text(`ID: ${log.technicianId}`, 20, 80);

    // Job Info
    doc.setFontSize(16);
    doc.text('Service Details', 20, 100);
    doc.setFontSize(12);
    doc.text(`Client: ${log.clientName}`, 20, 110);
    doc.text(`Location: ${log.location}`, 20, 120);
    doc.text(`Job Type: ${JobTypeLabels[log.jobType] || log.jobType}`, 20, 130);
    doc.text(`Action: ${log.actionType}`, 20, 140);
    doc.text(`Refrigerant: ${log.refrigerantType}`, 20, 150);
    doc.text(`Amount: ${log.amount} kg`, 20, 160);

    // Footer
    doc.setFontSize(10);
    doc.text('Generated by COOLPRO Digital Toolkit', 20, 270);

    doc.save(`coolpro-log-${log.id}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'checklist'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <CheckSquare className="h-4 w-4" />
          Checklist
        </button>
        <button
          onClick={() => setActiveTab('installations')}
          className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'installations'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          Installations
        </button>
        <button
          onClick={() => setActiveTab('leaks')}
          className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'leaks'
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
        ) : activeTab === 'installations' ? (
          <div className="space-y-8">
            {/* New Installation Form */}
            <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                <PlusCircle className="h-5 w-5" />
                New Installation
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Client Name</label>
                  <input
                    value={installationForm.clientName}
                    onChange={(e) => setInstallationForm({ ...installationForm, clientName: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. Shoprite Bulawayo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Job Type</label>
                  <select
                    value={installationForm.jobType}
                    onChange={(e) => setInstallationForm({ ...installationForm, jobType: e.target.value as JobType })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option value="COLD_ROOM">Cold Room</option>
                    <option value="C40_FREEZER">C40 Freezer</option>
                    <option value="C60_FREEZER">C60 Freezer</option>
                    <option value="C90_FREEZER">C90 Freezer</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-sm font-semibold text-gray-700">Job Details</label>
                  <textarea
                    value={installationForm.jobDetails}
                    onChange={(e) => setInstallationForm({ ...installationForm, jobDetails: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    placeholder="Describe the installation work performed..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Floor Space (m²)</label>
                  <input
                    value={installationForm.floorSpace}
                    onChange={(e) => setInstallationForm({ ...installationForm, floorSpace: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. 24"
                  />
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Upload Images</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-sm font-medium">Click to upload images</span>
                  </button>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img src={img} alt={`Upload ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleInstallationSubmit}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white w-full py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Save className="h-5 w-5" />
                Submit Installation
              </button>
            </div>

            {/* Installations List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <History className="h-5 w-5 text-gray-500" />
                  Installations {user && <span className="text-blue-600 ml-1"> - {user.name}</span>}
                </div>
              </div>

              <div className="space-y-3">
                {installations.length > 0 ? (
                  installations.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-blue-200 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              inst.status === 'approved' ? 'bg-green-100 text-green-700' :
                              inst.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {inst.status}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(inst.installationDate).toLocaleDateString()}
                            </span>
                          </div>
                          <h5 className="font-bold text-gray-900">{inst.clientName}</h5>
                          <p className="text-sm text-gray-500">
                            {JobTypeLabels[inst.jobType]} | {inst.floorSpace && `${inst.floorSpace} m²`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!inst.cocRequested && (
                            <button
                              onClick={() => requestCOC(inst.id)}
                              className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-200 transition-colors"
                            >
                              <FileCheck className="h-4 w-4" />
                              Request COC
                            </button>
                          )}
                          {inst.cocRequested && !inst.cocApproved && (
                            <button
                              onClick={() => approveCOC(inst.id)}
                              className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-200 transition-colors"
                            >
                              <FileCheck className="h-4 w-4" />
                              Approve COC
                            </button>
                          )}
                          {inst.cocApproved && (
                            <button
                              onClick={() => generateCOCCertificate(inst)}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                              Download COC
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">No installations recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Compliance Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Compliance Notice</p>
                <p className="text-xs text-amber-700 mt-1">
                  COOLPRO supports only refrigerants compliant with SI 49 of 2023 and the Kigali Amendment. 
                  Only R-290, R-744 (CO₂), and R-32 are permitted for new entries.
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                <PlusCircle className="h-5 w-5" />
                New Log Entry
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Client Name</label>
                  <input
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. Shoprite Bulawayo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Work Location</label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. Unit 3 Roof, Aisle 4 Freezer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Job Type</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value as JobType })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option value="COLD_ROOM">Cold Room</option>
                    <option value="C40_FREEZER">C40 Freezer</option>
                    <option value="C60_FREEZER">C60 Freezer</option>
                    <option value="C90_FREEZER">C90 Freezer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Gas Usage (kg)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Refrigerant Type</label>
                  <select
                    value={formData.refrigerantType}
                    onChange={(e) => setFormData({ ...formData, refrigerantType: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option>R-290</option>
                    <option>R-744 (CO2)</option>
                    <option>R-32</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-sm font-semibold text-gray-700">Action Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Charge', 'Recovery', 'Leak Repair'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, actionType: type as any })}
                        className={`py-3 rounded-xl font-medium border transition-all ${formData.actionType === type
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogSubmit}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white w-full py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Save className="h-5 w-5" />
                Log Event & Ready for Sync
              </button>
            </div>

            {/* Logs History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <History className="h-5 w-5 text-gray-500" />
                  Recent Activity {user && <span className="text-blue-600 ml-1"> - {user.name}</span>}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <Archive className="h-3 w-3" />
                  Local Storage: {logs.length} entries
                </div>
              </div>

              <div className="space-y-3">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-blue-200 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${log.actionType === 'Recovery' ? 'bg-amber-100 text-amber-700' :
                                log.actionType === 'Leak Repair' ? 'bg-red-100 text-red-700' :
                                  'bg-green-100 text-green-700'
                              }`}>
                              {log.actionType}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h5 className="font-bold text-gray-900">{log.clientName}</h5>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="font-medium text-gray-700">{log.amount}kg</span> of {log.refrigerantType}
                            {log.location && <span className="text-gray-300 mx-1">|</span>}
                            {log.location && <span>{log.location}</span>}
                            <span className="text-gray-300 mx-1">|</span>
                            <span>{JobTypeLabels[log.jobType] || log.jobType}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => downloadPDF(log)}
                            className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">No logs recorded yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Offline Sync State */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-lg">
                <WifiOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-900 font-bold">
                  Offline Mode Active
                </p>
                <p className="text-xs text-amber-700 mt-0.5 mt-1">
                  Logs are saved locally on your device and will automatically sync to the central CoolPro database once you return to internet coverage.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldToolkit;
