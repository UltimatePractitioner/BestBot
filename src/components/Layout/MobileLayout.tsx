import React, { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { ProjectSwitcher } from '../../features/Projects/ProjectSwitcher';
import { SettingsModal } from '../../features/Settings/SettingsModal';
import { useAuth } from '../../context/AuthContext';

interface MobileLayoutProps {
    children: React.ReactNode;
    activeModule: string;
    setActiveModule: (id: string) => void;
    modules: any[];
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
    children,
    activeModule,
    setActiveModule,
    modules
}) => {
    const { logout } = useAuth();
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Filter modules for mobile if needed, or use all.
    // We typically want 4-5 max for bottom bar.
    // Current list: Dashboard, Gear, Schedule, Crew, Lighting, TimeCards (6 items)
    // Lighting might be too complex for mobile? Let's check.
    // For now, we'll try to fit them or maybe scroll the nav?
    // Let's scroll the nav if too many.

    // Better: prioritize top 5.
    // Dashboard, Schedule, TimeCards, Crew, Gear.
    // Lighting Plot is likely not mobile friendly.
    const mobileModules = modules.filter(m => m.id !== 'lighting');

    return (
        <div className="flex flex-col h-[100dvh] bg-app text-primary overflow-hidden">

            {/* Mobile Header */}
            <div className="bg-surface/90 backdrop-blur-md border-b border-border-subtle p-4 flex items-center justify-between z-30 sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent-primary flex items-center justify-center rounded-sm">
                        <span className="text-black font-bold font-display text-lg">B</span>
                    </div>
                    {/* Project Switcher Compact? */}
                    <div className="max-w-[150px]">
                        <ProjectSwitcher />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 text-text-muted hover:text-white"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={logout}
                        className="p-2 text-text-muted hover:text-red-500"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-app relative pb-20">
                {/* Padding bottom 20 to account for nav bar overlap if fixed or just spacing */}
                {children}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-surface/90 backdrop-blur-lg border-t border-border-subtle pb-safe pt-2 px-2 flex justify-around items-center z-40 shrink-0">
                {mobileModules.map((module) => {
                    const Icon = module.icon;
                    const isActive = activeModule === module.id;
                    return (
                        <button
                            key={module.id}
                            onClick={() => setActiveModule(module.id)}
                            className={`flex flex-col items-center justify-center p-2 w-full transition-all ${isActive ? 'text-accent-primary' : 'text-secondary opacity-70'}`}
                        >
                            <div className={`p-1.5 rounded-full mb-1 transition-all ${isActive ? 'bg-accent-primary/10 scale-110' : ''}`}>
                                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                            </div>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wide">
                                {module.name.split(' ')[0]} {/* Shorten name (e.g., SHOOT SCHEDULE -> SHOOT) */}
                            </span>
                        </button>
                    );
                })}
            </div>

            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};
