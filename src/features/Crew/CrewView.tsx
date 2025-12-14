import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Search } from 'lucide-react';
import { useCrew } from '../../context/CrewContext';
import type { CrewMember, Department } from '../../types';

const SortableCrewItem = ({ crew }: { crew: CrewMember }) => {
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
            className="bg-surface p-3 md:p-4 rounded-lg border border-border-subtle flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 group hover:border-accent-primary transition-colors"
        >
            <div className="flex items-center w-full md:w-auto gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-secondary hover:text-primary shrink-0">
                    <GripVertical size={20} />
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                    {crew.name.charAt(0)}
                </div>
                <div className="flex-1 md:hidden">
                    <div className="font-medium text-primary text-base md:text-lg truncate">{crew.name}</div>
                </div>
            </div>

            <div className="flex-1 w-full pl-8 md:pl-0">
                <div className="font-medium text-primary text-lg hidden md:block">{crew.name}</div>
                <div className="text-sm text-secondary truncate">{crew.role}</div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-4 pl-8 md:pl-0">
                <div className="text-sm px-3 py-1 bg-hover rounded-full text-secondary whitespace-nowrap">
                    {crew.department}
                </div>
                <div className="text-sm text-secondary font-mono whitespace-nowrap">
                    ${crew.rate}/day
                </div>
            </div>
        </div>
    );
};

const CrewItemOverlay = ({ crew }: { crew: CrewMember }) => (
    <div className="bg-surface p-4 rounded-lg border border-accent-primary shadow-xl flex items-center gap-4 w-full cursor-grabbing">
        <div className="text-primary">
            <GripVertical size={20} />
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {crew.name.charAt(0)}
        </div>
        <div className="flex-1">
            <div className="font-medium text-primary text-lg">{crew.name}</div>
            <div className="text-sm text-secondary">{crew.role}</div>
        </div>
        <div className="hidden md:flex items-center gap-4">
            <div className="text-sm px-3 py-1 bg-hover rounded-full text-secondary">
                {crew.department}
            </div>
            <div className="text-sm text-secondary font-mono">
                ${crew.rate}/day
            </div>
        </div>
    </div>
);

export const CrewView = () => {
    const { crew, addCrew, reorderCrew } = useCrew();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form state
    const [newCrewName, setNewCrewName] = useState('');
    const [newCrewRole, setNewCrewRole] = useState('');
    // const [newCrewDept, setNewCrewDept] = useState<Department>('Production'); // Forced to Electric for now
    // const [newCrewRate, setNewCrewRate] = useState(''); // Removed per request

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = crew.findIndex((item) => item.id === active.id);
            const newIndex = crew.findIndex((item) => item.id === over.id);
            reorderCrew(oldIndex, newIndex);
        }
        setActiveId(null);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        const newMember: Omit<CrewMember, 'id'> = { // ID generated by DB
            name: newCrewName,
            role: newCrewRole,
            department: 'Electric', // User requested all departments be Electric
            rate: 0, // Removed daily rate
            email: '',
            phone: '',
            avatar: `https://i.pravatar.cc/150?u=${Math.random()}`
        };

        try {
            await addCrew(newMember);
            setIsAddModalOpen(false);
            // Reset form
            setNewCrewName('');
            setNewCrewRole('');
        } catch (error) {
            console.error("Failed to add crew", error);
        }
    };

    const handleAddRandomCrew = async () => {
        const randomNames = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Williams", "Chris Brown", "Emily Davis"];
        const randomRoles = ["Best Boy", "Gaffer", "Electrician", "Lighting Tech", "Dimmer Op"];
        const name = `${randomNames[Math.floor(Math.random() * randomNames.length)]} ${Math.floor(Math.random() * 100)}`;
        const role = randomRoles[Math.floor(Math.random() * randomRoles.length)];

        const newMember: Omit<CrewMember, 'id'> = {
            name,
            role,
            department: 'Electric',
            rate: 0,
            email: `test${Math.floor(Math.random() * 1000)}@example.com`,
            phone: '555-0199',
            avatar: `https://i.pravatar.cc/150?u=${Math.random()}`
        };

        try {
            await addCrew(newMember);
        } catch (error) {
            console.error("Failed to add random crew", error);
        }
    };

    const filteredCrew = crew.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeItem = activeId ? crew.find(c => c.id === activeId) : null;

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Crew List</h2>
                    <p className="text-secondary mt-1">Manage your production crew roster</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddRandomCrew}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
                    >
                        <Plus size={18} />
                        <span>Test: Add Random</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
                    >
                        <Plus size={18} />
                        <span>Add Crew Member</span>
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 text-muted" size={20} />
                <input
                    type="text"
                    placeholder="Search crew..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border-subtle rounded-lg text-primary placeholder-muted focus:border-accent-primary focus:outline-none transition-colors"
                />
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={filteredCrew.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {filteredCrew.map((member) => (
                            <SortableCrewItem key={member.id} crew={member} />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeItem ? <CrewItemOverlay crew={activeItem} /> : null}
                </DragOverlay>
            </DndContext>

            {/* Add Crew Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-surface border border-border-subtle rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-primary mb-4">Add Crew Member</h3>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newCrewName}
                                    onChange={e => setNewCrewName(e.target.value)}
                                    className="w-full px-3 py-2 bg-app border border-border-subtle rounded-lg text-primary focus:border-accent-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Role</label>
                                <input
                                    type="text"
                                    required
                                    value={newCrewRole}
                                    onChange={e => setNewCrewRole(e.target.value)}
                                    className="w-full px-3 py-2 bg-app border border-border-subtle rounded-lg text-primary focus:border-accent-primary outline-none"
                                />
                            </div>
                            <div className="p-3 bg-blue-50/10 border border-blue-500/20 rounded-lg">
                                <p className="text-sm text-blue-400">Department locked to <strong>Electric</strong> for testing.</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
