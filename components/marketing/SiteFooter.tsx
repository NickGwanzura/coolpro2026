'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Facebook, Linkedin, Mail } from 'lucide-react';

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="py-16 text-white" style={{ backgroundColor: '#1C1917' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <ShieldCheck className="h-8 w-8 text-white" />
              <span className="ml-3 text-xl font-bold">HEVACRAZ</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Advance the HVAC-R profession in Zimbabwe through education, certification, and advocacy.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/membership" className="text-gray-400 hover:text-white transition-colors">Membership</Link></li>
              <li><Link href="/training" className="text-gray-400 hover:text-white transition-colors">Training</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/for-businesses" className="text-gray-400 hover:text-white transition-colors">For Businesses</Link></li>
              <li><Link href="/for-suppliers" className="text-gray-400 hover:text-white transition-colors">For Suppliers</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="flex space-x-3 mb-4">
              <a href="#" className="p-2 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <span className="text-sm font-bold">WA</span>
              </a>
              <a href="#" className="p-2 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
            {subscribed ? (
              <p className="text-sm text-green-400">You're subscribed. We'll be in touch.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="px-4 py-2 text-gray-900 w-full focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 transition-colors text-white"
                  style={{ backgroundColor: '#D97706' }}
                >
                  <Mail className="h-5 w-5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-8 text-center text-gray-400 text-sm">
          <p>© 2024 HEVACRAZ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
