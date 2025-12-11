import { useState } from 'react';
import { Users, Lightbulb, Layout, Clock, Package, Menu, Plus, Search, Activity, LogOut, X } from 'lucide-react';
import { ShootDaysView } from './features/ShootDays/ShootDaysView';
import { CrewProvider } from './context/CrewContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { GearProvider } from './context/GearContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CrewView } from './features/Crew/CrewView';
import { GearView } from './features/Gear/GearView';
import { LoginView } from './features/Auth/LoginView';
import { SignUpView } from './features/Auth/SignUpView';
import { CalendarView } from './features/Dashboard/CalendarView';

function AuthenticatedApp() {
  const { logout, user } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');

  // Mobile Sidebar State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Desktop Sidebar State (Expanded/Collapsed)
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);

  const modules = [
    { id: 'dashboard', name: 'DASHBOARD', icon: Activity },
    { id: 'gear', name: 'GEAR LISTS', icon: Package },
    { id: 'schedule', name: 'SHOOT SCHEDULE', icon: Clock },
    { id: 'crew', name: 'CREW LIST', icon: Users },
    { id: 'lighting', name: 'LIGHTING PLOT', icon: Lightbulb },
    { id: 'stage', name: 'STAGE PLOT', icon: Layout },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <CalendarView />;
      case 'schedule':
        return <ShootDaysView />;
      case 'crew':
        return <CrewView />;
      case 'gear':
        return <GearView />;
      default:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-3 text-text-muted group-focus-within:text-accent-primary transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="SEARCH_DATABASE..."
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-border-subtle text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50 transition-all font-mono text-sm"
                />
              </div>
              <button className="p-3 border border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-black transition-all duration-300">
                <Plus size={20} />
              </button>
            </div>
            <div className="glass-panel p-12 text-center border-dashed border-border-subtle">
              <p className="text-text-secondary font-mono text-sm">SELECT MODULE TO VIEW DATA</p>
            </div>
          </div>
        );
    }
  };

  const NavItem = ({ module, isActive, isExpanded }: { module: any, isActive: boolean, isExpanded: boolean }) => {
    const Icon = module.icon;
    return (
      <button
        onClick={() => {
          setActiveModule(module.id);
          setMobileMenuOpen(false); // Close on mobile navigation
        }}
        className={`w-full flex items-center gap-4 px-4 py-4 transition-all duration-300 group relative overflow-hidden ${isActive ? 'text-accent-primary' : 'text-text-secondary hover:text-primary'}`}
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
    <GearProvider>
      <CrewProvider>
        <ScheduleProvider>
          <div className="flex h-screen bg-app text-primary overflow-hidden selection:bg-accent-primary selection:text-black">

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}

            {/* Sidebar (Responsive) */}
            <div className={`
                fixed inset-y-0 left-0 z-50 bg-surface border-r border-border-subtle transition-all duration-300 transform
                ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full'}
                lg:relative lg:translate-x-0 
                ${desktopSidebarExpanded ? 'lg:w-72' : 'lg:w-20'}
                flex flex-col
            `}>
              <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-500 ${desktopSidebarExpanded || mobileMenuOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0'}`}>
                  <div className="w-8 h-8 bg-accent-primary flex items-center justify-center">
                    <span className="text-black font-bold font-display text-xl">B</span>
                  </div>
                  <span className="font-display font-bold text-xl tracking-wider text-white">BEST<span className="text-accent-primary">BOT</span></span>
                </div>

                {/* Mobile Close Button */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-text-secondary hover:text-white lg:hidden"
                >
                  <X size={20} />
                </button>

                {/* Desktop Toggle Button */}
                <button
                  onClick={() => setDesktopSidebarExpanded(!desktopSidebarExpanded)}
                  className="hidden lg:block p-2 text-text-secondary hover:text-accent-primary transition-colors"
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
                    isExpanded={desktopSidebarExpanded || mobileMenuOpen}
                  />
                ))}
              </nav>

              <div className="p-6 border-t border-border-subtle">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{user?.name?.charAt(0)}</span>
                  </div>
                  {(desktopSidebarExpanded || mobileMenuOpen) && (
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-primary truncate">{user?.name}</span>
                      <span className="text-[10px] text-accent-primary font-mono truncate">OPERATOR_ONLINE</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-4 px-2 py-2 text-text-secondary hover:text-red-500 transition-colors ${(!desktopSidebarExpanded && !mobileMenuOpen) && 'justify-center'}`}
                >
                  <LogOut size={18} />
                  {(desktopSidebarExpanded || mobileMenuOpen) && <span className="text-xs font-mono">TERMINATE_SESSION</span>}
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
              <div className="bg-surface/50 backdrop-blur-md border-b border-border-subtle px-4 md:px-8 py-4 md:py-6 flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center gap-4">
                  {/* Mobile Menu Trigger */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-white"
                  >
                    <Menu size={24} />
                  </button>

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
                  <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-primary tracking-wide">{user?.name}</span>
                    <span className="text-[10px] font-mono text-accent-primary">{user?.email}</span>
                  </div>
                  <div className="hidden md:block h-8 w-[1px] bg-border-subtle mx-2"></div>
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-accent-primary/30 bg-accent-primary/5 rounded-sm">
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono text-accent-primary">LIVE</span>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10">
                {renderContent()}
              </div>
            </div>
          </div>
        </ScheduleProvider>
      </CrewProvider>
    </GearProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<'login' | 'signup'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-accent-primary font-mono animate-pulse">INITIALIZING_SYSTEM...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (view === 'signup') {
      return <SignUpView onNavigateToLogin={() => setView('login')} />;
    }
    return <LoginView onNavigateToSignUp={() => setView('signup')} />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
