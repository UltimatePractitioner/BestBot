import React from 'react';
import { Calendar, Package, Users, Clock, LayoutDashboard } from 'lucide-react';
import './AppShell.css';

export type TabId = 'shoot-days' | 'packages' | 'manpower' | 'time-cards';

interface AppShellProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ activeTab, onTabChange, children }) => {
    const navItems = [
        { id: 'shoot-days', label: 'Shoot Days', icon: Calendar },
        { id: 'packages', label: 'Packages', icon: Package },
        { id: 'manpower', label: 'Manpower', icon: Users },
        { id: 'time-cards', label: 'Time Cards', icon: Clock },
    ] as const;

    return (
        <div className="app-shell">
            {/* Top Navigation Bar */}
            <header className="app-header">
                <div className="header-content">
                    <div className="brand-section">
                        <div className="brand-icon">
                            <LayoutDashboard size={24} />
                        </div>
                        <span className="brand-name">Best Boy</span>
                    </div>

                    <nav className="nav-section">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`nav-btn ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="user-section">
                        <div className="user-avatar">
                            KP
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};
