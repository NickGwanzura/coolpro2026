'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle, Facebook, Linkedin } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      <div className="pt-28 pb-16" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#D97706] text-xs font-semibold tracking-widest uppercase mb-3">Get in touch</p>
          <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: '#1C1917' }}>Contact HEVACRAZ</h1>
          <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
            Membership enquiries, supplier onboarding, training bookings, compliance questions we typically reply within one working day.
          </p>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Contact details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 border" style={{ borderColor: '#E5E0DB' }}>
                <div className="flex items-start gap-3">
                  <div className="p-2" style={{ backgroundColor: 'rgba(217,119,6,0.1)', color: '#D97706' }}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1C1917' }}>Head office</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      12 Samora Machel Avenue<br />
                      Harare, Zimbabwe
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border" style={{ borderColor: '#E5E0DB' }}>
                <div className="flex items-start gap-3">
                  <div className="p-2" style={{ backgroundColor: 'rgba(90,125,90,0.1)', color: '#5A7D5A' }}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1C1917' }}>Email</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <a href="mailto:info@hevacraz.co.zw" className="hover:underline">info@hevacraz.co.zw</a>
                    </p>
                    <p className="text-sm text-gray-600">
                      <a href="mailto:compliance@hevacraz.co.zw" className="hover:underline">compliance@hevacraz.co.zw</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border" style={{ borderColor: '#E5E0DB' }}>
                <div className="flex items-start gap-3">
                  <div className="p-2" style={{ backgroundColor: 'rgba(28,25,23,0.08)', color: '#1C1917' }}>
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1C1917' }}>Phone</h3>
                    <p className="text-sm text-gray-600 mt-1">+263 242 000 000</p>
                    <p className="text-xs text-gray-400 mt-1">Mon-Fri · 08:00-17:00 CAT</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border" style={{ borderColor: '#E5E0DB' }}>
                <h3 className="font-semibold mb-3" style={{ color: '#1C1917' }}>Follow us</h3>
                <div className="flex gap-3">
                  <a href="#" className="p-2 transition-colors" style={{ backgroundColor: '#FAFAF9', color: '#1C1917' }} aria-label="Facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="#" className="p-2 transition-colors text-sm font-bold" style={{ backgroundColor: '#FAFAF9', color: '#1C1917' }} aria-label="WhatsApp">
                    WA
                  </a>
                  <a href="#" className="p-2 transition-colors" style={{ backgroundColor: '#FAFAF9', color: '#1C1917' }} aria-label="LinkedIn">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="p-8 border" style={{ backgroundColor: 'white', borderColor: '#E5E0DB' }}>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-3 mb-4" style={{ backgroundColor: 'rgba(90,125,90,0.1)' }}>
                      <CheckCircle className="h-10 w-10" style={{ color: '#5A7D5A' }} />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: '#1C1917' }}>Message received</h2>
                    <p className="mt-3 text-gray-600 max-w-md mx-auto">
                      Thanks {form.name || 'for reaching out'}. A member of the HEVACRAZ team will respond to <strong>{form.email}</strong> within one working day.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="mt-6 text-sm font-semibold"
                      style={{ color: '#D97706' }}
                    >
                      Send another message →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-2xl font-bold mb-6" style={{ color: '#1C1917' }}>Send us a message</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1C1917' }}>Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
                          style={{ borderColor: '#E5E0DB' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1C1917' }}>Email</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
                          style={{ borderColor: '#E5E0DB' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#1C1917' }}>Subject</label>
                      <select
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent bg-white"
                        style={{ borderColor: '#E5E0DB' }}
                      >
                        <option value="">Select a topic</option>
                        <option value="membership">Membership enquiry</option>
                        <option value="supplier">Supplier onboarding</option>
                        <option value="training">Training booking</option>
                        <option value="compliance">Compliance / NOU</option>
                        <option value="enterprise">Enterprise sales</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#1C1917' }}>Message</label>
                      <textarea
                        required
                        rows={6}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
                        style={{ borderColor: '#E5E0DB' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition-colors"
                      style={{ backgroundColor: '#D97706' }}
                    >
                      Send message
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter strip */}
      <section className="py-16 text-white" style={{ backgroundColor: '#1C1917' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Stay in the loop</h2>
          <p className="mt-3 text-gray-300">Monthly updates on certification changes, training dates, and NOU compliance news.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 font-semibold text-white"
              style={{ backgroundColor: '#D97706' }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
