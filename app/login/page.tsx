'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/auth';
import { Mail, Lock, LogIn, ChevronRight, User, MapPin } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [demoRole, setDemoRole] = useState('technician');
    const [demoRegion, setDemoRegion] = useState('Harare');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock login - accept anything
        setTimeout(() => {
            login('technician', 'Harare'); // Default to technician for regular login
            setLoading(false);
            router.push(next);
        }, 800);
    };

    const handleDemoAccess = () => {
        setLoading(true);
        setTimeout(() => {
            login(demoRole, demoRegion);
            setLoading(false);
            router.push(next);
        }, 800);
    };

    return (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                    <LogIn className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CoolPro Toolkit</h1>
                <p className="text-gray-500 mt-2">Sign in to your account</p>
            </div>

            {/* Regular Login */}
            <form onSubmit={handleLogin} className="space-y-5 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                            placeholder="user@coolpro.com"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </span>
                    ) : 'Sign In'}
                </button>
            </form>

            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Or try Demo Access</span>
                </div>
            </div>

            {/* Demo Access */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200/60">
                <div className="flex items-center mb-2">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    <h3 className="text-sm font-semibold text-gray-900">Demo Configuration</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Role</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                value={demoRole}
                                onChange={(e) => setDemoRole(e.target.value)}
                                className="block w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                            >
                                <option value="technician">Technician</option>
                                <option value="trainer">Trainer</option>
                                <option value="vendor">Vendor</option>
                                <option value="org_admin">Org Admin</option>
                                <option value="program_admin">Prog Admin</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Region</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <MapPin className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                value={demoRegion}
                                onChange={(e) => setDemoRegion(e.target.value)}
                                className="block w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                            >
                                <option value="Harare">Harare</option>
                                <option value="Bulawayo">Bulawayo</option>
                                <option value="Mutare">Mutare</option>
                                <option value="Gweru">Gweru</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleDemoAccess}
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2 px-4 border border-green-600 rounded-lg shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                    Enter Demo Mode
                    <ChevronRight className="ml-2 h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <Suspense fallback={<div className="text-gray-500 animate-pulse">Loading login...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
