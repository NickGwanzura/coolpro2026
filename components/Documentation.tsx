
import React from 'react';

const Documentation: React.FC = () => {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-black text-slate-900 mb-8 border-b pb-4">CoolPro Platform Blueprint</h1>
      
      <section className="mb-12">
        <h2 className="text-xl font-bold text-cyan-700 uppercase tracking-widest mb-4">Section 1 — System Architecture</h2>
        <div className="bg-slate-800 text-slate-100 p-6 rounded-xl font-mono text-sm leading-relaxed mb-6">
          [CLIENT] Next.js (PWA) + Service Worker (Offline Cache)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
          &nbsp;&nbsp;[API Gateway] RESTful endpoints (Auth / Multi-tenant)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
          &nbsp;&nbsp;[Core Services] (LMS, Sizing Engine, Compliance Hub)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
          &nbsp;&nbsp;[Data Layer] PostgreSQL (Relational) + Redis (Session)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
          &nbsp;&nbsp;[Files] S3/R2 (Video Training & PDF Reports)
        </div>
        <p className="text-slate-600">
          The architecture utilizes a <b>Multi-tenant Partitioned Schema</b>. Each country (e.g., South Africa, Brazil, Vietnam) operates on its own schema instance to comply with local data residency and regulatory differences in refrigerant quotas.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-cyan-700 uppercase tracking-widest mb-4">Section 4 — Database Design (PostgreSQL)</h2>
        <pre className="bg-slate-100 p-6 rounded-lg text-xs overflow-x-auto text-slate-700">
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
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-cyan-700 uppercase tracking-widest mb-4">Section 7 — Sizing Logic</h2>
        <div className="bg-white border border-slate-200 p-6 rounded-xl">
          <p className="font-bold mb-2">Cooling Load Equation (kW):</p>
          <code className="block bg-slate-50 p-4 rounded text-cyan-700 font-bold mb-4">
            Q_total = (Q_walls + Q_air + Q_product + Q_internal) * SF
          </code>
          <ul className="text-sm space-y-2 text-slate-600">
            <li><b>Q_walls:</b> A × U × ΔT (Surface Area × Heat Transfer Coeff × Temp Diff)</li>
            <li><b>Q_air:</b> V × n × ρ × Δh (Volume × Changes × Density × Enthalpy Diff)</li>
            <li><b>Q_product:</b> (m × Cp × ΔT) / t (Mass × Specific Heat × Temp Pull-down / Time)</li>
            <li><b>SF:</b> 1.15 to 1.20 (Standard Safety Factor)</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Documentation;
