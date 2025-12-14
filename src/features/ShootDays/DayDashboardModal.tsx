import React, { useState } from 'react';
import { X, Users, FileText, GripVertical, Clock } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCrew } from '../../context/CrewContext';
import { useSchedule } from '../../context/ScheduleContext';
import { useTimeCard } from '../../context/TimeCardContext';
import { TimeCardsTable } from '../TimeCards/components/TimeCardsTable';
import { WorkHistoryModal } from '../TimeCards/components/WorkHistoryModal';
import { getWeekEnding } from '../../utils/dateUtils';
import type { CrewMember } from '../../types';



// --- Tab Components ---

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm ${active
            ? 'border-accent-primary text-accent-primary'
            : 'border-transparent text-secondary hover:text-primary hover:bg-surface/50'
            }`}
    >
        <Icon size={16} />
        {label}
    </button>
);

// --- Crew Tab (Refactored from CrewAssignmentModal) ---

const SortableCrewItem = ({ member, isAssigned, onDelete, onViewHistory }: { member: CrewMember, isAssigned?: boolean, onDelete?: () => void, onViewHistory?: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-app border border-border-subtle rounded-md group hover:border-accent-primary/50">
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-secondary hover:text-primary">
                    <GripVertical size={16} />
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {member.name.charAt(0)}
                </div>
                <div>
                    <div className="font-medium text-sm text-primary flex items-center gap-2">
                        {member.name}
                        {onViewHistory && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewHistory(); }} // Prevent drag start
                                onPointerDown={(e) => e.stopPropagation()} // Vital for dnd-kit to ignore this click
                                className="text-secondary hover:text-accent-primary transition-colors p-0.5"
                                title="View Work History"
                            >
                                <Clock size={12} />
                            </button>
                        )}
                    </div>
                    <div className="text-xs text-secondary">{member.role}</div>
                </div>
            </div>
            {isAssigned && onDelete && (
                <button onClick={onDelete} className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

const DroppableCrewList = ({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) => {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={className}>
            {children}
        </div>
    );
};

const CrewTab = ({ assignedCrewIds, onAssign, onUnassign, onOpenHistory }: { assignedCrewIds: string[], onAssign: (id: string) => void, onUnassign: (id: string) => void, onOpenHistory: (member: CrewMember) => void }) => {
    const { crew, reorderCrew } = useCrew();
    const [activeId, setActiveId] = useState<string | null>(null);

    const assignedCrew = crew.filter(c => assignedCrewIds.includes(c.id));
    const availableCrew = crew.filter(c => !assignedCrewIds.includes(c.id));

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeIdStr = active.id as string;
        const overIdStr = over.id as string;

        // 1. Handle Reordering (Global Crew Order)
        // If both items are crew members (not container IDs), reorder them in the global list
        // This ensures the list sort persists and reflects user preference
        const isOverContainer = overIdStr === 'assigned-container' || overIdStr === 'available-container';

        if (activeIdStr !== overIdStr && !isOverContainer) {
            const oldIndex = crew.findIndex(c => c.id === activeIdStr);
            const newIndex = crew.findIndex(c => c.id === overIdStr);

            if (oldIndex !== -1 && newIndex !== -1) {
                reorderCrew(oldIndex, newIndex);
            }
        }

        // 2. Handle Assignment / Unassignment
        // Logic: Is it in assigned or available zone?
        const isOverAssigned = overIdStr === 'assigned-container' || assignedCrew.some(c => c.id === overIdStr);
        const isOverAvailable = overIdStr === 'available-container' || availableCrew.some(c => c.id === overIdStr);

        if (isOverAssigned && !assignedCrewIds.includes(activeIdStr)) {
            onAssign(activeIdStr);
        } else if (isOverAvailable && assignedCrewIds.includes(activeIdStr)) {
            onUnassign(activeIdStr);
        }
    };

    const activeMember = activeId ? crew.find(c => c.id === activeId) : null;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 gap-6 h-full">
                {/* Available Crew */}
                <div className="flex flex-col bg-surface/30 rounded-lg p-4">
                    <h4 className="font-bold text-secondary text-sm mb-3 uppercase tracking-wider">Roster ({availableCrew.length})</h4>
                    <DroppableCrewList id="available-container" className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                        <SortableContext items={availableCrew.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            {availableCrew.map(member => (
                                <SortableSceneCardWrapper key={member.id}>
                                    <SortableCrewItem
                                        member={member}
                                        onViewHistory={() => onOpenHistory(member)}
                                    />
                                </SortableSceneCardWrapper>
                            ))}
                        </SortableContext>
                    </DroppableCrewList>
                </div>

                {/* Assigned Crew */}
                <div className="flex flex-col bg-surface/30 rounded-lg p-4 border-2 border-dashed border-border-subtle">
                    <h4 className="font-bold text-accent-primary text-sm mb-3 uppercase tracking-wider">On Call ({assignedCrew.length})</h4>
                    <DroppableCrewList id="assigned-container" className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                        <SortableContext items={assignedCrew.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            {assignedCrew.map(member => (
                                <SortableSceneCardWrapper key={member.id}>
                                    <SortableCrewItem
                                        member={member}
                                        isAssigned
                                        onDelete={() => onUnassign(member.id)}
                                        onViewHistory={() => onOpenHistory(member)}
                                    />
                                </SortableSceneCardWrapper>
                            ))}
                            {assignedCrew.length === 0 && (
                                <div className="h-full flex items-center justify-center text-secondary text-sm italic pointer-events-none">
                                    Drag crew here to assign
                                </div>
                            )}
                        </SortableContext>
                    </DroppableCrewList>
                </div>
            </div>
            <DragOverlay>
                {activeMember ? (
                    <div className="opacity-90 rotate-3 cursor-grabbing w-[200px]">
                        <SortableCrewItem member={activeMember} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// Wrapper needed because SortableSceneCard was likely not exported or designed for this context?
// Actually I defined SortableCrewItem above. But I used SortableSceneCardWrapper?
// Let's just use the SortableCrewItem directly but wrap it in a fragment or div if needed.
// Wait, I see "SortableSceneCardWrapper" in my JSX above but I didn't define it. Correcting.
const SortableSceneCardWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;


// --- Main Modal Component ---

export const DayDashboardModal = ({ isOpen, onClose, dayId }: { isOpen: boolean, onClose: () => void, dayId: string | null }) => {
    const { shootDays } = useSchedule();
    const { getTimeCardsByDay, upsertTimeCard, deleteTimeCard } = useTimeCard();
    const [activeTab, setActiveTab] = useState<'crew' | 'timecards' | 'notes'>('crew');

    // History Modal State
    const [historyMember, setHistoryMember] = useState<CrewMember | null>(null);

    // Size Testing State
    const [modalSize, setModalSize] = useState<string>('max-w-6xl');

    if (!isOpen || !dayId) return null;

    const day = shootDays.find(d => d.id === dayId);
    if (!day) return null;

    // Derived state from persistent Time Cards
    const dayCards = getTimeCardsByDay(dayId);
    const assignedCrewIds = dayCards.map(tc => tc.crewMemberId);

    const handleAssign = (crewId: string) => {
        // Create new time card entry
        upsertTimeCard({
            crewMemberId: crewId,
            shootDayId: dayId,
            // Default 12h day? or empty?
            // empty for now, user fills in Time Sheet
        });
    };

    const handleUnassign = (crewId: string) => {
        const card = dayCards.find(tc => tc.crewMemberId === crewId);
        if (card && card.id) {
            deleteTimeCard(card.id);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <div className={`bg-surface border border-border-subtle rounded-xl shadow-2xl w-full max-w-[96rem] max-h-[90vh] flex flex-col transition-all duration-300`} onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                        <div>
                            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                                Day {day.dayNumber} Dashboard
                                <span className="text-sm font-normal text-secondary bg-surface px-2 py-0.5 rounded border border-border-subtle">{day.date}</span>
                            </h2>
                            <p className="text-secondary text-sm mt-1">{day.location || 'Unknown Location'}</p>
                        </div>

                        <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-6 border-b border-border-subtle bg-app/50 space-x-1">
                        <TabButton active={activeTab === 'crew'} onClick={() => setActiveTab('crew')} icon={Users} label="Crew Roster" />
                        <TabButton active={activeTab === 'timecards'} onClick={() => setActiveTab('timecards')} icon={FileText} label="Time Cards" />
                        <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={FileText} label="Notes" />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 overflow-hidden min-h-[500px]">
                        {activeTab === 'crew' && (
                            <CrewTab
                                assignedCrewIds={assignedCrewIds}
                                onAssign={handleAssign}
                                onUnassign={handleUnassign}
                                onOpenHistory={setHistoryMember}
                            />
                        )}
                        {activeTab === 'timecards' && (
                            <TimeCardsTable
                                dayId={dayId}
                                assignedCrewIds={assignedCrewIds}
                                dayDate={day.date}
                            />
                        )}
                        {activeTab === 'notes' && (
                            <div className="h-[400px]">
                                <textarea
                                    className="w-full h-full bg-app border border-border-subtle rounded-lg p-4 text-primary focus:border-accent-primary outline-none resize-none"
                                    placeholder="Add logistics notes, parking info, or special instructions for this shoot day..."
                                />
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Work History Modal Layer */}
            <WorkHistoryModal
                isOpen={!!historyMember}
                onClose={() => setHistoryMember(null)}
                member={historyMember}
                weekEnding={getWeekEnding(day.date)}
            />
        </>
    );
};
