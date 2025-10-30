import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SpinnerIcon, CandleChartIcon, UserIcon, LockIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

const motivationalQuotes = [
  { quote: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { quote: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { quote: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott" },
  { quote: "The four most dangerous words in investing are: 'This time it's different.'", author: "Sir John Templeton" }
];

interface LoginProps {
    onSwitchToSignUp: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToSignUp }) => {
    const { login } = useAuth();
    const [username, setUsername] = useState('trader');
    const [password, setPassword] = useState('password');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const randomQuote = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        return motivationalQuotes[randomIndex];
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || "Failed to log in.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-[var(--surface-primary)] rounded-xl shadow-2xl border border-[var(--border-primary)]">
                <div className="flex flex-col items-center">
                    <CandleChartIcon className="h-12 w-12 text-[var(--accent-primary)]" />
                    <h2 className="mt-4 text-center text-3xl font-extrabold text-white">
                        Sign in to your Journal
                    </h2>
                    <div className="mt-6 w-full p-4 border-l-4 border-slate-600 bg-slate-800/50">
                      <p className="text-sm italic text-slate-400">"{randomQuote.quote}"</p>
                      <p className="text-xs text-slate-500 mt-2 text-right">- {randomQuote.author}</p>
                    </div>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="username"
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
                            <label htmlFor="password" className="sr-only">Password</label>
                             <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2.5 border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-md"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}
                    
                     <div className="text-center text-sm text-slate-400 pt-2">
                        <p>Use <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded">trader</span> / <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded">password</span> to sign in.</p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-500/40"
                        >
                            {isLoading ? <SpinnerIcon className="h-5 w-5" /> : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm text-slate-400 pt-4">
                    <p>
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignUp}
                            className="font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none focus:underline"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};