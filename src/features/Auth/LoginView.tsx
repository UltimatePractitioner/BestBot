import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

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
                // If success, auth state change will handle navigation/state update
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
        <div className="min-h-screen flex items-center justify-center bg-app relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>

            <div className="w-full max-w-md p-8 relative z-10 animate-fade-in-up">
                <div className="glass-panel p-8 border-t-4 border-t-accent-primary">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-primary/30">
                            <Lock className="text-accent-primary" size={32} />
                        </div>
                        <h1 className="font-display font-bold text-3xl text-primary tracking-wide mb-2">SYSTEM_ACCESS</h1>
                        <p className="text-text-muted font-mono text-xs tracking-widest">AUTHENTICATION_REQUIRED</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm font-mono text-xs flex items-center gap-2">
                                <AlertCircle size={14} />
                                <span>ERROR: {error}</span>
                            </div>
                        )}

                        <div className="space-y-2 group">
                            <label className="text-xs font-mono text-text-secondary group-focus-within:text-accent-primary transition-colors">OPERATOR_ID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-border-subtle text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50 transition-all font-mono text-sm rounded-sm"
                                    placeholder="ENTER_EMAIL"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-mono text-text-secondary group-focus-within:text-accent-primary transition-colors">ACCESS_CODE</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-border-subtle text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50 transition-all font-mono text-sm rounded-sm"
                                    placeholder="ENTER_PASSWORD"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-accent-primary text-black font-bold font-display tracking-wide hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-sm"
                        >
                            {isLoading ? (
                                <span className="font-mono animate-pulse">VERIFYING...</span>
                            ) : (
                                <>
                                    <span>INITIATE_SESSION</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={onNavigateToSignUp}
                            className="text-xs font-mono text-text-muted hover:text-accent-primary transition-colors border-b border-transparent hover:border-accent-primary pb-0.5"
                        >
                            REQUEST_NEW_CLEARANCE // SIGN_UP
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-mono text-text-muted opacity-50">
                        SECURE_TERMINAL_V.2.0 // AUTHORIZED_PERSONNEL_ONLY
                    </p>
                </div>
            </div>
        </div>
    );
};
