import { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { useTimeCard } from '../../context/TimeCardContext';
import { useCrew } from '../../context/CrewContext';
import { ChevronRight, Clock, Users, ArrowLeft } from 'lucide-react';

export const MobileTimeCards = () => {
    const { shootDays } = useSchedule();
    const { getTimeCardsByDay } = useTimeCard();
    const { crew } = useCrew();
    const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

    // DEMO DATA
    const demoDays = shootDays.length > 0 ? shootDays : [
        { id: 'demo1', date: new Date().toISOString(), dayNumber: 1, location: 'Central Park', scenes: Array(3), callTime: '07:00' },
        { id: 'demo2', date: new Date(Date.now() + 86400000).toISOString(), dayNumber: 2, location: 'Stage 5', scenes: Array(5), callTime: '06:30' },
    ];
    const isDemo = shootDays.length === 0;

    // @ts-ignore
    const sortedDays = [...demoDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // @ts-ignore
    const selectedDay = demoDays.find(d => d.id === selectedDayId);

    // Render Day List
    if (!selectedDay) {
        return (
            <div className="p-4 space-y-4 animate-fade-in-up">
                <h2 className="text-xl font-display font-bold text-white mb-2">Time Cards</h2>

                {isDemo && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-2 rounded text-xs mb-4">
                        DEMO MODE: Showing example days.
                    </div>
                )}

                <p className="text-sm text-secondary mb-4">Select a day to view or edit hours.</p>

                <div className="space-y-3">
                    {sortedDays.map((day) => (
                        <button
                            key={day.id}
                            onClick={() => setSelectedDayId(day.id)}
                            className="w-full bg-surface border border-border-subtle rounded-lg p-4 flex items-center justify-between hover:bg-white/5 active:scale-[0.98] transition-all"
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold text-accent-primary uppercase mb-1">Day {day.dayNumber}</div>
                                <div className="text-sm font-medium text-white">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                            </div>
                            <ChevronRight size={20} className="text-secondary" />
                        </button>
                    ))}
                    {sortedDays.length === 0 && (
                        <div className="text-center p-8 text-secondary italic">No shoot days found.</div>
                    )}
                </div>
            </div>
        );
    }

    // Render Crew List for Selected Day
    const dayCards = getTimeCardsByDay(selectedDay.id);
    const assignedCrewIds = dayCards.map(tc => tc.crewMemberId);

    // Simple read-only view of hours for now
    return (
        <div className="p-4 h-full flex flex-col animate-fade-in-right">
            <button
                onClick={() => setSelectedDayId(null)}
                className="flex items-center gap-2 text-secondary hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft size={16} />
                <span className="text-sm font-mono">BACK TO DAYS</span>
            </button>

            <div className="mb-6">
                <h2 className="text-xl font-display font-bold text-white">Day {selectedDay.dayNumber}</h2>
                <p className="text-sm text-secondary">{new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            {assignedCrewIds.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-secondary border border-dashed border-border-subtle rounded-lg p-8">
                    <Users size={32} className="mb-4 opacity-50" />
                    <p>No crew assigned.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assignedCrewIds.map(crewId => {
                        const member = crew.find(c => c.id === crewId);
                        const card = dayCards.find(c => c.crewMemberId === crewId);
                        if (!member || !card) return null;

                        // const totalHours = (parseFloat(card.wrap || '0') - parseFloat(card.call || '0')).toFixed(1); // Very naive calc for display

                        return (
                            <div key={crewId} className="bg-surface border border-border-subtle rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-white text-sm">{member.name}</div>
                                    <div className="text-[10px] text-secondary uppercase">{member.role}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded">
                                        <Clock size={12} className="text-accent-primary" />
                                        <span className="text-xs font-mono font-bold text-white">
                                            {card.call || '--'} - {card.wrap || '--'}
                                        </span>
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
