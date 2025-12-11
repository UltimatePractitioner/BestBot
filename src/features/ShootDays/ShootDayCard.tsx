import React, { useState } from 'react';
import { MapPin, Clock, Users, GripVertical, Trash2, FileText } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShootDay } from '../../types';
import './ShootDayCard.css';
import { OnelineViewerModal } from './OnelineViewerModal';

interface ShootDayCardProps {
    day: ShootDay;
    onUpdate?: (updatedDay: ShootDay) => void;
    onViewCrew?: () => void;
    onDelete?: () => void;
}

interface ShootDayCardContentProps {
    day: ShootDay;
    onUpdate?: (updatedDay: ShootDay) => void;
    onViewCrew?: () => void;
    onDelete?: () => void;
    dragHandleProps?: any;
    style?: React.CSSProperties;
    setNodeRef?: (node: HTMLElement | null) => void;
    isOverlay?: boolean;
}

export const ShootDayCardContent: React.FC<ShootDayCardContentProps> = ({
    day,
    onUpdate,
    onViewCrew,
    onDelete,
    dragHandleProps,
    style,
    setNodeRef,
    isOverlay
}) => {
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    const handleTextChange = (field: keyof ShootDay, value: string | number) => {
        if (onUpdate) {
            onUpdate({ ...day, [field]: value });
        }
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={`glass-panel p-6 rounded-lg shoot-card relative group ${isOverlay ? 'shadow-2xl ring-2 ring-accent-primary rotate-2 scale-105 cursor-grabbing' : ''}`}
            >
                <div className="card-header">
                    <div className="flex items-start gap-3 w-full">
                        <div {...dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300">
                            <GripVertical size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">{day.title}</h3>
                                <div className="flex items-center gap-2">
                                    {day.originalText && (
                                        <button
                                            onClick={() => setIsViewerOpen(true)}
                                            className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors flex items-center gap-1"
                                            title="View original schedule text"
                                        >
                                            <FileText size={12} />
                                            View Oneline
                                        </button>
                                    )}
                                    {onDelete && !isOverlay && (
                                        <button
                                            onClick={onDelete}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300"
                                            title="Delete this day"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`status-badge ${day.status}`}>
                        {day.status.charAt(0).toUpperCase() + day.status.slice(1)}
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                    <div className="info-row">
                        <Clock size={16} className="info-icon" />
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={day.date}
                                onChange={(e) => handleTextChange('date', e.target.value)}
                                className="bg-transparent border-none focus:ring-1 focus:ring-accent-primary rounded px-1 text-sm cursor-pointer"
                                title="Click to edit date"
                            />
                            <span>• Call:</span>
                            <input
                                type="text"
                                value={day.callTime}
                                onChange={(e) => handleTextChange('callTime', e.target.value)}
                                className="bg-transparent border-none focus:ring-1 focus:ring-accent-primary rounded px-1 w-20 text-sm"
                            />
                        </div>
                    </div>
                    <div className="info-row">
                        <MapPin size={16} className="info-icon" />
                        <input
                            type="text"
                            value={day.location}
                            onChange={(e) => handleTextChange('location', e.target.value)}
                            className="bg-transparent border-none focus:ring-1 focus:ring-accent-primary rounded px-1 flex-1 text-sm"
                        />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        {day.scenes.length} Scenes
                    </div>
                    <button
                        onClick={onViewCrew}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
                    >
                        <Users size={14} />
                        Crew
                    </button>
                </div>
            </div>

            <OnelineViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                title={day.title}
                content={day.originalText || ''}
            />
        </>
    );
};

export const ShootDayCard: React.FC<ShootDayCardProps> = ({ day, onUpdate, onViewCrew, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: day.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 100 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
    };

    return (
        <ShootDayCardContent
            day={day}
            onUpdate={onUpdate}
            onViewCrew={onViewCrew}
            onDelete={onDelete}
            dragHandleProps={{ ...attributes, ...listeners }}
            style={style}
            setNodeRef={setNodeRef}
            isOverlay={false}
        />
    );
};
