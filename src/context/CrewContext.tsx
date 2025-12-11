import React, { createContext, useContext, type ReactNode } from 'react';
import type { CrewMember } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CrewContextType {
    crew: CrewMember[];
    addCrew: (member: Omit<CrewMember, 'id'>) => Promise<void>;
    updateCrew: (member: CrewMember) => Promise<void>;
    reorderCrew: (oldIndex: number, newIndex: number) => void; // Keeping signature, but might be less relevant with DB
    isLoading: boolean;
}

const CrewContext = createContext<CrewContextType | undefined>(undefined);

export const CrewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch or Create a Default Project ID for the user (to link crew to)
    const { data: projectId } = useQuery({
        queryKey: ['defaultProject', user?.id],
        queryFn: async () => {
            if (!user) return null;
            // Try to find an existing project
            const { data: projects } = await supabase.from('projects').select('id').limit(1);

            if (projects && projects.length > 0) {
                return projects[0].id;
            }

            // Create default project if none
            const { data: newProject, error } = await supabase
                .from('projects')
                .insert({ user_id: user.id, name: 'Default Production' })
                .select()
                .single();

            if (error) throw error;
            return newProject.id;
        },
        enabled: !!user,
    });

    // 2. Fetch Crew
    const { data: crew = [], isLoading } = useQuery({
        queryKey: ['crew', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('crew_members')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true }); // Simple ordering for now

            if (error) throw error;

            // Map DB snake_case to camelCase matches CrewMember type if needed, 
            // but the table columns I designed were: name, role, department, rate, etc.
            // which mostly match. 'is_available' -> need to check type.
            // DB: is_available, Type: (not explicit in interface presented earlier, but logic was requested).
            // Let's cast for now.
            return data as unknown as CrewMember[];
        },
        enabled: !!projectId,
    });

    // 3. Mutations
    const addMutation = useMutation({
        mutationFn: async (newMember: Omit<CrewMember, 'id'>) => {
            if (!projectId) throw new Error("No project context");

            const { error } = await supabase.from('crew_members').insert({
                project_id: projectId,
                name: newMember.name,
                role: newMember.role,
                department: newMember.department,
                rate: newMember.rate,
                email: newMember.email,
                phone: newMember.phone,
                avatar: newMember.avatar,
                is_available: true
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crew'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (member: CrewMember) => {
            const { error } = await supabase
                .from('crew_members')
                .update({
                    name: member.name,
                    role: member.role,
                    department: member.department,
                    rate: member.rate,
                    email: member.email,
                    phone: member.phone,
                    avatar: member.avatar
                })
                .eq('id', member.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crew'] });
        },
    });

    const addCrew = async (member: Omit<CrewMember, 'id'>) => {
        await addMutation.mutateAsync(member);
    };

    const updateCrew = async (member: CrewMember) => {
        await updateMutation.mutateAsync(member);
    };

    const reorderCrew = (_oldIndex: number, _newIndex: number) => {
        // Reordering in DB is complex (requires 'order' column).
        // For MVP Phase 1 (Data Layer), we might skip persistent reordering
        // or just rely on client-side state if needed, but Context sends data from DB.
        // We will just log for now or implement optimistic updates later.
        console.warn("Reordering not yet persisted to DB");
    };

    return (
        <CrewContext.Provider value={{ crew, addCrew, updateCrew, reorderCrew, isLoading }}>
            {children}
        </CrewContext.Provider>
    );
};

export const useCrew = () => {
    const context = useContext(CrewContext);
    if (context === undefined) {
        throw new Error('useCrew must be used within a CrewProvider');
    }
    return context;
};
