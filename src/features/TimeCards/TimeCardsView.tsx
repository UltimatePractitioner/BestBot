import React, { useState } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import { useCrew } from '../../context/CrewContext';
import { TimeCardsTable } from './components/TimeCardsTable';
import { WorkHistoryModal } from './components/WorkHistoryModal';
import { Clock, Search, Users } from 'lucide-react';
import { getWeekEnding } from '../../utils/dateUtils';
import type { CrewMember } from '../../types';
import { useTimeCard } from '../../context/TimeCardContext';
import { TimeCardArchive } from './components/TimeCardArchive';

export const TimeCardsView = () => {
    const { shootDays } = useSchedule();
    const { crew } = useCrew();
    const { getTimeCardsByDay } = useTimeCard();
    const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'crew_history'>('daily');
    const [selectedDayId, setSelectedDayId] = useState<string | null>(shootDays[0]?.id || null);

    // Sort shoot days by date
    const sortedDays = [...shootDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Selected Day Data
    const selectedDay = shootDays.find(d => d.id === selectedDayId);

    // Derived assignments
    const dayCards = selectedDayId ? getTimeCardsByDay(selectedDayId) : [];
    const assignedCrewIds = dayCards.map(tc => tc.crewMemberId);

    // If no assignments found, maybe show all crew? or let user assign in dashboard?
    // For now, let's respect the assignments. Use DayDashboardModal to assign.
    // But to avoid empty screen confusion, if empty, we might want to guide user.
    // However, sticking to strict persistence:
    const displayCrewIds = assignedCrewIds.length > 0 ? assignedCrewIds : [];

    // Crew History State
    const [historyMember, setHistoryMember] = useState<CrewMember | null>(null);
    const [crewSearch, setCrewSearch] = useState('');


    // Scroll to selected day on mount or change
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (selectedDayId && scrollContainerRef.current) {
            const activeBtn = scrollContainerRef.current.querySelector(`[data-day-id="${selectedDayId}"]`);
            if (activeBtn) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedDayId]);

    return (
        <div className="h-full flex flex-col bg-app text-primary">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-display uppercase tracking-wide">Time Cards & Payroll</h1>
                        <p className="text-sm text-secondary">Manage daily hours, exports, and work history.</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-black/20 p-1 rounded-lg border border-border-subtle">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'daily' ? 'bg-accent-primary text-black shadow-lg' : 'text-secondary hover:text-white'}`}
                    >
                        Daily Entry
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-accent-primary text-black shadow-lg' : 'text-secondary hover:text-white'}`}
                    >
                        Export Archive
                    </button>
                    <button
                        onClick={() => setActiveTab('crew_history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'crew_history' ? 'bg-accent-primary text-black shadow-lg' : 'text-secondary hover:text-white'}`}
                    >
                        Crew History
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-6 relative">

                {/* --- DAILY ENTRY TAB --- */}
                {activeTab === 'daily' && (
                    <div className="h-full flex gap-6 animate-fade-in-up overflow-hidden">
                        {/* LEFT SIDEBAR: Week/Day Selector */}
                        <div className="w-80 flex-shrink-0 flex flex-col bg-surface border border-border-subtle rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border-subtle bg-black/20">
                                <span className="text-sm font-bold text-secondary uppercase tracking-wider">Select Day</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent">
                                {(() => {
                                    // 1. Group by Source File (Schedule)
                                    const groupedBySchedule = sortedDays.reduce((acc, day) => {
                                        const key = day.sourceFile || 'Unassigned';
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(day);
                                        return acc;
                                    }, {} as Record<string, typeof sortedDays>);

                                    // 2. Sort Schedules (Newest First)
                                    const sortedSchedules = Object.entries(groupedBySchedule).sort(([, daysA], [, daysB]) => {
                                        const dateA = daysA[0]?.scheduleCreatedAt ? new Date(daysA[0].scheduleCreatedAt).getTime() : 0;
                                        const dateB = daysB[0]?.scheduleCreatedAt ? new Date(daysB[0].scheduleCreatedAt).getTime() : 0;
                                        return dateB - dateA;
                                    });

                                    return sortedSchedules.map(([sourceFile, scheduleDays]) => (
                                        <div key={sourceFile} className="mb-6">
                                            {/* Schedule Header */}
                                            <div className="flex items-center gap-2 px-2 mb-2 pb-1 border-b border-border-subtle">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0"></div>
                                                <h3 className="text-xs font-bold text-white uppercase tracking-widest truncate">{sourceFile}</h3>
                                            </div>

                                            {/* Week Grouping within Schedule */}
                                            {Object.entries(
                                                scheduleDays.reduce((acc, day) => {
                                                    const week = getWeekEnding(day.date);
                                                    if (!acc[week]) acc[week] = [];
                                                    acc[week].push(day);
                                                    return acc;
                                                }, {} as Record<string, typeof sortedDays>)
                                            ).map(([weekEnding, days]) => (
                                                <div key={weekEnding} className="flex flex-col gap-2 mb-4 pl-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="h-px w-2 bg-border-subtle"></div>
                                                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                                                            Week Ending {weekEnding}
                                                        </span>
                                                        <div className="h-px flex-1 bg-border-subtle"></div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        {days.map(day => (
                                                            <button
                                                                key={day.id}
                                                                onClick={() => setSelectedDayId(day.id)}
                                                                className={`
                                                                    relative flex flex-col items-start p-3 rounded-md border text-left transition-all group
                                                                    ${selectedDayId === day.id
                                                                        ? 'bg-accent-primary/10 border-accent-primary shadow-[0_0_10px_rgba(255,174,0,0.15)] ring-1 ring-accent-primary/50'
                                                                        : 'bg-black/20 border-border-subtle hover:border-accent-primary/50 hover:bg-white/5'}
                                                                `}
                                                            >
                                                                <div className="flex items-center justify-between w-full mb-1">
                                                                    <span className={`text-[10px] font-bold uppercase ${selectedDayId === day.id ? 'text-accent-primary' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                                    </span>
                                                                    <span className={`text-[10px] font-mono opacity-50 ${selectedDayId === day.id ? 'text-accent-primary' : 'text-zinc-500'}`}>
                                                                        Day {day.dayNumber}
                                                                    </span>
                                                                </div>
                                                                <span className={`text-xs font-mono ${selectedDayId === day.id ? 'text-white' : 'text-zinc-300'}`}>
                                                                    {day.date.substring(5)}
                                                                </span>

                                                                {/* Active Indicator */}
                                                                {selectedDayId === day.id && (
                                                                    <div className="absolute top-1/2 -right-1 w-1.5 h-6 bg-accent-primary rounded-l-full transform -translate-y-1/2"></div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ));
                                })()}
                                {sortedDays.length === 0 && (
                                    <div className="text-sm text-secondary italic text-center py-8">No shoot days scheduled.<br />Import a schedule first.</div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT CONTENT: Editor Area */}
                        {selectedDay ? (
                            <div className="flex-1 bg-surface border border-border-subtle rounded-lg shadow-inner overflow-hidden flex flex-col">
                                {displayCrewIds.length > 0 ? (
                                    <TimeCardsTable
                                        dayId={selectedDay.id}
                                        assignedCrewIds={displayCrewIds}
                                        dayDate={selectedDay.date}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-secondary">
                                        <Users size={48} className="mb-4 opacity-20" />
                                        <p>No crew assigned to this day.</p>
                                        <p className="text-xs mt-2">Use the Schedule Dashboard to assign crew.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-secondary bg-black/10 rounded-lg border border-border-subtle border-dashed">
                                <div className="text-center">
                                    <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Select a day from the sidebar</p>
                                    <p className="text-xs mt-2 opacity-50">View time cards and daily payroll</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- EXPORT HISTORY TAB --- */}
                {activeTab === 'history' && (
                    <div className="h-full animate-fade-in-up">
                        <TimeCardArchive />
                    </div>
                )}

                {/* --- CREW HISTORY TAB --- */}
                {activeTab === 'crew_history' && (
                    <div className="h-full flex flex-col gap-4 animate-fade-in-up">
                        {/* Search Bar */}
                        <div className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border-subtle">
                            <Search size={20} className="text-secondary" />
                            <input
                                type="text"
                                placeholder="Search crew in history..."
                                value={crewSearch}
                                onChange={(e) => setCrewSearch(e.target.value)}
                                className="bg-transparent border-none outline-none text-primary placeholder-text-muted flex-1"
                            />
                        </div>

                        {/* Weekly Work History List */}
                        <div className="flex-1 overflow-y-auto pb-10 space-y-6">
                            {Object.entries(
                                sortedDays.reduce((acc, day) => {
                                    const week = getWeekEnding(day.date);
                                    if (!acc[week]) acc[week] = [];
                                    acc[week].push(day);
                                    return acc;
                                }, {} as Record<string, typeof sortedDays>)
                            )
                                .sort((a, b) => new Date(b[0] === 'Unknown' ? '1900-01-01' : b[0]).getTime() - new Date(a[0] === 'Unknown' ? '1900-01-01' : a[0]).getTime()) // Newest weeks first
                                .map(([weekEnding, days]) => {
                                    const dayIds = days.map(d => d.id);
                                    // Get all timecards for these days
                                    const weekCards = dayIds.flatMap(id => getTimeCardsByDay(id));

                                    // Aggregate by Crew Member
                                    const crewSummary = weekCards.reduce((acc, card) => {
                                        if (!card.crewMemberId) return acc;
                                        if (!acc[card.crewMemberId]) {
                                            acc[card.crewMemberId] = { hours: 0, days: 0 };
                                        }

                                        let dailyHours = 0;
                                        if (card.call && card.wrap) {
                                            const call = parseFloat(card.call) || 0;
                                            const wrap = parseFloat(card.wrap) || 0;
                                            let t = wrap - call;
                                            const m1In = parseFloat(card.meal1In || '0') || 0;
                                            const m1Out = parseFloat(card.meal1Out || '0') || 0;
                                            const m2In = parseFloat(card.meal2In || '0') || 0;
                                            const m2Out = parseFloat(card.meal2Out || '0') || 0;

                                            if (m1In && m1Out) t -= (m1Out - m1In);
                                            if (m2In && m2Out) t -= (m2Out - m2In);
                                            dailyHours = t > 0 ? t : 0;
                                        }

                                        acc[card.crewMemberId].hours += dailyHours;
                                        acc[card.crewMemberId].days += 1;
                                        return acc;
                                    }, {} as Record<string, { hours: number, days: number }>);

                                    // Filter by search
                                    const activeCrewIds = Object.keys(crewSummary).filter(id => {
                                        const member = crew.find(c => c.id === id);
                                        return member && member.name.toLowerCase().includes(crewSearch.toLowerCase());
                                    });

                                    if (activeCrewIds.length === 0) return null;

                                    return (
                                        <div key={weekEnding} className="bg-surface border border-border-subtle rounded-lg overflow-hidden shadow-sm">
                                            {/* Week Header */}
                                            <div className="bg-black/20 p-3 border-b border-border-subtle flex justify-between items-center">
                                                <h3 className="font-bold text-accent-primary uppercase tracking-wider text-sm">
                                                    Week Ending: {weekEnding}
                                                </h3>
                                                <span className="text-xs text-secondary font-mono">
                                                    {days.length} Shoot Days • {activeCrewIds.length} Crew Active
                                                </span>
                                            </div>

                                            {/* Crew List for Week */}
                                            <div className="divide-y divide-border-subtle/50">
                                                {activeCrewIds.map(crewId => {
                                                    const member = crew.find(c => c.id === crewId);
                                                    const stats = crewSummary[crewId];
                                                    if (!member) return null;

                                                    return (
                                                        <div
                                                            key={crewId}
                                                            onClick={() => setHistoryMember(member)}
                                                            className="p-3 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/10">
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-primary group-hover:text-accent-primary transition-colors text-sm">
                                                                        {member.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-secondary uppercase tracking-wider">
                                                                        {member.role}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6">
                                                                <div className="text-right">
                                                                    <div className="text-[10px] text-secondary uppercase">Days</div>
                                                                    <div className="font-mono font-bold text-sm">{stats.days}</div>
                                                                </div>
                                                                <div className="text-right w-16">
                                                                    <div className="text-[10px] text-secondary uppercase">Hours</div>
                                                                    <div className="font-mono font-bold text-sm text-accent-primary">
                                                                        {stats.hours.toFixed(1)}
                                                                    </div>
                                                                </div>
                                                                <Users size={16} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Global History Modal */}
                {/* We reuse the same modal but maybe for "All Time" history logic? 
                    For now, reusing the mock weekly modal is fine as a placeholder for the UI. */}
                <WorkHistoryModal
                    isOpen={!!historyMember}
                    onClose={() => setHistoryMember(null)}
                    member={historyMember}
                    weekEnding={getWeekEnding(selectedDay ? selectedDay.date : new Date().toISOString())}
                />

            </div>
        </div>
    );
};
