
import React from 'react';
import { Terminal, Database, Calculator, FileText } from 'lucide-react';

const Documentation: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CoolPro Platform Blueprint</h1>
        <p className="text-gray-500 mt-2">Technical documentation and architecture overview</p>
      </div>
      
      {/* Section 1 */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex items-center gap-3">
          <Terminal className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Section 1 — System Architecture</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-6 rounded-xl font-mono text-sm leading-relaxed mb-6">
            <span className="text-blue-600">[CLIENT]</span> Next.js (PWA) + Service Worker (Offline Cache)<br/>
            <span className="text-gray-400 ml-4">|</span><br/>
            <span className="text-blue-600 ml-4">[API Gateway]</span> RESTful endpoints (Auth / Multi-tenant)<br/>
            <span className="text-gray-400 ml-8">|</span><br/>
            <span className="text-blue-600 ml-8">[Core Services]</span> (LMS, Sizing Engine, Compliance Hub)<br/>
            <span className="text-gray-400 ml-12">|</span><br/>
            <span className="text-blue-600 ml-12">[Data Layer]</span> PostgreSQL (Relational) + Redis (Session)<br/>
            <span className="text-gray-400 ml-16">|</span><br/>
            <span className="text-blue-600 ml-16">[Files]</span> S3/R2 (Video Training & PDF Reports)
          </div>
          <p className="text-gray-600 leading-relaxed">
            The architecture utilizes a <strong className="text-gray-900">Multi-tenant Partitioned Schema</strong>. 
            Each country (e.g., South Africa, Brazil, Vietnam) operates on its own schema instance to comply 
            with local data residency and regulatory differences in refrigerant quotas.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex items-center gap-3">
          <Database className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Section 4 — Database Design (PostgreSQL)</h2>
        </div>
        <div className="p-6">
          <pre className="bg-gray-50 p-5 rounded-xl text-xs overflow-x-auto text-gray-700 border border-gray-100">
{`CREATE TABLE technicians (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    license_no VARCHAR(50) UNIQUE,
    certification_level INT DEFAULT 1,
    country_code VARCHAR(3) -- ISO 3166-1
);

CREATE TABLE refrigerant_logs (
    id UUID PRIMARY KEY,
    tech_id UUID REFERENCES technicians(id),
    facility_id UUID,
    refrigerant_type VARCHAR(20),
    action_type ENUM('CHARGE', 'RECOVERY', 'LEAK_REPAIR'),
    quantity_kg DECIMAL(10,2),
    gwp_value INT,
    synced_at TIMESTAMP DEFAULT NOW()
);`}
          </pre>
        </div>
      </section>

      {/* Section 7 */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex items-center gap-3">
          <Calculator className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Section 7 — Sizing Logic</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
            <p className="font-semibold text-gray-900 mb-3">Cooling Load Equation (kW):</p>
            <code className="block bg-white p-4 rounded-lg text-blue-600 font-mono text-sm mb-4 border border-gray-200">
              Q_total = (Q_walls + Q_air + Q_product + Q_internal) * SF
            </code>
            <ul className="text-sm space-y-2 text-gray-600">
              <li><strong className="text-gray-900">Q_walls:</strong> A × U × ΔT (Surface Area × Heat Transfer Coeff × Temp Diff)</li>
              <li><strong className="text-gray-900">Q_air:</strong> V × n × ρ × Δh (Volume × Changes × Density × Enthalpy Diff)</li>
              <li><strong className="text-gray-900">Q_product:</strong> (m × Cp × ΔT) / t (Mass × Specific Heat × Temp Pull-down / Time)</li>
              <li><strong className="text-gray-900">SF:</strong> 1.15 to 1.20 (Standard Safety Factor)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Documentation;
