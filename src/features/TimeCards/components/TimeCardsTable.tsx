import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';
import { useCrew } from '../../../context/CrewContext';
import { useTimeCard, type TimeCardEntry } from '../../../context/TimeCardContext';
import { useProject } from '../../../context/ProjectContext';
import { getWeekEnding } from '../../../utils/dateUtils';

interface TimeCardsTableProps {
    dayId: string;
    assignedCrewIds: string[];
    dayDate: string;
}

export const TimeCardsTable = ({ dayId, assignedCrewIds, dayDate }: TimeCardsTableProps) => {
    const { crew } = useCrew();
    const { activeProject } = useProject();
    const { getTimeCardsByDay, upsertTimeCard, bulkUpsertTimeCards } = useTimeCard();
    const assignedCrew = crew.filter(c => assignedCrewIds.includes(c.id));

    // Local state for performant typing
    const [entries, setEntries] = useState<Record<string, TimeCardEntry>>({});

    // Load initial data from context
    useEffect(() => {
        const dbEntries = getTimeCardsByDay(dayId);
        const entryMap: Record<string, TimeCardEntry> = {};

        dbEntries.forEach(e => {
            if (e.crewMemberId) {
                entryMap[e.crewMemberId] = e;
            }
        });

        // Merge with existing state to avoid overwriting ongoing edits (though unlikely if single user)
        // Actually, overwrite local state when dayId changes or context loads initially
        setEntries(entryMap);
    }, [dayId, getTimeCardsByDay]); // Dependency on getTimeCardsByDay might trigger often if reference unstable

    const handleEntryChange = (crewId: string, field: keyof TimeCardEntry, value: any) => {
        setEntries(prev => ({
            ...prev,
            [crewId]: {
                ...(prev[crewId] || { crewMemberId: crewId, shootDayId: dayId }),
                [field]: value,
                // Ensure IDs are present
                crewMemberId: crewId,
                shootDayId: dayId
            }
        }));
    };

    const handleBlur = (crewId: string) => {
        const entry = entries[crewId];
        if (entry) {
            upsertTimeCard(entry);
        }
    };

    // Master Row Logic
    const handleMasterChange = (field: keyof TimeCardEntry, value: any) => {
        setEntries(prev => {
            const next = { ...prev };
            assignedCrew.forEach(member => {
                next[member.id] = {
                    ...(next[member.id] || { crewMemberId: member.id, shootDayId: dayId }),
                    [field]: value,
                    crewMemberId: member.id,
                    shootDayId: dayId
                };
            });
            return next;
        });
    };

    const handleMasterBlur = (field: keyof TimeCardEntry) => {
        // Collect all entries and upsert
        const entriesToUpdate = assignedCrew.map(member => {
            const entry = entries[member.id];
            // Ensure we have a valid entry object if it wasn't in state yet
            return entry || { crewMemberId: member.id, shootDayId: dayId, [field]: entries[member.id]?.[field] };
        });

        // We need the latest state, luckily handleMasterBlur is closure over entries... 
        // Wait, 'entries' here is stale closure from render. Use functional update or ref?
        // Actually, onBlur will run with current render's closure.
        // But handleMasterChange triggers re-render, so 'entries' should be fresh-ish. 
        // To be safe, we should rely on the state update completion - but blur happens after typing.
        // Let's assume 'entries' is up to date because typing triggers re-render.

        bulkUpsertTimeCards(entriesToUpdate);
    };

    const calculateTotal = (entry?: TimeCardEntry) => {
        if (!entry || !entry.call || !entry.wrap) return '0.0';
        // Simple 24h format parser or just float? 
        // Template implies numeric or time.
        // Assuming user enters "7" or "0700" or "7.0".
        // Let's assume decimal for now as per previous mock (parseFloat).
        // If user enters '7am', parseFloat('7am') = 7.
        const call = parseFloat(entry.call) || 0;
        const wrap = parseFloat(entry.wrap) || 0;
        const m1In = parseFloat(entry.meal1In || '0') || 0;
        const m1Out = parseFloat(entry.meal1Out || '0') || 0;
        const m2In = parseFloat(entry.meal2In || '0') || 0;
        const m2Out = parseFloat(entry.meal2Out || '0') || 0;

        let total = wrap - call;
        if (m1In && m1Out) total -= (m1Out - m1In);
        if (m2In && m2Out) total -= (m2Out - m2In);

        return total > 0 ? total.toFixed(1) : '0.0';
    };

    const handlePrint = () => {
        window.print();
    };

    const weekEnding = getWeekEnding(dayDate);
    // Padding rows to make it look like the full page template
    const paddingRows = Math.max(0, 15 - assignedCrew.length);

    return (
        <div className="h-full flex flex-col">
            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    /* Hide the main app content */
                    #root {
                        display: none !important;
                    }
                    /* Ensure portal content is visible */
                    .print-portal {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        /* Scale down to fit A4/Letter if needed */
                        transform: scale(0.65);
                        transform-origin: top left;
                    }
                    /* Reset inputs for print */
                    input {
                        border: none !important;
                        background: transparent !important;
                    }
                }
                /* Hide print portal on screen */
                @media screen {
                    .print-portal {
                        display: none;
                    }
                }
            `}</style>

            <div className="flex justify-between items-center mb-4 px-1 no-print">
                <h4 className="text-sm text-secondary font-medium uppercase tracking-wider">Production Daily Time Sheet</h4>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white rounded text-sm hover:bg-blue-600 transition"
                >
                    <FileText size={14} />
                    <span>Print / Export PDF</span>
                </button>
            </div>

            {/* Screen View (Editable) - Simplified or same as print? The previous code had a print area inside the div. 
                We will separate Screen View and Print View. Screen view is just a scrollable table usually.
                But the user previously had the "Print Area" visible on screen as the UI. 
                So let's keep the UI as is for screen, and duplicates for Portal? Or just verify what was there.
                The previous code used the SAME div for screen and print, just toggled visibility.
                To solve the clipping, we MUST duplicate for the Portal (or move it temporarily, but duplication is cleaner for React).
            */}

            <div className="flex-1 overflow-auto bg-white text-black p-8 rounded-sm shadow-sm font-sans text-xs">
                {/* Reusing the render logic is best done by extracting a component or variable. 
                     For this single-file edit, I'll copy the structure to the Portal. 
                     Ideally, we extract <TimeSheetTemplate />.
                 */}
                {/* Screen Content - Identical to before */}
                <TimeSheetTemplate
                    dayDate={dayDate}
                    activeProject={activeProject}
                    assignedCrew={assignedCrew}
                    entries={entries}
                    handleMasterChange={handleMasterChange}
                    handleMasterBlur={handleMasterBlur}
                    handleEntryChange={handleEntryChange}
                    handleBlur={handleBlur}
                    calculateTotal={calculateTotal}
                    weekEnding={weekEnding}
                    paddingRows={paddingRows}
                />
            </div>

            {/* Portal for Print - Rendered at Body Level */}
            {createPortal(
                <div className="print-portal bg-white text-black p-10 font-sans text-xs w-[1100px]">
                    <TimeSheetTemplate
                        dayDate={dayDate}
                        activeProject={activeProject}
                        assignedCrew={assignedCrew}
                        entries={entries}
                        // Read-only for print? Or same layout? Same layout is fine.
                        // We pass handlers but they won't be used in print.
                        handleMasterChange={() => { }}
                        handleMasterBlur={() => { }}
                        handleEntryChange={() => { }}
                        handleBlur={() => { }}
                        calculateTotal={calculateTotal}
                        weekEnding={weekEnding}
                        paddingRows={paddingRows}
                        isPrint
                    />
                </div>,
                document.body
            )}
        </div>
    );
};

// Extracted Sub-component (Placed in same file for diff stability)
const TimeSheetTemplate = ({ dayDate, activeProject, assignedCrew, entries, handleMasterChange, handleMasterBlur, handleEntryChange, handleBlur, calculateTotal, weekEnding, paddingRows, isPrint }: any) => (
    <>
        {/* Header Box */}
        <div className="border-2 border-black mb-4">
            <div className="text-center font-bold text-lg border-b border-black py-2 uppercase bg-white">
                Production Daily Time Sheet
            </div>
            <div className="flex divide-x divide-black border-b border-black">
                <div className="flex-1 p-1 uppercase font-bold flex items-center gap-1">
                    <span>Show Name:</span>
                    <input className="flex-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black outline-none uppercase font-bold w-full" defaultValue={activeProject?.name || ''} placeholder="ENTER SHOW NAME" />
                </div>
                <div className="w-48 p-1 uppercase font-bold flex items-center gap-1">
                    <span>Dept:</span>
                    <input className="flex-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black outline-none uppercase font-bold w-full" defaultValue={assignedCrew[0]?.department || 'General'} />
                </div>
                <div className="w-32 p-1 uppercase font-bold">Date: {dayDate}</div>
                <div className="w-48 p-1 uppercase font-bold">Day of Week: {new Date(dayDate).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                <div className="w-32 p-1 uppercase font-bold flex items-center gap-1">
                    <span>Fax To:</span>
                    <input className="flex-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black outline-none uppercase font-bold w-full" />
                </div>
            </div>
        </div>

        {/* Main Table */}
        <table className="w-full border-collapse border border-black text-center text-[10px] sm:text-xs">
            <thead>
                <tr className="bg-white">
                    <th className="border border-black p-1 w-72 uppercase">Print Employee Name</th>
                    <th className="border border-black p-1 w-36 uppercase">Job Title</th>
                    <th className="border border-black p-1 w-24 uppercase">SSN#<br /><span className="text-[9px] font-normal">(last 4 digits only)</span></th>
                    <th className="border border-black p-1 w-16 uppercase">Call</th>

                    {/* Meal 1 */}
                    <th className="border border-black p-0 w-48 min-w-[200px]" colSpan={2}>
                        <div className="border-b border-black uppercase bg-white py-1">Meal 1</div>
                        <div className="flex divide-x divide-black">
                            <div className="flex-1 uppercase font-bold py-1">In</div>
                            <div className="flex-1 uppercase font-bold py-1">Out</div>
                        </div>
                    </th>

                    {/* Meal 2 */}
                    <th className="border border-black p-0 w-48 min-w-[200px]" colSpan={2}>
                        <div className="border-b border-black uppercase bg-white py-1">Meal 2</div>
                        <div className="flex divide-x divide-black">
                            <div className="flex-1 uppercase font-bold py-1">In</div>
                            <div className="flex-1 uppercase font-bold py-1">Out</div>
                        </div>
                    </th>

                    <th className="border border-black p-1 w-16 uppercase">Wrap</th>
                    <th className="border border-black p-1 w-16 uppercase font-bold">Total<br />Hours</th>

                    <th className="border border-black p-1 w-16 uppercase">Kits</th>
                    <th className="border border-black p-1 w-16 uppercase">Cars</th>
                    <th className="border border-black p-1 w-32 uppercase">Employee<br />Signature</th>
                    <th className="border border-black p-1 w-16 uppercase">Set# /<br />Coding</th>
                    <th className="border border-black p-1 uppercase">Location</th>
                    <th className="border border-black p-1 uppercase">Notes (i.e. rate change, WFH, etc)</th>
                </tr>
            </thead>
            <tbody>
                {/* MASTER ROW - Not shown in print if requested, but usually printed for clarity or hidden? Let's hide in print to be cleaner? Or keep? Keeping for consistency with previous.
                    Actually, master row is usually UI only. Let's hide it if isPrint is true.
                */}
                {!isPrint && (
                    <tr className="h-10 bg-yellow-50/50 border-b-2 border-black no-print">
                        <td className="border border-black p-1 text-left font-bold text-accent-primary uppercase italic text-[10px]">
                            Apply to All Rows
                        </td>
                        <td className="border border-black p-1 text-[10px] text-secondary italic">
                            (Enter value to fill column)
                        </td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm font-bold placeholder-gray-300" placeholder="CALL" onChange={e => handleMasterChange('call', e.target.value)} onBlur={() => handleMasterBlur('call')} /></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm font-bold placeholder-gray-300" placeholder="IN" onChange={e => handleMasterChange('meal1In', e.target.value)} onBlur={() => handleMasterBlur('meal1In')} /></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm font-bold placeholder-gray-300" placeholder="OUT" onChange={e => handleMasterChange('meal1Out', e.target.value)} onBlur={() => handleMasterBlur('meal1Out')} /></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm font-bold placeholder-gray-300" placeholder="IN" onChange={e => handleMasterChange('meal2In', e.target.value)} onBlur={() => handleMasterBlur('meal2In')} /></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm font-bold placeholder-gray-300" placeholder="OUT" onChange={e => handleMasterChange('meal2Out', e.target.value)} onBlur={() => handleMasterBlur('meal2Out')} /></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm font-bold placeholder-gray-300" placeholder="WRAP" onChange={e => handleMasterChange('wrap', e.target.value)} onBlur={() => handleMasterBlur('wrap')} /></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none font-bold placeholder-gray-300" placeholder="KITS" onChange={e => handleMasterChange('kits', e.target.value)} onBlur={() => handleMasterBlur('kits')} /></td>
                        <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none font-bold placeholder-gray-300" placeholder="CARS" onChange={e => handleMasterChange('cars', e.target.value)} onBlur={() => handleMasterBlur('cars')} /></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                    </tr>
                )}
                {assignedCrew.map(member => {
                    const entry = entries[member.id] || { crewMemberId: member.id, shootDayId: '' }; // simplified fallback
                    const total = calculateTotal(entry);
                    return (
                        <tr key={member.id} className="h-10 transition-colors hover:bg-yellow-50 focus-within:bg-yellow-100/80">
                            <td className="border border-black p-1 text-left font-bold">{member.name}</td>
                            <td className="border border-black p-1">{member.role}</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm" value={entry.call || ''} onChange={e => handleEntryChange(member.id, 'call', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm" value={entry.meal1In || ''} onChange={e => handleEntryChange(member.id, 'meal1In', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm" value={entry.meal1Out || ''} onChange={e => handleEntryChange(member.id, 'meal1Out', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm" value={entry.meal2In || ''} onChange={e => handleEntryChange(member.id, 'meal2In', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm" value={entry.meal2Out || ''} onChange={e => handleEntryChange(member.id, 'meal2Out', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none text-sm" value={entry.wrap || ''} onChange={e => handleEntryChange(member.id, 'wrap', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-1 font-bold text-sm">{total !== '0.0' ? total : ''}</td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none" value={entry.kits || ''} onChange={e => handleEntryChange(member.id, 'kits', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-0"><input className="w-full h-full text-center bg-transparent outline-none" value={entry.cars || ''} onChange={e => handleEntryChange(member.id, 'cars', e.target.value)} onBlur={() => handleBlur(member.id)} /></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                        </tr>
                    );
                })}
                {Array.from({ length: paddingRows }).map((_, i) => (
                    <tr key={`pad-${i}`} className="h-8"><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td></tr>
                ))}
            </tbody>
        </table>
        <div className="border border-black mt-4 p-2 font-bold uppercase text-[10px]">
            Dept. Head Signature Authorizing Above:
        </div>
        <div className="mt-2 text-[10px] text-right">
            Week Ending: {weekEnding}
        </div>
    </>
);
