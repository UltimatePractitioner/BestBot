import { createContext, useContext, type ReactNode } from 'react';
import { type CrewMember } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '../types/database.types';

type CrewRow = Database['public']['Tables']['crew']['Row'];
type CrewInsert = Database['public']['Tables']['crew']['Insert'];

interface CrewContextType {
    crew: CrewMember[];
    addCrew: (member: Omit<CrewMember, 'id'>) => Promise<void>;
    removeCrew: (id: string) => Promise<void>;
    updateCrew: (id: string, updates: Partial<CrewMember>) => Promise<void>;
    reorderCrew: (oldIndex: number, newIndex: number) => void;
    isLoading: boolean;
    error: string | null;
}

const CrewContext = createContext<CrewContextType | undefined>(undefined);

import { useProject } from './ProjectContext';

export function CrewProvider({ children }: { children: ReactNode }) {
    // const { user } = useAuth(); // Unused now
    const { activeProjectId } = useProject(); // Consume Active Project
    const queryClient = useQueryClient();

    // Default Project Query REMOVED

    // 2. Fetch Crew
    const { data: crew = [], isLoading, error } = useQuery({
        queryKey: ['crew', activeProjectId],
        queryFn: async () => {
            if (!activeProjectId) return [];
            const { data, error } = await supabase
                .from('crew')
                .select('*')
                .eq('project_id', activeProjectId)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true }); // Secondary sort

            if (error) throw error;

            return data.map((row: CrewRow) => ({
                id: row.id,
                name: row.name,
                role: row.role || 'Crew',
                department: (row.department as any) || 'Production', // Cast type
                rate: row.rate || 0,
                email: row.email || '',
                phone: row.phone || '',
                avatar: row.avatar || '',
                sortOrder: (row as any).sort_order || 0
            }));
        },
        enabled: !!activeProjectId,
    });

    // 3. Mutations
    const addCrewMutation = useMutation({
        mutationFn: async (member: Omit<CrewMember, 'id'>) => {
            if (!activeProjectId) throw new Error("No Project ID");
            const newMember: CrewInsert = {
                project_id: activeProjectId,
                name: member.name,
                role: member.role,
                department: member.department,
                rate: member.rate,
                email: member.email,
                phone: member.phone,
                avatar: member.avatar
            };
            const { error } = await supabase.from('crew').insert(newMember);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crew', activeProjectId] });
        }
    });

    const removeCrewMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('crew').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crew', activeProjectId] });
        }
    });

    const reorderCrew = async (oldIndex: number, newIndex: number) => {
        // Optimistic UI update could be done here by manipulating query cache, but simplest is to perform update and refetch.
        // Actually for DnD, we want responsiveness.
        // But first, calculate new sort_order.

        let newOrder = 0;
        const currentCrew = [...crew]; // Assuming this is sorted
        const movedItem = currentCrew[oldIndex];

        // Remove item from array to simulate placement
        const newArray = [...currentCrew];
        newArray.splice(oldIndex, 1);
        newArray.splice(newIndex, 0, movedItem);

        // Calculate sort order based on neighbors
        const prevItem = newIndex > 0 ? newArray[newIndex - 1] : null;
        const nextItem = newIndex < newArray.length - 1 ? newArray[newIndex + 1] : null;

        if (!prevItem && !nextItem) {
            newOrder = 0; // Only item
        } else if (!prevItem) {
            // First item
            newOrder = (nextItem?.sortOrder || 0) - 1000;
        } else if (!nextItem) {
            // Last item
            newOrder = (prevItem?.sortOrder || 0) + 1000;
        } else {
            // Middle
            newOrder = ((prevItem.sortOrder || 0) + (nextItem.sortOrder || 0)) / 2;
        }

        // Optimistically update
        queryClient.setQueryData(['crew', activeProjectId], newArray.map(c =>
            c.id === movedItem.id ? { ...c, sortOrder: newOrder } : c
        ));

        // Persist
        try {
            const { error } = await supabase
                .from('crew')
                .update({ sort_order: newOrder } as any) // Cast any because sort_order might not be in generated types yet
                .eq('id', movedItem.id);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to persist crew order:", e);
            queryClient.invalidateQueries({ queryKey: ['crew', activeProjectId] });
        }
    };

    const updateCrew = async (id: string, updates: Partial<CrewMember>) => {
        // TODO implement if needed
        console.log("Update crew implementation pending", id, updates);
    };

    return (
        <CrewContext.Provider value={{
            crew,
            addCrew: async (m) => await addCrewMutation.mutateAsync(m),
            removeCrew: async (id) => await removeCrewMutation.mutateAsync(id),
            updateCrew,
            reorderCrew,
            isLoading,
            error: error ? (error as Error).message : null
        }}>
            {children}
        </CrewContext.Provider>
    );
}

export const useCrew = () => {
    const context = useContext(CrewContext);
    if (context === undefined) {
        throw new Error('useCrew must be used within a CrewProvider');
    }
    return context;
};
