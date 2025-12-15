import { Suspense, lazy, useState } from 'react';
import { Users, Lightbulb, Clock, Package, FileText, Activity, Plus, Search } from 'lucide-react';
import { CrewProvider } from './context/CrewContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { GearProvider } from './context/GearContext';
import { TimeCardProvider } from './context/TimeCardContext';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './features/Auth/LoginView';
import { SignUpView } from './features/Auth/SignUpView';

// Layouts
import { DesktopLayout } from './components/Layout/DesktopLayout';
import { MobileLayout } from './components/Layout/MobileLayout';
import { useIsMobile } from './hooks/useIsMobile';

// Mobile Views
import { MobileDashboard } from './features/Dashboard/MobileDashboard';
import { MobileTimeCards } from './features/TimeCards/MobileTimeCards';

// Lazy load feature modules
const ShootDaysView = lazy(() => import('./features/ShootDays/ShootDaysView').then(module => ({ default: module.ShootDaysView })));
const CrewView = lazy(() => import('./features/Crew/CrewView').then(module => ({ default: module.CrewView })));
const GearView = lazy(() => import('./features/Gear/GearView').then(module => ({ default: module.GearView })));
const CalendarView = lazy(() => import('./features/Dashboard/CalendarView').then(module => ({ default: module.CalendarView })));
const TimeCardsView = lazy(() => import('./features/TimeCards/TimeCardsView').then(module => ({ default: module.TimeCardsView })));

function AuthenticatedApp() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const isMobile = useIsMobile();

  const modules = [
    { id: 'dashboard', name: 'DASHBOARD', icon: Activity },
    { id: 'gear', name: 'GEAR LISTS', icon: Package },
    { id: 'schedule', name: 'SHOOT SCHEDULE', icon: Clock },
    { id: 'crew', name: 'CREW LIST', icon: Users },
    { id: 'lighting', name: 'LIGHTING PLOT', icon: Lightbulb },
    { id: 'timecards', name: 'TIME CARDS', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return isMobile ? <MobileDashboard /> : <CalendarView />;
      case 'schedule':
        // Reuse Schedule for now, might need mobile version later
        // Stripboard might be hard on mobile, but let's leave it for now or show basic list
        return <ShootDaysView />;
      case 'crew':
        return <CrewView />;
      case 'gear':
        return <GearView />;
      case 'timecards':
        return isMobile ? <MobileTimeCards /> : <TimeCardsView />;
      default:
        // Desktop default view for empty state, simplified for mobile?
        if (isMobile) return <MobileDashboard />;

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

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <ProjectProvider>
      <GearProvider>
        <CrewProvider>
          <ScheduleProvider>
            <TimeCardProvider>
              <Layout
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                modules={modules}
              >
                <Suspense fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-accent-primary font-mono animate-pulse">LOADING_MODULE...</div>
                  </div>
                }>
                  {renderContent()}
                </Suspense>
              </Layout>
            </TimeCardProvider>
          </ScheduleProvider>
        </CrewProvider>
      </GearProvider>
    </ProjectProvider>
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

