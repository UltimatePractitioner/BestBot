import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragStartEvent, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin } from 'lucide-react';
import type { ShootDay, Scene } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';

// --- Components ---

const SortableSceneCard = ({ scene }: { scene: Scene }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id, data: { type: 'Scene', scene } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-card p-3 rounded border border-border-subtle group hover:border-accent-primary cursor-grab active:cursor-grabbing mb-2 shadow-sm"
        >
            <div className="flex items-start gap-2">
                <div className="text-secondary mt-1 opacity-50"><GripVertical size={14} /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-accent-primary font-mono text-xs">SC {scene.sceneNumber}</span>
                        <span className="text-[10px] text-secondary font-mono bg-white/5 px-1 rounded">{scene.pages || 0} Pgs</span>
                    </div>
                    <div className="text-sm font-medium text-primary truncate leading-tight mb-1">{scene.slugline || scene.location}</div>
                    <div className="text-xs text-secondary truncate">{scene.description}</div>
                    <div className="flex gap-2 mt-2 text-[10px] text-secondary font-mono">
                        {/* Cast Placeholder */}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DayColumn = ({ day, scenes }: { day: ShootDay, scenes: Scene[] }) => {
    // We treat the Day as a droppable container implicitly via SortableContext
    // But we need a droppable area for empty days
    const { setNodeRef } = useSortable({ id: day.id, data: { type: 'Day', day } });

    return (
        <div ref={setNodeRef} className="min-w-[280px] w-[280px] flex flex-col h-fit bg-surface border border-border-subtle rounded-lg shadow-sm hover:border-accent-primary/50 transition-all pb-2 overflow-hidden">
            {/* Header */}
            <div className={`p-3 border-b-4 ${scenes.length > 0 ? 'border-accent-primary' : 'border-border-subtle'} bg-app sticky top-0 z-10`}>
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-primary text-lg">Day {day.dayNumber}</h3>
                    <span className="text-xs font-mono text-secondary">{day.date}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-secondary truncate">
                    <MapPin size={12} />
                    {day.location || 'Multiple Locations'}
                </div>
                <div className="flex justify-between mt-2 text-xs font-mono text-accent-primary">
                    <span>{scenes.length} Scenes</span>
                    <span>{scenes.reduce((acc, s) => acc + (parseFloat(String(s.pages || 0)) || 0), 0).toFixed(1)} Pgs</span>
                </div>
            </div>

            {/* Droppable Area */}
            <div className="flex-1 p-2 overflow-y-auto min-h-[100px]">
                <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {scenes.map(scene => (
                        <SortableSceneCard key={scene.id} scene={scene} />
                    ))}
                    {scenes.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-white/5 rounded flex items-center justify-center text-xs text-muted">
                            Drop Scenes Here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};


export const StripboardView = () => {
    const { shootDays, moveScene } = useSchedule(); // We need to add moveScene to context
    const [activeDragItem, setActiveDragItem] = useState<Scene | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Scene') {
            setActiveDragItem(event.active.data.current.scene as Scene);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find source and destination days
        const sourceDay = shootDays.find(d => d.scenes.some(s => s.id === activeId));
        let destDay = shootDays.find(d => d.id === overId); // Dropped on Day Header/Container

        // If dropped on a Scene, find that scene's day
        if (!destDay) {
            destDay = shootDays.find(d => d.scenes.some(s => s.id === overId));
        }

        if (sourceDay && destDay && sourceDay.id !== destDay.id) {
            console.log(`Moving Scene ${activeId} from Day ${sourceDay.dayNumber} to Day ${destDay.dayNumber}`);
            if (moveScene) {
                moveScene(activeId, sourceDay.id, destDay.id, overId);
            }
        } else if (sourceDay && destDay && sourceDay.id === destDay.id && activeId !== overId) {
            // Reorder within same day
            if (moveScene) {
                moveScene(activeId, sourceDay.id, destDay.id, overId); // Context handles reorder logic
            }
        }
    };

    // Group days by source file (Schedule)
    const groupedDays = shootDays.reduce((acc, day) => {
        const key = day.sourceFile || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(day);
        return acc;
    }, {} as Record<string, ShootDay[]>);

    // Sort groups by scheduleCreatedAt descending (Newest first)
    const sortedGroups = Object.entries(groupedDays).sort(([, daysA], [, daysB]) => {
        const dateA = daysA[0]?.scheduleCreatedAt ? new Date(daysA[0].scheduleCreatedAt).getTime() : 0;
        const dateB = daysB[0]?.scheduleCreatedAt ? new Date(daysB[0].scheduleCreatedAt).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="h-full overflow-y-auto bg-black/20 backdrop-blur-sm p-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex flex-col gap-8 pb-20">
                    {sortedGroups.map(([sourceFile, days]) => (
                        <div key={sourceFile} className="flex flex-col gap-4">
                            {/* Schedule Header */}
                            <div className="flex items-center gap-4 border-b border-white/10 pb-2">
                                <div className="h-2 w-2 rounded-full bg-accent-primary"></div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{sourceFile}</h3>
                                <span className="text-xs font-mono text-zinc-500">
                                    {days.length} Days • {days.reduce((acc, d) => acc + d.scenes.length, 0)} Scenes
                                </span>
                            </div>

                            {/* Days Grid */}
                            <div className="flex flex-wrap items-start gap-6">
                                {days.map(day => (
                                    <DayColumn key={day.id} day={day} scenes={day.scenes} />
                                ))}
                            </div>
                        </div>
                    ))}

                    {shootDays.length === 0 && (
                        <div className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-lg text-zinc-500">
                            No shoot days found. Import a schedule to get started.
                        </div>
                    )}
                </div>
                {typeof document !== 'undefined' && createPortal(
                    <DragOverlay>
                        {activeDragItem ? (
                            <div className="w-[260px]">
                                <SortableSceneCard scene={activeDragItem} />
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
};
