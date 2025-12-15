import React, { useState } from 'react';
import { Menu, LogOut, Settings } from 'lucide-react';
import { ProjectSwitcher } from '../../features/Projects/ProjectSwitcher';
import { SettingsModal } from '../../features/Settings/SettingsModal';
import { useAuth } from '../../context/AuthContext';

interface DesktopLayoutProps {
    children: React.ReactNode;
    activeModule: string;
    setActiveModule: (id: string) => void;
    modules: any[];
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
    children,
    activeModule,
    setActiveModule,
    modules
}) => {
    const { logout, user } = useAuth();
    const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // We don't really need mobileMenuOpen here if this is purely Desktop, 
    // but the original code had responsive logic mixed.
    // We will strip the mobile-only parts (hamburger menu) since MobileLayout will handle small screens.

    const NavItem = ({ module, isActive, isExpanded }: { module: any, isActive: boolean, isExpanded: boolean }) => {
        const Icon = module.icon;
        return (
            <button
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 transition-all duration-300 group relative overflow-hidden ${isActive ? 'text-accent-primary' : 'text-secondary hover:text-primary'}`}
            >
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary shadow-[0_0_10px_rgba(255,174,0,0.5)]"></div>
                )}
                {isActive && (
                    <div className="absolute inset-0 bg-accent-primary/5"></div>
                )}

                <Icon size={20} className={`relative z-10 ${isActive ? 'text-accent-primary' : 'group-hover:text-primary'}`} />

                <span className={`relative z-10 text-sm font-mono tracking-wider transition-all duration-300 ${!isExpanded ? 'lg:hidden' : ''} ${isActive ? 'font-bold' : 'font-normal'}`}>
                    {module.name}
                </span>
            </button>
        )
    };

    return (
        <div className="flex h-[100dvh] bg-app text-primary overflow-hidden selection:bg-accent-primary selection:text-black">
            {/* Sidebar */}
            <div
                className={`
                  relative z-50 bg-surface border-r border-border-subtle transition-all duration-300 flex flex-col
                  ${desktopSidebarExpanded ? 'w-72' : 'w-20'}
                `}
            >
                <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                    <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-500 ${desktopSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'} `}>
                        <div className="w-8 h-8 bg-accent-primary flex items-center justify-center">
                            <span className="text-black font-bold font-display text-xl">B</span>
                        </div>
                        <span className="font-display font-bold text-xl tracking-wider text-white">BEST<span className="text-accent-primary">BOT</span></span>
                    </div>

                    <button
                        onClick={() => setDesktopSidebarExpanded(!desktopSidebarExpanded)}
                        className="hidden lg:block p-2 text-text-secondary hover:text-accent-primary transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    {/* Fallback for smaller screens if this layout is used there accidentally, though MobileLayout should take over */}
                    <button
                        onClick={() => setDesktopSidebarExpanded(!desktopSidebarExpanded)}
                        className="lg:hidden p-2 text-text-secondary hover:text-accent-primary transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {modules.map((module) => (
                        <NavItem
                            key={module.id}
                            module={module}
                            isActive={activeModule === module.id}
                            isExpanded={desktopSidebarExpanded}
                        />
                    ))}
                </nav>

                <div className="p-6 border-t border-border-subtle">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{user?.name?.charAt(0)}</span>
                        </div>
                        {desktopSidebarExpanded && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-primary truncate">{user?.name}</span>
                                <span className="text-[10px] text-accent-primary font-mono truncate">OPERATOR_ONLINE</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-4 px-2 py-2 text-secondary hover:text-red-500 transition-colors ${!desktopSidebarExpanded && 'justify-center'} `}
                    >
                        <LogOut size={18} />
                        {desktopSidebarExpanded && <span className="text-xs font-mono">TERMINATE_SESSION</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative w-full">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}>
                </div>

                {/* Header */}
                <div className="bg-surface/50 backdrop-blur-md border-b border-border-subtle px-4 md:px-8 py-4 md:py-6 flex items-center justify-between z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="hidden md:flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-accent-primary px-1 border border-accent-primary/30 rounded-sm">SYS.V.2.0</span>
                                <span className="text-[10px] font-mono text-text-muted">/// SECURE CONNECTION</span>
                            </div>
                            <h1 className="text-xl md:text-3xl font-display font-bold text-white tracking-tight uppercase truncate">
                                {modules.find(m => m.id === activeModule)?.name}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ProjectSwitcher />
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-primary tracking-wide">{user?.name}</span>
                            <span className="text-[10px] font-mono text-accent-primary">{user?.email}</span>
                        </div>
                        <div className="hidden md:block h-8 w-[1px] bg-border-subtle mx-2"></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 border border-accent-primary/30 bg-accent-primary/5 rounded-sm">
                            <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-accent-primary">LIVE</span>
                        </div>

                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="ml-2 p-2 text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-full transition-all"
                            title="Settings / API Key"
                        >
                            <Settings size={20} />
                        </button>

                        <button
                            onClick={logout}
                            className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                            title="Terminate Session"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10">
                    {children}
                </div>

                <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
            </div>
        </div>
    );
};
