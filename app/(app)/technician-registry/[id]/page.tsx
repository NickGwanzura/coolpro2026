'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, MapPin, Phone, Mail, Briefcase, Award, Calendar, FileText, Building2, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { useTechnician } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { SITE_URL } from '@/lib/site-url';

const HEVACRAZ_LOGO_PATH = '/logos/hevacraz-logo.jpeg';
const MOECT_LOGO_PATH = '/logos/ministry-of-environment.jpeg';

async function loadImageAsDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function TechnicianDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { success, info } = useToast();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { data: technician, error, isLoading } = useTechnician(id);

  if (isLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">Failed to load. {error.message}</div>;
  }

  if (!technician) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Technician Not Found</h3>
        <p className="text-gray-500 mb-4">The requested technician could not be found in the registry.</p>
        <button
          onClick={() => router.push('/technician-registry')}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      pending: 'Pending'
    };

    const icons = {
      active: CheckCircle,
      inactive: AlertTriangle,
      suspended: AlertTriangle,
      pending: Clock
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-4 w-4" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return new Intl.DateTimeFormat('en-ZW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/technician-registry')}
          className="p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{technician.name}</h1>
          <p className="text-gray-500 mt-1">National RAC Technician Verification and Competency Registry</p>
        </div>
        {getStatusBadge(technician.status)}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-gray-900">{technician.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">National ID</p>
                <p className="text-gray-900">{technician.nationalId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Number</p>
                <p className="text-gray-900">{technician.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Specialization</p>
                <p className="text-gray-900">{technician.specialization}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                <p className="text-gray-900">{technician.contactNumber}</p>
              </div>
              {technician.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{technician.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Employment Status</p>
                <p className="text-gray-900 capitalize">{technician.employmentStatus.replace('-', ' ')}</p>
              </div>
              {technician.employer && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Employer</p>
                  <p className="text-gray-900">{technician.employer}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Province</p>
                <p className="text-gray-900">{technician.province}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">District</p>
                <p className="text-gray-900">{technician.district}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Region</p>
                <p className="text-gray-900">{technician.region}</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h2>
            <div className="space-y-4">
              {technician.certifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No certifications on record</p>
              ) : (
                technician.certifications.map((cert) => (
                  <div key={cert.id} className="border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{cert.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{cert.issuingBody}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>Cert No: {cert.certificateNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Issued: {formatDate(cert.dateIssued)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Expiry: {formatDate(cert.expiryDate)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${cert.status === 'valid' ? 'bg-green-100 text-green-800' :
                          cert.status === 'expired' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {cert.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Training History */}
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Training History</h2>
            <div className="space-y-4">
              {technician.trainingHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No training records on file</p>
              ) : (
                technician.trainingHistory.map((training) => (
                  <div key={training.id} className="border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{training.courseName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{training.provider}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Completed: {formatDate(training.dateCompleted)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Duration: {training.duration}</span>
                          </div>
                          {training.certificateNumber && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>Cert No: {training.certificateNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Registration Details */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Date</p>
                <p className="text-gray-900">{formatDate(technician.registrationDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                <p className="text-gray-900">{formatDate(technician.expiryDate)}</p>
              </div>
              {technician.lastRenewalDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Renewal</p>
                  <p className="text-gray-900">{formatDate(technician.lastRenewalDate)}</p>
                </div>
              )}
              {technician.nextRenewalDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Next Renewal</p>
                  <p className="text-gray-900">{formatDate(technician.nextRenewalDate)}</p>
                </div>
              )}
            </div>
          </div>


          <div className="absolute -left-[9999px]" aria-hidden>
            <QRCodeCanvas
              ref={qrCanvasRef}
              value={`${SITE_URL}/verify-technician?mode=registration&q=${encodeURIComponent(technician.registrationNumber)}`}
              size={256}
              level="M"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                disabled={generatingCertificate}
                onClick={async () => {
                  setGeneratingCertificate(true);
                  try {
                    const [logoLeft, logoRight] = await Promise.all([
                      loadImageAsDataUrl(HEVACRAZ_LOGO_PATH),
                      loadImageAsDataUrl(MOECT_LOGO_PATH),
                    ]);
                    const qrDataUrl = qrCanvasRef.current?.toDataURL('image/png') ?? null;

                    const INK: [number, number, number] = [28, 25, 23];
                    const AMBER: [number, number, number] = [217, 119, 6];
                    const GREEN: [number, number, number] = [90, 125, 90];
                    const MUTED: [number, number, number] = [120, 113, 108];

                    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                    const PAGE_W = 297;
                    const PAGE_H = 210;
                    const issueYear = new Date().getFullYear();
                    const certificateNumber = `HEVACRAZ/CERT/${technician.registrationNumber}/${issueYear}`;

                    // Ornate double border
                    doc.setDrawColor(...INK);
                    doc.setLineWidth(1.1);
                    doc.rect(8, 8, PAGE_W - 16, PAGE_H - 16);
                    doc.setDrawColor(...AMBER);
                    doc.setLineWidth(0.4);
                    doc.rect(12, 12, PAGE_W - 24, PAGE_H - 24);

                    // Logos
                    if (logoLeft) { try { doc.addImage(logoLeft, 'JPEG', 24, 20, 20, 20); } catch { /* logo optional */ } }
                    if (logoRight) { try { doc.addImage(logoRight, 'JPEG', PAGE_W - 44, 20, 20, 20); } catch { /* logo optional */ } }

                    // Header
                    doc.setFontSize(11);
                    doc.setTextColor(...AMBER);
                    doc.setFont('', 'bold');
                    doc.text('NOU / HEVACRAZ  ·  NATIONAL OZONE UNIT ZIMBABWE', PAGE_W / 2, 32, { align: 'center' });

                    doc.setFontSize(28);
                    doc.setTextColor(...INK);
                    doc.text('CERTIFICATE OF COMPETENCY', PAGE_W / 2, 48, { align: 'center' });

                    doc.setDrawColor(...AMBER);
                    doc.setLineWidth(0.6);
                    doc.line(PAGE_W / 2 - 30, 53, PAGE_W / 2 + 30, 53);

                    doc.setFont('', 'normal');
                    doc.setFontSize(13);
                    doc.setTextColor(...MUTED);
                    doc.text('This is to certify that', PAGE_W / 2, 68, { align: 'center' });

                    // Name
                    doc.setFont('', 'bold');
                    doc.setFontSize(32);
                    doc.setTextColor(...INK);
                    doc.text(technician.name.toUpperCase(), PAGE_W / 2, 84, { align: 'center' });

                    doc.setFont('', 'normal');
                    doc.setFontSize(13);
                    doc.setTextColor(...MUTED);
                    doc.text('has successfully completed the national assessment for', PAGE_W / 2, 100, { align: 'center' });

                    doc.setFont('', 'bold');
                    doc.setFontSize(20);
                    doc.setTextColor(...GREEN);
                    doc.text(technician.specialization, PAGE_W / 2, 114, { align: 'center' });

                    // Detail columns
                    const detailY = 138;
                    const cols: [string, string][] = [
                      ['Certificate No', certificateNumber],
                      ['Registration No', technician.registrationNumber],
                      ['Issue Date', new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date())],
                      ['Valid Until', technician.expiryDate || 'Not set'],
                    ];
                    const colWidth = (PAGE_W - 60) / cols.length;
                    cols.forEach(([label, value], i) => {
                      const x = 30 + colWidth * i + colWidth / 2;
                      doc.setFont('', 'bold');
                      doc.setFontSize(7.5);
                      doc.setTextColor(...MUTED);
                      doc.text(label.toUpperCase(), x, detailY, { align: 'center' });
                      doc.setFont('', 'bold');
                      doc.setFontSize(10);
                      doc.setTextColor(...INK);
                      doc.text(value, x, detailY + 6, { align: 'center', maxWidth: colWidth - 4 });
                    });

                    // QR code — unique, verifiable at the public verification portal
                    if (qrDataUrl) {
                      const qrSize = 26;
                      const qrX = PAGE_W - 24 - qrSize;
                      const qrY = PAGE_H - 24 - qrSize - 6;
                      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
                      doc.setFont('', 'normal');
                      doc.setFontSize(6.5);
                      doc.setTextColor(...MUTED);
                      doc.text('Scan to verify', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
                    }

                    // Footer
                    doc.setFont('', 'bold');
                    doc.setFontSize(13);
                    doc.setTextColor(...INK);
                    doc.text('National Refrigeration Program', 32, PAGE_H - 34);
                    doc.setFont('', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(...MUTED);
                    doc.text('Republic of Zimbabwe', 32, PAGE_H - 29);
                    doc.text(
                      `Verify this certificate at ${SITE_URL}/verify-technician?mode=registration&q=${encodeURIComponent(technician.registrationNumber)}`,
                      32,
                      PAGE_H - 20,
                      { maxWidth: 180 },
                    );

                    doc.save(`${technician.name.replace(/\s+/g, '-')}-certificate.pdf`);
                    success('Certificate downloaded successfully');
                  } finally {
                    setGeneratingCertificate(false);
                  }
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatingCertificate ? <Loader2 className="h-5 w-5 animate-spin" /> : <Award className="h-5 w-5" />}
                Generate National Certificate
              </button>
              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 transition-colors"
              >
                Print Full Profile
              </button>
              <button
                onClick={() => {
                  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });

                  // Card background
                  doc.setFillColor(15, 23, 42);
                  doc.rect(0, 0, 85.6, 54, 'F');

                  // Left accent stripe
                  doc.setFillColor(37, 99, 235);
                  doc.rect(0, 0, 4, 54, 'F');

                  // Logo area
                  doc.setFontSize(6);
                  doc.setTextColor(156, 163, 175);
                  doc.text('NATIONAL REFRIGERATION PROGRAMME', 8, 8);
                  doc.setFontSize(5);
                  doc.text('REPUBLIC OF ZIMBABWE', 8, 12);

                  // Divider
                  doc.setDrawColor(37, 99, 235);
                  doc.setLineWidth(0.3);
                  doc.line(8, 15, 77, 15);

                  // Name
                  doc.setFontSize(11);
                  doc.setTextColor(255, 255, 255);
                  doc.setFont('', 'bold');
                  doc.text(technician.name.toUpperCase(), 8, 24);

                  // Specialization
                  doc.setFontSize(6.5);
                  doc.setFont('', 'normal');
                  doc.setTextColor(156, 163, 175);
                  doc.text(technician.specialization, 8, 29);

                  // Status badge
                  const statusColor = technician.status === 'active' ? [34, 197, 94] : [239, 68, 68];
                  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
                  doc.roundedRect(8, 32, 18, 5, 1, 1, 'F');
                  doc.setFontSize(5);
                  doc.setTextColor(255, 255, 255);
                  doc.setFont('', 'bold');
                  doc.text(technician.status.toUpperCase(), 17, 35.5, { align: 'center' });

                  // Details
                  doc.setFont('', 'normal');
                  doc.setFontSize(5.5);
                  doc.setTextColor(156, 163, 175);
                  doc.text('REG NO', 8, 43);
                  doc.text('VALID UNTIL', 8, 48);
                  doc.setTextColor(255, 255, 255);
                  doc.setFont('', 'bold');
                  doc.text(technician.registrationNumber, 8, 46);
                  doc.text(technician.expiryDate, 8, 51);

                  // Province
                  doc.setFont('', 'normal');
                  doc.setTextColor(156, 163, 175);
                  doc.text('PROVINCE', 55, 43);
                  doc.setTextColor(255, 255, 255);
                  doc.setFont('', 'bold');
                  doc.text(technician.province, 55, 46);

                  doc.save(`${technician.name.replace(/\s+/g, '-')}-digital-id.pdf`);
                  success('Digital ID card downloaded successfully');
                }}
                className="w-full px-4 py-2 bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 transition-colors"
              >
                Send Digital ID Card
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
