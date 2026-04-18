'use client';

import { QRCodeSVG } from 'qrcode.react';

export function CertificateQRCode({
    value,
    title,
}: {
    value: string;
    title?: string;
}) {
    return (
        <div className="border border-gray-200 bg-white p-4 shadow-sm">
            {title && <p className="text-sm font-semibold text-gray-700">{title}</p>}
            <div className="mt-3 flex justify-center">
                <QRCodeSVG value={value} size={132} level="M" includeMargin />
            </div>
            <p className="mt-3 break-all text-center text-xs text-gray-400">{value}</p>
        </div>
    );
}
