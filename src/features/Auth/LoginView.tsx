import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Aperture, User, Lock, AlertCircle } from 'lucide-react';

interface LoginViewProps {
    onNavigateToSignUp: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigateToSignUp }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (email && password) {
                const { error: authError } = await login(email, password);
                if (authError) {
                    setError(authError.toUpperCase().replace(/ /g, '_'));
                    setIsLoading(false);
                }
            } else {
                setError('INVALID_CREDENTIALS');
                setIsLoading(false);
            }
        } catch (err) {
            setError('LOGIN_FAILED');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden text-zinc-100 font-mono">
            {/* Dark Tech Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(#27272a 1px, transparent 1px), linear-gradient(90deg, #27272a 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 p-6">
                {/* Main Card */}
                <div className="bg-[#121212] border border-zinc-800 rounded-xl p-8 shadow-2xl relative overflow-hidden group">
                    {/* Industrial Corners */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-zinc-700/50 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-zinc-700/50 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-zinc-700/50 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-zinc-700/50 rounded-br-xl"></div>

                    {/* Logo Section */}
                    <div className="text-center mb-10 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-zinc-600 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <Aperture className="text-zinc-300" size={40} strokeWidth={1.5} />
                        </div>
                        <h1 className="font-display font-bold text-3xl text-white tracking-wide mb-1 drop-shadow-md">BestBot</h1>
                        <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase">Show Management System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-900/20 border border-red-900/40 text-red-400 p-3 rounded-md text-xs flex items-center gap-2">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider ml-1">Name</label>
                            <div className="relative group/input">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-zinc-300 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-[#050505] border border-zinc-800 text-zinc-300 placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500/50 transition-all text-sm rounded-lg"
                                    placeholder="john.doe@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-zinc-300 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-[#050505] border border-zinc-800 text-zinc-300 placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500/50 transition-all text-sm rounded-lg"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 mt-4 bg-gradient-to-b from-zinc-700 to-zinc-800 border border-zinc-600 hover:from-zinc-600 hover:to-zinc-700 text-white font-bold tracking-wider rounded-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">VERIFYING...</span>
                            ) : (
                                <span>Login</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={onNavigateToSignUp}
                            className="text-xs text-zinc-600 hover:text-white transition-colors"
                        >
                            REQUEST ACCESS
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-zinc-700 font-mono">
                        SECURE_TERMINAL_V.2.0
                    </p>
                </div>
            </div>
        </div>
    );
};
