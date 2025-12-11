import React, { useState, useRef } from 'react';
import { Calendar as CalendarIcon, Upload, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { ShootDayCard, ShootDayCardContent } from './ShootDayCard';
import { CrewAssignmentModal } from '../Crew/CrewAssignmentModal';
import type { ShootDay } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';

interface ShootDaysViewProps {
  // onNavigateToCrew?: (dayId: string) => void; // This prop is being replaced by the modal
}

export const ShootDaysView: React.FC<ShootDaysViewProps> = () => {
  const { shootDays, importSchedule, deleteSchedule, deleteDay, isLoading, error } = useSchedule();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveId(null);
  };


  const handleViewCrew = (dayId: string) => {
    setSelectedDayId(dayId);
    setIsCrewModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importSchedule(file);
    }
  };

  const activeDay = activeId ? shootDays.find(day => day.id === activeId) : null;

  // Group days by source file
  const groupedDays = shootDays.reduce((acc, day) => {
    const source = day.sourceFile || 'Unknown Source';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(day);
    return acc;
  }, {} as Record<string, ShootDay[]>);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Shoot Schedule</h2>
          <p className="text-secondary mt-1">One Line Schedule (Parsed from PDF)</p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            <Upload size={18} />
            <span>{isLoading ? 'Importing...' : 'Import Schedule'}</span>
          </button>
          {error && <p className="text-red-500 text-xs mt-1 absolute">{error}</p>}
        </div>
      </div>

      {/* Stats / Filter Bar (Placeholder) */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="glass-panel px-4 py-3 rounded-lg flex items-center gap-3 min-w-[200px]">
          <div className="p-2 bg-green-500/10 rounded-md text-green-500">
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="text-xs text-secondary uppercase font-semibold">Next Shoot</div>
            <div className="font-medium">Oct 21 • 08:00 AM</div>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {Object.entries(groupedDays).map(([source, days]) => (
            <div key={source} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-primary"></span>
                  {source}
                </h3>
                {source !== 'Unknown Source' && (
                  <button
                    onClick={() => deleteSchedule(source)}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={14} />
                    Delete Block
                  </button>
                )}
              </div>

              <SortableContext
                items={days.map(d => d.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {days.map((day) => (
                    <ShootDayCard
                      key={day.id}
                      day={day}
                      onViewCrew={() => handleViewCrew(day.id)}
                      onDelete={() => deleteDay(day.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeDay ? (
            <ShootDayCardContent
              day={activeDay}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CrewAssignmentModal
        isOpen={isCrewModalOpen}
        onClose={() => setIsCrewModalOpen(false)}
        dayId={selectedDayId}
      />
    </div>
  );
};
