
import React, { useEffect, useState, useRef } from 'react';
import {
  CheckSquare,
  FileText,
  Save,
  WifiOff,
  Wifi,
  RefreshCw,
  Download,
  History,
  PlusCircle,
  Upload,
  FileCheck,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { RefrigerantLog, Installation, JobType, JobTypeLabels, Refrigerant } from '../types';
import { jsPDF } from 'jspdf';
import { readCollection, STORAGE_KEYS } from '@/lib/platformStore';
import { createGasLogs, searchRefrigerantsOnce, useApprovedSuppliers, useInstallations, createInstallation } from '@/lib/api';
import { RefrigerantAutocomplete, refrigerantLabel } from '@/components/RefrigerantAutocomplete';

interface FieldToolkitProps {
  /** A refrigerant code detected by the OCR nameplate scanner, to prefill the gas register form. */
  prefillRefrigerantCode?: string;
  /** Called once the prefill has been applied, so the parent can clear it. */
  onPrefillConsumed?: () => void;
}

const FieldToolkit: React.FC<FieldToolkitProps> = ({ prefillRefrigerantCode, onPrefillConsumed }) => {
  const { user } = useAuth();
  const { data: approvedSuppliersData, error: approvedSuppliersError, isLoading: approvedSuppliersLoading } = useApprovedSuppliers();
  const approvedSuppliers = approvedSuppliersData ?? [];
  const { data: dbInstallations = [], mutate: mutateInstallations } = useInstallations();
  const installations = dbInstallations;
  const [activeTab, setActiveTab] = useState<'checklist' | 'installations' | 'leaks'>('checklist');
  const [checklistType, setChecklistType] = useState<'installation' | 'regassing'>('installation');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  // Installation State
  const [installationForm, setInstallationForm] = useState({
    clientName: '',
    jobDetails: '',
    floorSpace: '',
    jobType: 'COLD_ROOM' as JobType,
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logbook State — starts empty; real entries come from the DB via createGasLogs
  const [logs, setLogs] = useState<RefrigerantLog[]>([]);

  const [formData, setFormData] = useState({
    clientName: '',
    location: '',
    jobType: 'COLD_ROOM' as JobType,
    refrigerant: null as Refrigerant | null,
    refrigerantType: '',
    amount: '',
    actionType: 'Charge' as 'Charge' | 'Recovery' | 'Leak Repair',
    approvedSupplierId: '',
    pesepayTransactionId: '',
    plannerJobId: '',
  });

  const [pendingSyncIds, setPendingSyncIds] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [checklistNotice, setChecklistNotice] = useState('');
  const [prefillNotice, setPrefillNotice] = useState('');

  useEffect(() => {
    setPendingSyncIds(readCollection<string>(STORAGE_KEYS.fieldToolkitPendingSync, []));
    setIsOnline(navigator.onLine);
  }, []);

  // Installations are DB-backed via useInstallations hook — no localStorage mirror needed

  useEffect(() => {
    // Pending sync IDs persisted to localStorage for offline resilience
    try { window.localStorage.setItem(STORAGE_KEYS.fieldToolkitPendingSync, JSON.stringify(pendingSyncIds)); } catch {}
  }, [pendingSyncIds]);

  const syncPendingLogs = React.useCallback(async (ids: string[], allLogs: RefrigerantLog[]) => {
    const logsToSync = allLogs.filter(l => ids.includes(l.id));
    if (logsToSync.length === 0) {
      setPendingSyncIds(prev => prev.filter(id => !ids.includes(id)));
      return;
    }
    try {
      await createGasLogs(logsToSync);
      setPendingSyncIds(prev => prev.filter(id => !ids.includes(id)));
    } catch (err) {
      console.error('Retry sync failed:', err);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingLogs(pendingSyncIds, logs);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSyncIds, logs]);

  useEffect(() => {
    if (!prefillRefrigerantCode) return;
    let cancelled = false;

    (async () => {
      let refrigerant: Refrigerant | null = null;
      try {
        const results = await searchRefrigerantsOnce({ q: prefillRefrigerantCode, pageSize: 1 });
        refrigerant = results.data[0] ?? null;
      } catch (err) {
        console.error('Failed to look up scanned refrigerant:', err);
      }
      if (cancelled) return;

      setFormData(prev => ({
        ...prev,
        refrigerant,
        refrigerantType: refrigerant ? refrigerantLabel(refrigerant) : prefillRefrigerantCode,
      }));
      setActiveTab('leaks');
      setPrefillNotice(`Filled from nameplate scan: ${prefillRefrigerantCode}`);
      onPrefillConsumed?.();
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillRefrigerantCode]);

  const toggleCheck = (index: string) => {
    setCheckedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSaveChecklist = () => {
    const totalItems = (checklistType === 'installation' ? checklistItems : regassingChecklistItems)
      .reduce((sum, category) => sum + category.items.length, 0);
    const entry = {
      id: Math.random().toString(36).substr(2, 9),
      checklistType,
      completedItems: checkedItems.length,
      totalItems,
      completedAt: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.fieldToolkitChecklists) ?? '[]');
      existing.unshift(entry);
      window.localStorage.setItem(STORAGE_KEYS.fieldToolkitChecklists, JSON.stringify(existing));
    } catch {}
    setChecklistNotice(`Saved — ${checkedItems.length}/${totalItems} items checked.`);
  };

  const checklistItems = [
    // Pre-Installation Checks
    { category: 'PRE-INSTALLATION', items: [
      { text: 'Site survey completed and documented', source: 'Industry Standard', url: null },
      { text: 'Equipment specification matches site requirements', source: 'Manufacturer Manual', url: null },
      { text: 'Adequate ventilation assessed', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
      { text: 'Electrical supply verified (voltage, phase, earth)', source: 'SANS 10142-1', url: 'https://www.sabs.co.za' },
    ]},
    // Nitrogen Inert Gas Brazing
    { category: 'NITROGEN INERT GAS BRAZING', items: [
      { text: 'Nitrogen cylinder with regulator in place', source: 'F-Gas Regulation', url: 'https://unece.org/environment-policy/air/environment-management-gases-fluoro-greenhouse-gases' },
      { text: 'Nitrogen flow rate set to 3-5 SCFH (slow bubble)', source: 'Manufacturer Guidelines', url: null },
      { text: 'All joints purged with nitrogen during brazing', source: 'Industry Best Practice', url: null },
      { text: 'No open flame without nitrogen protection', source: 'Safety Protocol', url: null },
    ]},
    // Pressure Testing
    { category: 'PRESSURE TEST WITH DRY NITROGEN', items: [
      { text: 'System isolated from compressors', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
      { text: 'High-side test pressure: 1.5x working pressure (min 300 psi)', source: 'Manufacturer Spec', url: null },
      { text: 'Low-side test pressure: 150-200 psi', source: 'Manufacturer Spec', url: null },
      { text: 'Pressure hold test: 24 hours minimum', source: 'Industry Standard', url: null },
      { text: 'No pressure drop recorded', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
    ]},
    // Evacuation
    { category: 'EVACUATION', items: [
      { text: 'Deep vacuum pump connected (2-stage)', source: 'Equipment Manual', url: null },
      { text: 'Evacuation to 500 microns or lower', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
      { text: 'Vacuum hold test: 30 minutes minimum', source: 'Manufacturer Guidelines', url: null },
      { text: 'Triple evacuation performed for systems >5m line set', source: 'Best Practice', url: null },
    ]},
    // Charging
    { category: 'CHARGING SYSTEM', items: [
      { text: 'Weighed charging method used (for HFC systems)', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
      { text: 'Manufacturer-specified charge quantity verified', source: 'Nameplate Data', url: null },
      { text: 'Superheat and subcooling checked and adjusted', source: 'Manufacturer Guidelines', url: null },
      { text: 'System operating within design parameters', source: 'Commissioning Standard', url: null },
    ]},
  ];

  // Regassing Checklist
  const regassingChecklistItems = [
    // Pre-Service Checks
    { category: 'PRE-SERVICE ASSESSMENT', items: [
      { text: 'Leak test performed and any leaks repaired', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
      { text: 'System operating history reviewed', source: 'Service Protocol', url: null },
      { text: 'Correct refrigerant type confirmed from nameplate', source: 'Manufacturer Spec', url: null },
      { text: 'Recovery equipment tested and functional', source: 'F-Gas Certification', url: 'https://unece.org/environment-policy/air/environment-management-gases-fluoro-greenhouse-gases' },
    ]},
    // Recovery
    { category: 'RECOVERY', items: [
      { text: 'Old refrigerant recovered using certified equipment', source: 'F-Gas Regulation', url: 'https://unece.org/environment-policy/air/environment-management-gases-fluoro-greenhouse-gases' },
      { text: 'Recovery cylinder labeled with refrigerant type and date', source: 'Environmental Act', url: 'https://www.dmr.gov.zw' },
      { text: 'Refrigerant recovered to 80% cylinder capacity', source: 'Best Practice', url: null },
      { text: 'Recovery log completed with weight recovered', source: 'Compliance Record', url: null },
    ]},
    // Vacuum & Charging
    { category: 'VACUUM & RECHARGE', items: [
      { text: 'System evacuated to 500 microns', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
      { text: 'Leak check performed after vacuum', source: 'Manufacturer Guidelines', url: null },
      { text: 'Weighed charging method used', source: 'SANS 5001-1', url: 'https://www.sabs.co.za' },
      { text: 'Charge quantity matches manufacturer specification', source: 'Nameplate', url: null },
    ]},
    // Post-Service
    { category: 'POST-SERVICE VERIFICATION', items: [
      { text: 'System performance tested (amps, pressures, temps)', source: 'Commissioning', url: null },
      { text: 'Leak detection spray applied to all connections', source: 'Best Practice', url: null },
      { text: 'Customer briefed on system operation', source: 'Service Standard', url: null },
      { text: 'Service record completed and signed', source: 'Compliance', url: null },
    ]},
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
  const handleInstallationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installationForm.clientName || !installationForm.jobDetails) return;

    try {
      await createInstallation({
        clientName: installationForm.clientName,
        location: undefined,
        jobDetails: installationForm.jobDetails,
        floorSpace: installationForm.floorSpace,
        jobType: installationForm.jobType,
        images: uploadedImages,
      });
      await mutateInstallations();
      setInstallationForm({
        clientName: '',
        jobDetails: '',
        floorSpace: '',
        jobType: 'COLD_ROOM',
      });
      setUploadedImages([]);
    } catch (err) {
      console.error('Failed to save installation:', err);
    }
  };

  // Request COC
  const requestCOC = async (id: string) => {
    try {
      await fetch(`/api/installations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cocRequested: true }),
      });
      await mutateInstallations();
    } catch (err) {
      console.error('Failed to request COC:', err);
    }
  };

  // Approve COC
  const approveCOC = async (id: string) => {
    try {
      await fetch(`/api/installations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cocApproved: true, cocApprovalDate: new Date().toISOString(), status: 'approved' }),
      });
      await mutateInstallations();
    } catch (err) {
      console.error('Failed to approve COC:', err);
    }
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
    doc.text('HEVACRAZ', 105, 35, { align: 'center' });
    doc.setFontSize(10);
    doc.text('HVAC-R Association of Zimbabwe', 105, 42, { align: 'center' });
    
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
    
    // References
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('References & Standards:', 20, 220);
    doc.setFontSize(8);
    doc.text('• SANS 5001-1: South African National Standard for Refrigeration', 25, 230);
    doc.text('• SANS 10142-1: Wiring of Premises (Electrical)', 25, 238);
    doc.text('• ASHRAE Standards: American Society of Heating, Refrigerating and Air-Conditioning Engineers', 25, 246);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text('This certificate is issued subject to HEVACRAZ terms and conditions', 105, 270, { align: 'center' });
    doc.text('Generated by HEVACRAZ Digital Field Toolkit', 105, 278, { align: 'center' });
    
    doc.save(`COC-Certificate-${installation.id}.pdf`);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.amount) return;

    const selectedSupplier = approvedSuppliers.find(
      supplier => supplier.id === formData.approvedSupplierId
    );

    const newLog: RefrigerantLog = {
      id: Math.random().toString(36).substr(2, 9),
      technicianId: user?.id || 'unknown',
      technicianName: user?.name || 'Anonymous',
      clientName: formData.clientName,
      location: formData.location,
      plannerJobId: formData.plannerJobId || undefined,
      jobType: formData.jobType,
      refrigerantId: formData.refrigerant?.id,
      refrigerantType: formData.refrigerantType,
      amount: parseFloat(formData.amount),
      actionType: formData.actionType,
      approvedSupplierId: selectedSupplier?.id,
      approvedSupplierName: selectedSupplier?.name,
      supplierVerified: Boolean(selectedSupplier),
      pesepayTransactionId: formData.pesepayTransactionId || undefined,
      timestamp: new Date().toISOString(),
    };

    setLogs([newLog, ...logs]);
    setPendingSyncIds(prev => [...prev, newLog.id]);

    createGasLogs([newLog])
      .then(() => setPendingSyncIds(prev => prev.filter(id => id !== newLog.id)))
      .catch((err) => console.error('Failed to sync gas log to DB:', err));

    setFormData({
      clientName: '',
      location: '',
      jobType: 'COLD_ROOM' as JobType,
      refrigerant: null,
      refrigerantType: '',
      amount: '',
      actionType: 'Charge',
      approvedSupplierId: '',
      pesepayTransactionId: '',
      plannerJobId: '',
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
    doc.text(`Approved Supplier: ${log.approvedSupplierName || 'Unverified / not selected'}`, 20, 170);
    doc.text(`Pesepay Transaction ID: ${log.pesepayTransactionId || 'Not provided'}`, 20, 180);

    // Footer
    doc.setFontSize(10);
    doc.text('Generated by COOLPRO Digital Toolkit', 20, 270);

    doc.save(`coolpro-log-${log.id}.pdf`);
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 px-4 py-4 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'checklist'
              ? 'bg-white text-[#D97706] border-b-2 border-[#D97706]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <CheckSquare className="h-4 w-4" />
          Checklist
        </button>
        <button
          onClick={() => setActiveTab('installations')}
          className={`flex-1 px-4 py-4 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'installations'
              ? 'bg-white text-[#D97706] border-b-2 border-[#D97706]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          Installations
        </button>
        <button
          onClick={() => setActiveTab('leaks')}
          className={`flex-1 px-4 py-4 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'leaks'
              ? 'bg-white text-[#D97706] border-b-2 border-[#D97706]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <FileText className="h-4 w-4" />
          Refrigerant Charge and Recovery Tracking Register
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'checklist' ? (
          <div className="space-y-6">
            {/* Checklist Type Switcher */}
            <div className="flex gap-2 p-1 bg-gray-100 ">
              <button
                onClick={() => { setChecklistType('installation'); setCheckedItems([]); setChecklistNotice(''); }}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  checklistType === 'installation' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                New Installation
              </button>
              <button
                onClick={() => { setChecklistType('regassing'); setCheckedItems([]); setChecklistNotice(''); }}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
                  checklistType === 'regassing' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Regassing / Service
              </button>
            </div>

            <h4 className="text-lg font-semibold text-gray-900">
              {checklistType === 'installation' ? 'New Installation Verification' : 'Regassing & Service Checklist'}
            </h4>
            
            <div className="space-y-6">
              {(checklistType === 'installation' ? checklistItems : regassingChecklistItems).map((category, catIndex) => (
                <div key={catIndex} className="space-y-3">
                  <h5 className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-2 ">
                    {category.category}
                  </h5>
                  {category.items.map((item, itemIndex) => {
                    const itemId = `${checklistType}-${catIndex}-${itemIndex}`;
                    return (
                      <label
                        key={itemIndex}
                        className="flex items-start gap-4 p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems.includes(itemId)}
                          onChange={() => toggleCheck(itemId)}
                          className="mt-0.5 h-6 w-6 shrink-0 rounded border-gray-300 text-[#D97706] focus:ring-[#D97706]"
                        />
                        <div className="flex-1">
                          <span className="text-gray-700 font-medium">{item.text}</span>
                          {item.source && (
                            item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-[#D97706] hover:text-[#b45309] hover:underline mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📄 Source: {item.source} ↗
                              </a>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">Source: {item.source}</p>
                            )
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="pt-6 space-y-3">
              <button
                onClick={handleSaveChecklist}
                className="flex items-center gap-2 bg-[#1C1917] text-white px-6 py-3 font-semibold hover:bg-[#292524] transition-colors"
              >
                <Save className="h-4 w-4" />
                Complete & Save Locally
              </button>
              {checklistNotice && (
                <p className="text-sm font-medium text-emerald-700">{checklistNotice}</p>
              )}
            </div>
          </div>
        ) : activeTab === 'installations' ? (
          <div className="space-y-8">
            {/* New Installation Form */}
            <div className="space-y-6 bg-gray-50/50 p-6 border border-gray-200">
              <div className="flex items-center gap-2 text-[#D97706] font-semibold mb-2">
                <PlusCircle className="h-5 w-5" />
                New Installation
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Client Name</label>
                  <input
                    value={installationForm.clientName}
                    onChange={(e) => setInstallationForm({ ...installationForm, clientName: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. Shoprite Bulawayo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Job Type</label>
                  <select
                    value={installationForm.jobType}
                    onChange={(e) => setInstallationForm({ ...installationForm, jobType: e.target.value as JobType })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option value="COLD_ROOM">Cold Room</option>
                    <option value="C40_FREEZER">C40 Freezer</option>
                    <option value="C60_FREEZER">C60 Freezer</option>
                    <option value="C90_FREEZER">C90 Freezer</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="block text-sm font-semibold text-gray-700">Job Details</label>
                  <textarea
                    value={installationForm.jobDetails}
                    onChange={(e) => setInstallationForm({ ...installationForm, jobDetails: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="Describe the installation work performed..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Floor Space (m²)</label>
                  <input
                    value={installationForm.floorSpace}
                    onChange={(e) => setInstallationForm({ ...installationForm, floorSpace: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. 24"
                  />
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Upload Images</label>
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
                    className="w-full border-2 border-dashed border-gray-300 p-4 flex flex-col items-center gap-2 text-gray-500 hover:border-[#D97706] hover:text-[#D97706] transition-colors"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-sm font-medium">Click to upload images</span>
                  </button>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img src={img} alt={`Upload ${i + 1}`} className="w-full h-20 object-cover " />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center bg-red-500 text-white rounded-full text-sm"
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
                className="flex items-center justify-center gap-2 bg-[#D97706] text-white w-full py-4 font-semibold hover:bg-[#b45309] transition-colors shadow-lg shadow-[#D97706]/20"
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
                  Installations {user && <span className="text-[#D97706] ml-1"> - {user.name}</span>}
                </div>
              </div>

              <div className="space-y-3">
                {installations.length > 0 ? (
                  installations.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-4 border border-gray-200 bg-white hover:border-[#D97706]/40 transition-all"
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
                            {JobTypeLabels[inst.jobType as JobType]} | {inst.floorSpace && `${inst.floorSpace} m²`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!inst.cocRequested && (
                            <button
                              onClick={() => requestCOC(inst.id)}
                              className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-200 transition-colors"
                            >
                              <FileCheck className="h-4 w-4" />
                              Request COC
                            </button>
                          )}
                          {inst.cocRequested && !inst.cocApproved && (
                            <button
                              onClick={() => approveCOC(inst.id)}
                              className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 text-sm font-semibold hover:bg-green-200 transition-colors"
                            >
                              <FileCheck className="h-4 w-4" />
                              Approve COC
                            </button>
                          )}
                          {inst.cocApproved && (
                            <button
                              onClick={() => generateCOCCertificate(inst)}
                              className="flex items-center gap-2 bg-[#D97706] text-white px-4 py-2 text-sm font-semibold hover:bg-[#b45309] transition-colors"
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
                  <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">No installations recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Compliance Notice */}
            <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
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
            <div className="space-y-6 bg-gray-50/50 p-6 border border-gray-200">
              <div className="flex items-center gap-2 text-[#D97706] font-semibold mb-2">
                <PlusCircle className="h-5 w-5" />
                New Log Entry
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Client Name</label>
                  <input
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. Shoprite Bulawayo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Work Location</label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. Unit 3 Roof, Aisle 4 Freezer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Job Type</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value as JobType })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option value="COLD_ROOM">Cold Room</option>
                    <option value="C40_FREEZER">C40 Freezer</option>
                    <option value="C60_FREEZER">C60 Freezer</option>
                    <option value="C90_FREEZER">C90 Freezer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Gas Usage (kg)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Refrigerant Type</label>
                  <RefrigerantAutocomplete
                    value={formData.refrigerant}
                    onSelect={(r) => {
                      setFormData({ ...formData, refrigerant: r, refrigerantType: r ? refrigerantLabel(r) : '' });
                      setPrefillNotice('');
                    }}
                  />
                  {prefillNotice && (
                    <p className="text-xs font-medium text-emerald-700">{prefillNotice}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Approved Supplier</label>
                  <select
                    value={formData.approvedSupplierId}
                    onChange={(e) => setFormData({ ...formData, approvedSupplierId: e.target.value })}
                    disabled={approvedSuppliersLoading}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all appearance-none cursor-pointer bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {approvedSuppliersLoading ? 'Loading suppliers…' : 'Select approved supplier'}
                    </option>
                    {approvedSuppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {approvedSuppliersError && (
                    <p className="text-xs text-red-600">Couldn&apos;t load approved suppliers. Check your connection and retry.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Pesepay Transaction ID
                    <span className="ml-2 text-xs font-medium text-amber-700">Required for rewards</span>
                  </label>                    <input
                    value={formData.pesepayTransactionId}
                    onChange={(e) => setFormData({ ...formData, pesepayTransactionId: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. MOCK-20260331-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Linked Planner Job ID
                    <span className="ml-2 text-xs font-medium text-gray-400">Optional</span>
                  </label>
                  <input
                    value={formData.plannerJobId}
                    onChange={(e) => setFormData({ ...formData, plannerJobId: e.target.value })}
                    className="w-full border border-gray-200 p-3 focus:ring-2 focus:ring-[#D97706] focus:border-transparent outline-none transition-all bg-white"
                    placeholder="e.g. job-abc123"
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="block text-sm font-semibold text-gray-700">Action Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Charge', 'Recovery', 'Leak Repair'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, actionType: type as 'Charge' | 'Recovery' | 'Leak Repair' })}
                        className={`py-3.5 font-medium border transition-all ${formData.actionType === type
                            ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#D97706]'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!formData.approvedSupplierId && (
                <div className="rounded-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Purchases from unapproved suppliers are not eligible for rewards points and will be flagged in the NOU compliance report.
                </div>
              )}

              <button
                onClick={handleLogSubmit}
                className="flex items-center justify-center gap-2 bg-[#D97706] text-white w-full py-4 font-semibold hover:bg-[#b45309] transition-colors shadow-lg shadow-[#D97706]/20"
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
                  Recent Activity {user && <span className="text-[#D97706] ml-1"> - {user.name}</span>}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  <RefreshCw className="h-3 w-3" />
                  DB-backed: {logs.length} entries
                </div>
              </div>

              <div className="space-y-3">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border border-gray-200 bg-white hover:border-[#D97706]/40 transition-all group"
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
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={`rounded-full px-2.5 py-1 font-semibold ${
                                log.supplierVerified
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {log.supplierVerified ? 'Supplier verified' : 'Supplier unverified'}
                            </span>
                            {log.approvedSupplierName && (
                              <span className="text-gray-500">{log.approvedSupplierName}</span>
                            )}
                            {log.pesepayTransactionId && (
                              <span className="font-mono text-gray-400">{log.pesepayTransactionId}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => downloadPDF(log)}
                            className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">No logs recorded yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sync State */}
            {!isOnline ? (
              <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-4">
                <div className="bg-amber-100 p-2">
                  <WifiOff className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-900 font-bold">You&apos;re offline</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {pendingSyncIds.length > 0
                      ? `${pendingSyncIds.length} log${pendingSyncIds.length === 1 ? '' : 's'} saved on this device and will sync automatically once you're back online.`
                      : 'New logs are saved on this device and will sync automatically once you\'re back online.'}
                  </p>
                </div>
              </div>
            ) : pendingSyncIds.length > 0 ? (
              <div className="bg-amber-50 border border-amber-200 p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 p-2">
                    <RefreshCw className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-900 font-bold">
                      {pendingSyncIds.length} log{pendingSyncIds.length === 1 ? '' : 's'} pending sync
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      These logs are saved on this device but haven&apos;t synced to the central database yet.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => syncPendingLogs(pendingSyncIds, logs)}
                  className="shrink-0 inline-flex items-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b45309]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry sync
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                <Wifi className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-emerald-800 font-medium">All logs are synced to the central database.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldToolkit;
