import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Calendar as CalendarIcon } from 'lucide-react';
import { useSchedule } from '../../context/ScheduleContext';


export const CalendarView: React.FC = () => {
    const { shootDays } = useSchedule();
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }, [currentDate]);

    const firstDayOfMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month, 1).getDay();
    }, [currentDate]);

    const monthName = useMemo(() => {
        return currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();
    }, [currentDate]);

    const year = currentDate.getFullYear();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getShootDayForDate = (day: number) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
        // Simple matching - in a real app might need more robust date comparison
        // Assuming shootDays have a 'date' field in YYYY-MM-DD format or similar ISO string
        return shootDays.find(s => s.date.startsWith(dateStr));
    };

    const renderCalendarDays = () => {
        const days = [];

        // Empty cells for previous month (Desktop only)
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(
                <div key={`empty-${i}`} className="hidden md:block min-h-[120px] bg-black/20 border border-border-subtle/30 opacity-50"></div>
            );
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const shootDay = getShootDayForDate(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            days.push(
                <div
                    key={day}
                    className={`min-h-[80px] md:min-h-[120px] p-3 md:p-1.5 lg:p-3 border border-border-subtle/50 relative group transition-all duration-300 hover:bg-white/5 flex flex-row md:flex-col gap-4 md:gap-0 items-center md:items-stretch ${isToday ? 'bg-accent-primary/5 border-accent-primary/30' : 'bg-black/40'
                        }`}
                >
                    <div className="flex md:flex-row md:justify-between items-center md:items-start mb-0 md:mb-2 shrink-0 md:w-auto w-12 justify-center flex-col">
                        <span className="text-[10px] md:hidden font-mono text-text-muted mb-1">
                            {new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                        </span>
                        <span className={`font-mono text-lg md:text-sm ${isToday ? 'text-accent-primary font-bold' : 'text-text-secondary'}`}>
                            {day.toString().padStart(2, '0')}
                        </span>
                        {shootDay && (
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(255,174,0,0.6)] mt-1 md:mt-0"></div>
                        )}
                    </div>

                    {shootDay ? (
                        <div className="space-y-2 animate-fade-in-up">
                            <div className="flex items-start gap-1.5">
                                <MapPin size={12} className="text-accent-primary mt-0.5 shrink-0" />
                                <span className="text-[10px] font-mono text-primary leading-tight line-clamp-2">
                                    {shootDay.location || "LOCATION_PENDING"}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-text-muted shrink-0" />
                                    <span className="text-[10px] font-mono text-text-secondary">
                                        {shootDay.callTime || "TBD"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Users size={12} className="text-text-muted shrink-0" />
                                    <span className="text-[10px] font-mono text-text-secondary">
                                        {/* Mock crew count for now as requested */}
                                        {Math.floor(Math.random() * 15) + 5}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity">
                            <span className="text-[10px] font-mono text-text-muted">NO_SHOOT</span>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="animate-fade-in-up">
            {/* Calendar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 glass-panel p-4 md:p-3 lg:p-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-2 bg-accent-primary/10 rounded-sm border border-accent-primary/20 shrink-0">
                        <CalendarIcon className="text-accent-primary" size={20} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-wide truncate">{monthName} <span className="text-text-muted font-normal">{year}</span></h2>
                        <p className="text-[10px] font-mono text-accent-primary tracking-widest truncate">PRODUCTION_SCHEDULE // MASTER_VIEW</p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 w-full md:w-auto">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-white/10 rounded-sm transition-colors border border-transparent hover:border-border-subtle text-text-secondary hover:text-primary"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 text-xs font-mono border border-border-subtle hover:border-accent-primary/50 hover:text-accent-primary transition-colors rounded-sm"
                    >
                        TODAY
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-white/10 rounded-sm transition-colors border border-transparent hover:border-border-subtle text-text-secondary hover:text-primary"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="hidden md:grid grid-cols-7 gap-px mb-px bg-border-subtle/30 border border-border-subtle/30 rounded-t-sm overflow-hidden">
                {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(day => (
                    <div key={day} className="py-2 text-center bg-black/40">
                        <span className="text-[10px] font-mono font-bold text-text-muted tracking-widest">{day.substring(0, 3)}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-border-subtle/30 border border-border-subtle/30 rounded-b-sm overflow-hidden shadow-2xl">
                {renderCalendarDays()}
            </div>
        </div>
    );
};
