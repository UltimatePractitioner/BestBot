import React from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { MapPin, Calendar, Film } from 'lucide-react';

export const MobileDashboard = () => {
    const { shootDays } = useSchedule();

    // DEMO DATA for verification if empty
    const demoDays = shootDays.length > 0 ? shootDays : [
        { id: 'demo1', date: new Date().toISOString(), dayNumber: 1, location: 'Central Park', scenes: Array(3), callTime: '07:00' },
        { id: 'demo2', date: new Date(Date.now() + 86400000).toISOString(), dayNumber: 2, location: 'Stage 5', scenes: Array(5), callTime: '06:30' },
    ];

    const isDemo = shootDays.length === 0;

    // Sort days by date
    // @ts-ignore - Demo data might not have full type match but sufficient for display
    const sortedDays = [...demoDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter for today or future? Or just show all?
    // Let's show all for now, scrolling to today if possible (logic excluded for MVC).

    return (
        <div className="p-4 space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-display font-bold text-white mb-4">Upcoming Shoots</h2>

            {isDemo && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-2 rounded text-xs mb-4">
                    DEMO MODE: No schedule imported yet. Showing example data.
                </div>
            )}

            {sortedDays.length === 0 ? (
                <div className="text-center p-8 text-secondary border border-dashed border-border-subtle rounded-lg">
                    No shoot days scheduled.
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedDays.map((day) => {
                        const isToday = new Date().toDateString() === new Date(day.date).toDateString();

                        return (
                            <div
                                key={day.id}
                                className={`bg-surface border rounded-lg p-4 shadow-sm flex flex-col gap-2 ${isToday ? 'border-accent-primary ring-1 ring-accent-primary/20' : 'border-border-subtle'}`}
                            >
                                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`text-xs font-bold px-2 py-0.5 rounded ${isToday ? 'bg-accent-primary text-black' : 'bg-white/10 text-secondary'}`}>
                                            DAY {day.dayNumber}
                                        </div>
                                        {isToday && <span className="text-[10px] font-mono text-accent-primary animate-pulse">TODAY</span>}
                                    </div>
                                    <span className="text-xs font-mono text-secondary">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                <div className="flex items-start gap-2 text-sm font-medium text-white">
                                    <MapPin size={16} className="text-accent-primary mt-0.5 shrink-0" />
                                    <span>{day.location || "Location TBD"}</span>
                                </div>

                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-secondary">
                                        <Film size={14} />
                                        <span>{day.scenes?.length || 0} Scenes</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-secondary">
                                        <Calendar size={14} />
                                        <span>{day.callTime || "TBD"}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
