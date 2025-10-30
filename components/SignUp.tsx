import React, { useState } from 'react';
import { SpinnerIcon, CandleChartIcon, UserIcon, LockIcon, MailIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface SignUpProps {
    onSwitchToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSwitchToLogin }) => {
    const { addToast } = useToast();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        setError(null);
        
        // Simulate API call for registration
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real application, you would call an API to register the user.
        // For this demo, we'll show a success message and switch to the login view.
        
        setIsLoading(false);
        addToast(`Welcome, ${username}! Please sign in to continue.`, 'success');
        onSwitchToLogin();
    };

    return (
        <div className="min-h-screen flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-[var(--surface-primary)] rounded-xl shadow-2xl border border-[var(--border-primary)] animate-fade-in-scale">
                <div className="flex flex-col items-center">
                    <CandleChartIcon className="h-12 w-12 text-[var(--accent-primary)]" />
                    <h2 className="mt-4 text-center text-3xl font-extrabold text-white">
                        Create your Account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="username-signup" className="sr-only">Username</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="username-signup"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2.5 border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-md"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email-signup" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email-signup"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2.5 border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-md"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password-signup" className="sr-only">Password</label>
                             <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password-signup"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2.5 border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-md"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="confirm-password-signup" className="sr-only">Confirm Password</label>
                             <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="confirm-password-signup"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2.5 border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-md"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-500/40"
                        >
                            {isLoading ? <SpinnerIcon className="h-5 w-5" /> : 'Sign up'}
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm text-slate-400 pt-4">
                    <p>
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none focus:underline"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
