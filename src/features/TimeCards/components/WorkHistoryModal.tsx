
import { X } from 'lucide-react';
import type { CrewMember } from '../../../types';
import { useTimeCard } from '../../../context/TimeCardContext';
import { useSchedule } from '../../../context/ScheduleContext';


export const WorkHistoryModal = ({ isOpen, onClose, member, weekEnding }: { isOpen: boolean, onClose: () => void, member: CrewMember | null, weekEnding: string }) => {
    const { timeCards } = useTimeCard();
    const { shootDays } = useSchedule();

    if (!isOpen || !member) return null;

    // Filter time cards for this member
    const memberCards = timeCards.filter(tc => tc.crewMemberId === member.id);

    // Join with Shoot Day data to get dates
    const historyData = memberCards.map(card => {
        const day = shootDays.find(d => d.id === card.shootDayId);

        // Calculate total hours
        let total = '0.0';
        if (card.call && card.wrap) {
            const call = parseFloat(card.call) || 0;
            const wrap = parseFloat(card.wrap) || 0;
            // Simple calculation for now matching table logic
            // Would be better to abstract total calc into a utility
            let t = wrap - call;
            const m1In = parseFloat(card.meal1In || '0') || 0;
            const m1Out = parseFloat(card.meal1Out || '0') || 0;
            const m2In = parseFloat(card.meal2In || '0') || 0;
            const m2Out = parseFloat(card.meal2Out || '0') || 0;

            if (m1In && m1Out) t -= (m1Out - m1In);
            if (m2In && m2Out) t -= (m2Out - m2In);

            total = t > 0 ? t.toFixed(1) : '0.0';
        }

        return {
            date: day ? day.date : 'Unknown',
            day: day ? `Day ${day.dayNumber}` : 'Unknown', // Or actual Day of Week
            dayOfWeek: day ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }) : '',
            call: card.call || '-',
            wrap: card.wrap || '-',
            total
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalWeeklyHours = historyData.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(1);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface border border-border-subtle rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-app/50">
                    <div>
                        <h3 className="text-lg font-bold text-primary">{member.name}</h3>
                        <p className="text-xs text-secondary uppercase tracking-wider">{member.role} • Week Ending: {weekEnding}</p>
                    </div>
                    <button onClick={onClose} className="text-secondary hover:text-primary">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4">
                    <table className="w-full text-sm text-left border-collapse border border-border-subtle">
                        <thead className="bg-white/5 text-secondary text-xs uppercase">
                            <tr>
                                <th className="p-2 border border-border-subtle">Date</th>
                                <th className="p-2 border border-border-subtle">Day</th>
                                <th className="p-2 border border-border-subtle text-center">Call</th>
                                <th className="p-2 border border-border-subtle text-center">Wrap</th>
                                <th className="p-2 border border-border-subtle text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-primary">
                            {historyData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                    <td className="p-2 border border-border-subtle">
                                        <div>{row.date}</div>
                                        <div className="text-[10px] text-secondary">{row.dayOfWeek}</div>
                                    </td>
                                    <td className="p-2 border border-border-subtle">{row.day}</td>
                                    <td className="p-2 border border-border-subtle text-center font-mono">{row.call}</td>
                                    <td className="p-2 border border-border-subtle text-center font-mono">{row.wrap}</td>
                                    <td className="p-2 border border-border-subtle text-center font-bold">{row.total}</td>
                                </tr>
                            ))}
                            {historyData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-secondary italic">No work history found.</td>
                                </tr>
                            )}
                            <tr className="bg-accent-primary/10 font-bold">
                                <td colSpan={4} className="p-2 border border-border-subtle text-right text-accent-primary uppercase text-xs">Total Hours</td>
                                <td className="p-2 border border-border-subtle text-center text-accent-primary">{totalWeeklyHours}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
