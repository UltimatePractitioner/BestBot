import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ShootDay } from '../types';
import { parseScheduleText } from '../utils/scheduleParser';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { apiKeyStore } from '../utils/apiKeyStore';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ScheduleContextType {
    shootDays: ShootDay[];
    importSchedule: (file: File) => Promise<void>;
    deleteSchedule: (sourceFile: string) => void;
    deleteDay: (dayId: string) => void;
    moveScene: (sceneId: string, sourceDayId: string, destDayId: string, newIndexId?: string) => void;
    clearAllSchedules: () => void;
    isLoading: boolean;
    error: string | null;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

import { useProject } from './ProjectContext';

// ... imports ...

export function ScheduleProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { activeProjectId } = useProject(); // Consume Active Project
    const queryClient = useQueryClient();
    const [importError, setImportError] = useState<string | null>(null);

    // Default Project Logic REMOVED (Handled by ProjectContext)


    // 2. Fetch Data (Deep Fetch)
    // Structure: Schedules -> ShootDays -> Scenes
    const { data: shootDays = [], isLoading } = useQuery({
        queryKey: ['schedule', activeProjectId],
        queryFn: async () => {
            if (!activeProjectId) return [];

            const { data: schedules, error } = await supabase
                .from('schedules')
                .select(`
                    id,
                    source_file,
                    shoot_days (
                        id,
                        created_at,
                        date,
                        day_number,
                        title,
                        location,
                        call_time,
                        wrap_time,
                        status,
                        notes,
                        original_text,
                        scenes (
                            id,
                            scene_number,
                            description,
                            location,
                            sort_order
                        )
                    )
                `)
                .eq('project_id', activeProjectId);

            if (error) throw error;

            // Flatten data to match existing ShootDay[] type
            // The UI expects a flat list of days.
            // We need to map the DB structure back to the Typescript interface

            const days: ShootDay[] = [];

            schedules?.forEach(schedule => {
                const scheduleDays = schedule.shoot_days as any[]; // Type assertion for now due to complex join

                scheduleDays.forEach(day => {
                    const mappedScenes = day.scenes.map((scene: any) => ({
                        id: scene.id,
                        sceneNumber: scene.scene_number,
                        description: scene.description,
                        location: scene.location,
                        sortOrder: scene.sort_order || 0
                    })) as any[];

                    // Sort scenes
                    mappedScenes.sort((a, b) => {
                        // Priority to sortOrder
                        if (a.sortOrder !== 0 && b.sortOrder !== 0) return a.sortOrder - b.sortOrder;
                        // Fallback to scene number or original order (though map preserves order of array if query ordered, but nested sort is hard in Supabase select without modifier)
                        // Ideally we should have .order('sort_order') in the nested query, but Supabase JS syntax for that is: scenes(..., sort_order).order(...)
                        // Actually easier to sort client side here.
                        return a.sortOrder - b.sortOrder;
                    });

                    days.push({
                        id: day.id,
                        date: day.date,
                        dayNumber: day.day_number,
                        title: day.title,
                        location: day.location,
                        callTime: day.call_time, // DB has snake_case
                        wrapTime: day.wrap_time,
                        status: day.status,
                        notes: day.notes,
                        originalText: day.original_text,
                        sourceFile: schedule.source_file,
                        scheduleCreatedAt: day.created_at, // Use day timestamp as proxy
                        scenes: mappedScenes
                    });
                });
            });

            return days.sort((a, b) => a.dayNumber - b.dayNumber);
        },
        enabled: !!activeProjectId,
    });

    // 3. Import Mutation
    const importMutation = useMutation({
        mutationFn: async ({ file, text }: { file: File, text: string }) => {
            if (!activeProjectId) throw new Error("No active project");

            console.log('--- STARTING PARSER (LLM) ---');
            let parsedDays: ShootDay[] = [];

            // Try LLM Parser if API Key is available
            // Try LLM Parser
            const apiKey = apiKeyStore.getEffectiveKey(user?.id);

            if (apiKey) {
                try {
                    // Dynamically import to avoid circular dependencies if any, though likely safe now
                    const { ScheduleParserLLM } = await import('../utils/scheduleParserLLM');
                    const parser = new ScheduleParserLLM(apiKey);
                    console.log('Using LLM Schedule Parser...');
                    const parsedDaysLLM = await parser.parse(text);
                    if (parsedDaysLLM && parsedDaysLLM.length > 0) {
                        parsedDays = parsedDaysLLM;
                    }
                    console.log(`LLM Parser returned ${parsedDays.length} days`);
                } catch (e: any) {
                    console.warn("LLM Parsing failed, falling back to Regex:", e);
                }
            }

            // Fallback to Regex Parser if LLM failed or not configured or returned no results
            if (parsedDays.length === 0) {
                console.log('--- FALLBACK TO REGEX PARSER ---');
                parsedDays = parseScheduleText(text, file.name);
            }

            console.log('--- PARSER FINISHED ---', parsedDays.length, 'days found');

            if (parsedDays.length === 0) throw new Error('No valid schedule data found.');

            // A. Insert Schedule Record
            const { data: schedule, error: schedError } = await supabase
                .from('schedules')
                .insert({
                    project_id: activeProjectId,
                    source_file: file.name
                })
                .select()
                .single();

            if (schedError) throw schedError;

            // B. Insert Shoot Days & Scenes
            // We have to iterate because we need the day ID to insert scenes
            for (const day of parsedDays) {
                // Insert Day
                const { data: savedDay, error: dayError } = await supabase
                    .from('shoot_days')
                    .insert({
                        schedule_id: schedule.id,
                        date: day.date,
                        day_number: day.dayNumber,
                        title: day.title || `Day ${day.dayNumber}`,
                        location: day.location,
                        call_time: day.callTime,
                        wrap_time: day.wrapTime,
                        status: day.status,
                        notes: day.notes,
                        original_text: day.originalText
                    })
                    .select()
                    .single();

                if (dayError) throw dayError;

                // Insert Scenes for this day
                if (day.scenes.length > 0) {
                    const scenesToInsert = day.scenes.map(scene => ({
                        shoot_day_id: savedDay.id,
                        scene_number: scene.sceneNumber,
                        description: scene.description,
                        location: scene.location
                    }));

                    const { error: sceneError } = await supabase
                        .from('scenes')
                        .insert(scenesToInsert);

                    if (sceneError) throw sceneError;
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedule'] });
            setImportError(null);
        },
        onError: (err: any) => {
            const msg = err?.message || (typeof err === 'string' ? err : 'Upload failed');
            setImportError(msg);
        }
    });

    const importSchedule = async (file: File) => {
        setImportError(null);
        try {
            let text = '';
            // PDF text extraction needs to happen here.
            // Using existing utils/pdfUtils (which presumably works in browser)
            // or we need to ensure pdfjs-dist is configured for browser.
            if (file.type === 'application/pdf') {
                text = await extractTextFromPDF(file);
            } else {
                text = await file.text();
            }
            await importMutation.mutateAsync({ file, text });
        } catch (err: any) {
            console.error('Import Error:', err);
            // Handle Supabase Error objects which might not be instanceof Error
            const msg = err?.message || (typeof err === 'string' ? err : 'File parsing failed');
            setImportError(msg);
        }
    };

    const deleteSchedule = async (sourceFile: string) => {
        // Find schedules with this filename and delete them
        // In real app, we should probably delete by ID, but existing UI passes filename.
        // We will query to find the schedule(s) first.
        const { data } = await supabase
            .from('schedules')
            .select('id')
            .eq('source_file', sourceFile)
            .eq('project_id', activeProjectId); // Safety

        if (data && data.length > 0) {
            const ids = data.map(s => s.id);
            await supabase.from('schedules').delete().in('id', ids);
            queryClient.invalidateQueries({ queryKey: ['schedule'] });
        }
    };

    const deleteDay = async (dayId: string) => {
        await supabase.from('shoot_days').delete().eq('id', dayId);
        queryClient.invalidateQueries({ queryKey: ['schedule'] });
    };

    const moveScene = async (sceneId: string, sourceDayId: string, destDayId: string, newIndexId?: string) => {
        // 1. Optimistic Update (Calculate new sort order locally first to update UI instantly)
        let newSortOrder = 0;

        // Find necessary data from current state
        const sourceDay = shootDays.find(d => d.id === sourceDayId);
        const destDay = shootDays.find(d => d.id === destDayId);

        if (!sourceDay || !destDay) return;

        // Calculate new Sort Order
        const destScenes = destDayId === sourceDayId
            ? destDay.scenes.filter(s => s.id !== sceneId)
            : [...destDay.scenes];

        let insertIndex = destScenes.length;
        if (newIndexId) {
            const idx = destScenes.findIndex(s => s.id === newIndexId);
            if (idx !== -1) insertIndex = idx;
        }

        // Logic for sort keys (midpoint)
        const prevItem = insertIndex > 0 ? destScenes[insertIndex - 1] : null;
        const nextItem = insertIndex < destScenes.length ? destScenes[insertIndex] : null;

        if (!prevItem && !nextItem) {
            newSortOrder = 0;
        } else if (!prevItem) {
            newSortOrder = (nextItem?.sortOrder || 0) - 1000;
        } else if (!nextItem) {
            newSortOrder = (prevItem?.sortOrder || 0) + 1000;
        } else {
            newSortOrder = ((prevItem?.sortOrder || 0) + (nextItem?.sortOrder || 0)) / 2;
        }

        // Apply Optimistic Update via QueryClient
        queryClient.setQueryData(['schedule', activeProjectId], (oldDays: ShootDay[] | undefined) => {
            if (!oldDays) return [];

            const newDays = JSON.parse(JSON.stringify(oldDays)) as ShootDay[]; // Deep clone
            const sDay = newDays.find(d => d.id === sourceDayId);
            const dDay = newDays.find(d => d.id === destDayId);

            if (!sDay || !dDay) return oldDays;

            const sceneIndex = sDay.scenes.findIndex(s => s.id === sceneId);
            if (sceneIndex === -1) return oldDays;

            const [scene] = sDay.scenes.splice(sceneIndex, 1);
            scene.sortOrder = newSortOrder;

            let cloneInsertIndex = dDay.scenes.length;
            if (newIndexId) {
                const idx = dDay.scenes.findIndex(s => s.id === newIndexId);
                if (idx !== -1) cloneInsertIndex = idx;
            }

            dDay.scenes.splice(cloneInsertIndex, 0, scene);
            return newDays;
        });

        // 2. Persist to DB
        try {
            const { error } = await supabase
                .from('scenes')
                .update({
                    shoot_day_id: destDayId,
                    sort_order: newSortOrder
                } as any)
                .eq('id', sceneId);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to move scene:", e);
            queryClient.invalidateQueries({ queryKey: ['schedule'] });
        }
    };

    const clearAllSchedules = async () => {
        if (!activeProjectId) return;
        await supabase.from('schedules').delete().eq('project_id', activeProjectId);
        queryClient.invalidateQueries({ queryKey: ['schedule'] });
    };

    return (
        <ScheduleContext.Provider value={{
            shootDays,
            importSchedule,
            deleteSchedule,
            deleteDay,
            moveScene,
            clearAllSchedules,
            isLoading: isLoading || importMutation.isPending,
            error: importError
        }}>
            {children}
        </ScheduleContext.Provider>
    );
}

export function useSchedule() {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useSchedule must be used within a ScheduleProvider');
    }
    return context;
}
