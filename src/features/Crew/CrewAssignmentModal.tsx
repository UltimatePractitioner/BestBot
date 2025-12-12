import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragStartEvent, type DragEndEvent, useDroppable, closestCenter, rectIntersection, pointerWithin, getFirstCollision } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Users, GripVertical, X, Plus } from 'lucide-react';
import { SCHEDULE_DATA } from '../../utils/scheduleAdapter';
import type { CrewMember } from '../../types';
import { useCrew } from '../../context/CrewContext';

interface CrewAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    dayId: string | null;
}

interface SortableCrewItemProps {
    crew: CrewMember;
    onAction?: (crew: CrewMember) => void;
    actionIcon?: React.ReactNode;
}

const SortableCrewItem: React.FC<SortableCrewItemProps> = ({ crew, onAction, actionIcon }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: crew.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-surface p-3 rounded-lg border border-border-subtle flex items-center gap-3 group hover:border-accent-primary transition-colors cursor-grab active:cursor-grabbing touch-none"
        >
            <div className="text-secondary hover:text-primary">
                <GripVertical size={16} />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {crew.name.charAt(0)}
            </div>
            <div className="flex-1">
                <div className="font-medium text-primary">{crew.name}</div>
                <div className="text-xs text-secondary">{crew.role}</div>
            </div>
            <div className="text-xs px-2 py-1 bg-hover rounded text-secondary mr-2">
                {crew.department}
            </div>
            {onAction && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction(crew);
                    }}
                    className="p-1 hover:bg-hover rounded text-secondary hover:text-primary transition-colors"
                >
                    {actionIcon}
                </button>
            )}
        </div>
    );
};

const CrewItemOverlay: React.FC<{ crew: CrewMember }> = ({ crew }) => (
    <div className="bg-surface p-3 rounded-lg border border-accent-primary shadow-xl flex items-center gap-3 w-full cursor-grabbing">
        <div className="text-primary">
            <GripVertical size={16} />
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {crew.name.charAt(0)}
        </div>
        <div className="flex-1">
            <div className="font-medium text-primary">{crew.name}</div>
            <div className="text-xs text-secondary">{crew.role}</div>
        </div>
        <div className="text-xs px-2 py-1 bg-hover rounded text-secondary">
            {crew.department}
        </div>
    </div>
);

