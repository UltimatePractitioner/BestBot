import { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ChevronDown, Plus, Folder, Check, Trash2, X } from 'lucide-react';

export function ProjectSwitcher() {
    const { projects, activeProject, switchProject, createProject, deleteProject } = useProject();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCreate(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        await createProject(newProjectName);
        setNewProjectName('');
        setShowCreate(false);
        setIsOpen(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this show? All data will be lost.')) {
            await deleteProject(id);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 border border-border-subtle hover:border-accent-primary/50 text-sm font-mono text-primary rounded-sm transition-all group"
            >
                <Folder size={14} className="text-accent-primary" />
                <span className="truncate max-w-[150px]">{activeProject?.name || 'SELECT_SHOW'}</span>
                <ChevronDown size={14} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-sm shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-zinc-800">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider pl-2">Available Shows</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => {
                                    switchProject(project.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors
                                    ${activeProject?.id === project.id ? 'bg-yellow-500/10 text-yellow-400' : 'hover:bg-white/5 text-zinc-300 hover:text-white'}
                                `}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Folder size={14} className={activeProject?.id === project.id ? 'fill-current' : ''} />
                                    <span className="truncate font-mono text-xs">{project.name}</span>
                                </div>
                                {activeProject?.id === project.id && <Check size={12} />}
                                <button
                                    onClick={(e) => handleDelete(e, project.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="p-2 border-t border-border-subtle bg-black/20">
                        {!showCreate ? (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-mono text-accent-primary hover:bg-accent-primary/10 border border-transparent hover:border-accent-primary/30 rounded-sm transition-all"
                            >
                                <Plus size={12} />
                                <span>NEW_SHOW</span>
                            </button>
                        ) : (
                            <form onSubmit={handleCreate} className="flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="SHOW_NAME..."
                                    className="flex-1 bg-black/40 border border-border-subtle text-primary text-xs px-2 py-1 focus:border-accent-primary focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="p-1.5 bg-accent-primary/20 hover:bg-accent-primary text-accent-primary hover:text-black border border-accent-primary/50 rounded-sm transition-colors"
                                >
                                    <Check size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-transparent rounded-sm transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
