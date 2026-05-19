import React, { useState } from 'react';
import { UserSession } from '@/lib/auth';
import { X, UserCircle, Mail, MapPin, ShieldCheck, KeyRound, Save, LogOut } from 'lucide-react';

interface UserProfileModalProps {
  user: UserSession | null;
  onClose: () => void;
  onLogout: () => void;
}

export function UserProfileModal({ user, onClose, onLogout }: UserProfileModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      return;
    }
    // Mock password reset logic
    setMessage('Password reset successfully.');
    setTimeout(() => setMessage(''), 3000);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border border-[#E7E5E4] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between bg-[#1C1917] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Profile Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full border-2 border-gray-200">
              <UserCircle className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{user.name}</p>
              <p className="text-sm font-medium text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded text-blue-600">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Email Address</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-amber-50 rounded text-amber-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Region / Province</p>
                <p className="text-sm font-medium text-gray-900">{user.region || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 rounded text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Account Status</p>
                <p className="text-sm font-medium text-emerald-700">Active & Verified</p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-gray-500" />
              Reset Password
            </h3>
            {message && (
              <p className={`text-xs font-semibold ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              Update Password
            </button>
          </form>

          <div className="mt-8 flex items-center justify-end border-t border-gray-100 pt-6">
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition-colors border border-red-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
