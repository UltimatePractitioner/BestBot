import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '../types/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    activeProjectId: string | null;
    createProject: (name: string) => Promise<void>;
    switchProject: (projectId: string) => void;
    deleteProject: (projectId: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
        return localStorage.getItem('activeProjectId');
    });

    // Fetch User's Projects
    const { data: projects = [], isLoading, error } = useQuery({
        queryKey: ['projects', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    // Set Initial Active Project logic
    useEffect(() => {
        if (!isLoading && projects.length > 0) {
            // If no active project, or active project invalid, set to first
            if (!activeProjectId || !projects.find(p => p.id === activeProjectId)) {
                setActiveProjectId(projects[0].id);
            }
        } else if (!isLoading && projects.length === 0 && user) {
            // Auto-create default if none exist
            createProject('Default Production');
        }
    }, [projects, activeProjectId, isLoading, user]);

    // Persist active selection
    useEffect(() => {
        if (activeProjectId) {
            localStorage.setItem('activeProjectId', activeProjectId);
        } else {
            localStorage.removeItem('activeProjectId');
        }
    }, [activeProjectId]);

    const createProject = async (name: string) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('projects')
            .insert({ user_id: user.id, name })
            .select()
            .single();

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        setActiveProjectId(data.id);
    };

    const switchProject = (projectId: string) => {
        if (projects.find(p => p.id === projectId)) {
            setActiveProjectId(projectId);
        }
    };

    const deleteProject = async (projectId: string) => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;

        // If we deleted the active project, clear it
        if (activeProjectId === projectId) {
            setActiveProjectId(null);
        }

        await queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    return (
        <ProjectContext.Provider value={{
            projects,
            activeProject,
            activeProjectId,
            createProject,
            switchProject,
            deleteProject,
            isLoading,
            error: error ? (error as Error).message : null
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