// Helper component for droppable columns
const CrewListColumn: React.FC<{
    id: string;
    title: React.ReactNode;
    count: number;
    items: CrewMember[];
    icon?: React.ReactNode;
    placeholder?: string;
    onItemAction?: (crew: CrewMember) => void;
    actionIcon?: React.ReactNode;
}> = ({ id, title, count, items, icon, placeholder, onItemAction, actionIcon }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col bg-surface/50 rounded-xl border border-border-subtle overflow-hidden h-full">
            <div className="p-4 border-b border-border-subtle bg-surface">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                <p className="text-xs text-secondary mt-1">{count} {id === 'available-container' ? 'Available' : 'Assigned'}</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div
                        ref={setNodeRef}
                        id={id}
                        className="space-y-3 min-h-[100px] h-full"
                    >
                        {items.length === 0 && placeholder && (
                            <div className="h-32 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-lg text-secondary text-sm">
                                {placeholder}
                            </div>
                        )}
                        {items.map(crew => (
                            <SortableCrewItem
                                key={crew.id}
                                crew={crew}
                                onAction={onItemAction}
                                actionIcon={actionIcon}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};

export const CrewAssignmentModal: React.FC<CrewAssignmentModalProps> = ({ isOpen, onClose, dayId }) => {
    const { crew: allCrew, reorderCrew } = useCrew();
    const [assignedCrew, setAssignedCrew] = useState<CrewMember[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<CrewMember | null>(null);

    // Derive available crew: all crew members NOT in the assigned list
    const availableCrew = allCrew.filter(c => !assignedCrew.some(a => a.id === c.id));

    const selectedDay = SCHEDULE_DATA.find(d => d.id === dayId);

    useEffect(() => {
        if (!isOpen) {
            setActiveDragItem(null);
        }
    }, [isOpen]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const item = [...availableCrew, ...assignedCrew].find(c => c.id === active.id);
        if (item) setActiveDragItem(item);
    };

    // Custom collision detection strategy
    const customCollisionDetection = (args: any) => {
        // First, attempt to detect collisions with pointers (cursor)
        const pointerCollisions = pointerWithin(args);

        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        // If no pointer collisions, try rect intersection
        return rectIntersection(args);
    };

    const findContainer = (id: string) => {
        if (id === 'available-container') return 'available';
        if (id === 'assigned-container') return 'assigned';

        // If sorting within available
        if (availableCrew.find(c => c.id === id)) {
            return 'available';
        }

        // If sorting within assigned
        if (assignedCrew.find(c => c.id === id)) {
            return 'assigned';
        }

        return null;
    };

    const handleDragOver = (event: DragEndEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Only move IF we are dragging into a different container
        setAssignedCrew((prevAssigned) => {
            const activeId = active.id as string;

            if (activeContainer === 'available' && overContainer === 'assigned') {
                // Moving Available -> Assigned
                const item = allCrew.find(c => c.id === activeId);
                if (!item || prevAssigned.some(c => c.id === activeId)) return prevAssigned;

                // Insert at the dragged position or end
                const overIndex = prevAssigned.findIndex((c) => c.id === overId);
                if (overIndex >= 0) {
                    const newItems = [...prevAssigned];
                    newItems.splice(overIndex, 0, item);
                    return newItems;
                }
                return [...prevAssigned, item];
            }

            if (activeContainer === 'assigned' && overContainer === 'available') {
                // Moving Assigned -> Available (Remove from assigned)
                return prevAssigned.filter(c => c.id !== activeId);
            }

            return prevAssigned;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = over ? findContainer(over.id as string) : null;

        if (activeContainer && overContainer && activeContainer === overContainer) {
            // Reordering within same container
            const activeIndex = (activeContainer === 'available' ? availableCrew : assignedCrew)
                .findIndex((c) => c.id === active.id);
            const overIndex = (overContainer === 'available' ? availableCrew : assignedCrew)
                .findIndex((c) => c.id === over!.id);

            if (activeIndex !== overIndex) {
                if (activeContainer === 'available') {
                    const globalActiveIndex = allCrew.findIndex(c => c.id === active.id);
                    const globalOverIndex = allCrew.findIndex(c => c.id === over!.id);
                    if (globalActiveIndex !== -1 && globalOverIndex !== -1) {
                        reorderCrew(globalActiveIndex, globalOverIndex);
                    }
                } else {
                    setAssignedCrew((items) => arrayMove(items, activeIndex, overIndex));
                }
            }
        }

        setActiveDragItem(null);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-app border border-border-subtle rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Crew Assignment</h2>
                        <p className="text-secondary">
                            {selectedDay ? `${selectedDay.title} • ${new Date(selectedDay.date).toLocaleDateString()}` : 'Select a Day'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-hover rounded-lg text-secondary hover:text-primary transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-hidden p-6 bg-app">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={customCollisionDetection}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="h-full grid grid-cols-2 gap-8">
                            <CrewListColumn
                                id="assigned-container"
                                title={selectedDay ? `${new Date(selectedDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} Crew` : 'Assigned Crew'}
                                count={assignedCrew.length}
                                items={assignedCrew}
                                icon={<span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                placeholder="Drag crew here to assign"
                                onItemAction={(crew) => {
                                    console.log('Unassigning:', crew.name);
                                    setAssignedCrew(prev => prev.filter(c => c.id !== crew.id));
                                }}
                                actionIcon={<X size={16} />}
                            />
                            <CrewListColumn
                                id="available-container"
                                title="Available Crew"
                                count={availableCrew.length}
                                items={availableCrew}
                                icon={<Users size={16} />}
                                onItemAction={(crew) => {
                                    console.log('Assigning:', crew.name);
                                    setAssignedCrew(prev => [...prev, crew]);
                                }}
                                actionIcon={<Plus size={16} />}
                            />
                        </div>
                        {typeof document !== 'undefined' && createPortal(
                            <DragOverlay style={{ zIndex: 999999 }}>
                                {activeDragItem ? <CrewItemOverlay crew={activeDragItem} /> : null}
                            </DragOverlay>,
                            document.body
                        )}
                    </DndContext>
                </div>
            </div>
        </div>
    );
};
