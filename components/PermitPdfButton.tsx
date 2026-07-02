'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import type { TradePermit } from '@/types/index';

function formatDate(value?: string) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

export function PermitPdfButton({ permit }: { permit: TradePermit }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const verificationUrl =
    typeof window !== 'undefined' && permit.verificationUrl
      ? `${window.location.origin}${permit.verificationUrl}`
      : permit.verificationUrl ?? '';

  const handleDownload = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header band
      doc.setFillColor(28, 25, 23);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('', 'bold');
      doc.text('HEVACRAZ / National Ozone Unit Zimbabwe', 14, 14);
      doc.setFontSize(10);
      doc.setFont('', 'normal');
      doc.text('Refrigerant Trade Permit', 14, 22);

      doc.setTextColor(28, 25, 23);
      doc.setFontSize(20);
      doc.setFont('', 'bold');
      doc.text(permit.permitType === 'import' ? 'IMPORT PERMIT' : 'EXPORT PERMIT', 14, 45);

      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.5);
      doc.line(14, 50, 196, 50);

      const rows: [string, string][] = [
        ['Permit Number', permit.permitNumber],
        ['Status', permit.status.toUpperCase()],
        ['Applicant Company', permit.applicantCompany],
        ['Applicant', permit.applicantName],
        ['Refrigerant', permit.refrigerantLabel],
        ['Quantity', `${permit.quantityKg} kg`],
        ['Country of Origin/Destination', permit.countryOfOriginOrDestination],
        ['Issued Date', formatDate(permit.issuedDate)],
        ['Expiry Date', formatDate(permit.expiryDate)],
      ];

      let y = 62;
      doc.setFontSize(10);
      for (const [label, value] of rows) {
        doc.setFont('', 'bold');
        doc.setTextColor(120, 113, 108);
        doc.text(label.toUpperCase(), 14, y);
        doc.setFont('', 'normal');
        doc.setTextColor(28, 25, 23);
        doc.text(String(value), 14, y + 5);
        y += 14;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const qrDataUrl = canvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 140, 62, 45, 45);
        doc.setFontSize(7);
        doc.setTextColor(120, 113, 108);
        doc.text('Scan to verify this permit', 140, 112);
      }

      doc.setDrawColor(229, 224, 219);
      doc.line(14, y + 4, 196, y + 4);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        'This permit is issued for the quantity and substance specified above only. Verify authenticity at ' + verificationUrl,
        14,
        y + 12,
        { maxWidth: 182 },
      );

      doc.save(`${permit.permitNumber}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="inline-flex items-center">
      {/* Off-screen canvas used only as an image source for the PDF */}
      <div className="absolute -left-[9999px]" aria-hidden>
        {verificationUrl && <QRCodeCanvas ref={canvasRef} value={verificationUrl} size={256} level="M" />}
      </div>
      <button
        onClick={handleDownload}
        disabled={generating || !verificationUrl}
        title={verificationUrl ? 'Download permit PDF' : 'Permit not yet approved'}
        className="inline-flex items-center gap-1.5 border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        PDF
      </button>
    </div>
  );
}
