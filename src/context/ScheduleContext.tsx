import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ShootDay } from '../types';
import { parseScheduleText } from '../utils/scheduleParser';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ScheduleContextType {
    shootDays: ShootDay[];
    importSchedule: (file: File) => Promise<void>;
    deleteSchedule: (sourceFile: string) => void;
    deleteDay: (dayId: string) => void;
    clearAllSchedules: () => void;
    isLoading: boolean;
    error: string | null;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [importError, setImportError] = useState<string | null>(null);

    // 1. Fetch or Create Default Project (Reused logic, could be extracted to a hook)
    const { data: projectId } = useQuery({
        queryKey: ['defaultProject', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data: projects } = await supabase.from('projects').select('id').limit(1);
            if (projects && projects.length > 0) return projects[0].id;

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

    // 2. Fetch Data (Deep Fetch)
    // Structure: Schedules -> ShootDays -> Scenes
    const { data: shootDays = [], isLoading } = useQuery({
        queryKey: ['schedule', projectId],
        queryFn: async () => {
            if (!projectId) return [];

            const { data: schedules, error } = await supabase
                .from('schedules')
                .select(`
                    id,
                    source_file,
                    shoot_days (
                        id,
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
                            location
                        )
                    )
                `)
                .eq('project_id', projectId);

            if (error) throw error;

            // Flatten data to match existing ShootDay[] type
            // The UI expects a flat list of days.
            // We need to map the DB structure back to the Typescript interface

            const days: ShootDay[] = [];

            schedules?.forEach(schedule => {
                const scheduleDays = schedule.shoot_days as any[]; // Type assertion for now due to complex join

                scheduleDays.forEach(day => {
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
                        sourceFile: schedule.source_file, // Propagate parent file name
                        scenes: day.scenes.map((scene: any) => ({
                            id: scene.id,
                            sceneNumber: scene.scene_number,
                            description: scene.description,
                            location: scene.location
                        }))
                    });
                });
            });

            return days.sort((a, b) => a.dayNumber - b.dayNumber);
        },
        enabled: !!projectId,
    });

    // 3. Import Mutation
    const importMutation = useMutation({
        mutationFn: async ({ file, text }: { file: File, text: string }) => {
            if (!projectId) throw new Error("No active project");

            console.log('--- STARTING PARSER ---');
            const parsedDays = parseScheduleText(text, file.name);
            console.log('--- PARSER FINISHED ---', parsedDays.length, 'days found');

            if (parsedDays.length === 0) throw new Error('No valid schedule data found.');

            // A. Insert Schedule Record
            const { data: schedule, error: schedError } = await supabase
                .from('schedules')
                .insert({
                    project_id: projectId,
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
                        title: day.title,
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
            .eq('project_id', projectId); // Safety

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

    const clearAllSchedules = async () => {
        if (!projectId) return;
        await supabase.from('schedules').delete().eq('project_id', projectId);
        queryClient.invalidateQueries({ queryKey: ['schedule'] });
    };

    return (
        <ScheduleContext.Provider value={{
            shootDays,
            importSchedule,
            deleteSchedule,
            deleteDay,
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
