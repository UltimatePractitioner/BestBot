
import React, { useState, useEffect } from 'react';
import { X, Key, Check, Trash2 } from 'lucide-react';
import { apiKeyStore } from '../../utils/apiKeyStore';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);
    const [activeKeySource, setActiveKeySource] = useState<'user' | 'env' | null>(null);

    useEffect(() => {
        if (isOpen) {
            const stored = apiKeyStore.get(user?.id);
            if (stored) {
                setApiKey(stored);
                setActiveKeySource('user');
            } else {
                // If no user key, check if env key exists (but don't show the env key value security)
                if (import.meta.env.VITE_GEMINI_API_KEY) {
                    setActiveKeySource('env');
                }
            }
        }
    }, [isOpen, user?.id]);

    if (!isOpen) return null;

    const handleSave = () => {
        apiKeyStore.set(apiKey, user?.id);
        setSaved(true);
        setActiveKeySource('user');
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    const handleClear = () => {
        apiKeyStore.clear(user?.id);
        setApiKey('');
        setSaved(false);
        setActiveKeySource(import.meta.env.VITE_GEMINI_API_KEY ? 'env' : null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-app-surface border border-accent-primary/20 rounded-lg shadow-2xl overflow-hidden glass-panel">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-black/40">
                    <div className="flex items-center gap-3">
                        <Key className="text-accent-primary" size={24} />
                        <h2 className="text-xl font-display font-bold tracking-wider text-primary">API SETTINGS</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-primary transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    <div className="bg-accent-primary/5 border border-accent-primary/20 p-4 rounded text-sm text-text-secondary leading-relaxed font-mono">
                        <p>This application uses generic AI models. To enable AI parsing, please provide your own <strong>Gemini API Key</strong>.</p>
                        <p className="mt-2 text-xs text-text-muted">Your key is stored securely in your browser's LocalStorage and is never sent to our servers.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono font-bold text-accent-primary uppercase">Gemini API Key</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full pl-4 pr-4 py-3 bg-black/40 border border-border-subtle rounded-sm text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none transition-all font-mono text-sm"
                            />
                        </div>

                        {activeKeySource === 'env' && !apiKey && (
                            <div className="flex items-center gap-2 text-xs text-green-500 mt-2 font-mono">
                                <Check size={12} />
                                <span>Using Default Development Key</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={!apiKey}
                            className="flex-1 py-3 bg-accent-primary text-black font-bold font-mono tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saved ? <Check size={18} /> : null}
                            {saved ? 'SAVED' : 'SAVE KEY'}
                        </button>

                        {apiKey && (
                            <button
                                onClick={handleClear}
                                className="p-3 border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Clear stored key"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>

                    <div className="text-center">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-text-muted hover:text-accent-primary underline cursor-pointer transition-colors font-mono">
                            Get a free Gemini API Key here
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
};
