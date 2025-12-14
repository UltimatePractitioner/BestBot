import { createContext, useContext, type ReactNode } from 'react';
import { useSchedule } from './ScheduleContext';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '../types/database.types';

type TimeCardRow = Database['public']['Tables']['time_cards']['Row'];

export interface TimeCardEntry {
    id?: string;
    crewMemberId: string; // Foreign key to Crew
    shootDayId: string;
    role?: string;
    department?: string;
    rate?: number;
    call?: string;
    meal1In?: string;
    meal1Out?: string;
    meal2In?: string;
    meal2Out?: string;
    wrap?: string;
    kits?: string;
    cars?: string;
    mpCount?: number;
    ndb?: boolean;
    grace?: boolean;
    otOverride?: boolean;
}

interface TimeCardContextType {
    timeCards: TimeCardEntry[];
    getTimeCardsByDay: (dayId: string) => TimeCardEntry[];
    upsertTimeCard: (entry: TimeCardEntry) => Promise<void>;
    deleteTimeCard: (id: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const TimeCardContext = createContext<TimeCardContextType | undefined>(undefined);

export function TimeCardProvider({ children }: { children: ReactNode }) {
    const { shootDays } = useSchedule();
    const queryClient = useQueryClient();

    const { data: timeCards = [], isLoading, error } = useQuery({
        queryKey: ['timeCards', shootDays.map(d => d.id).join(',')], // Depend on loaded shoot days
        queryFn: async () => {
            if (!shootDays || shootDays.length === 0) return [];

            const dayIds = shootDays.map(d => d.id);

            const { data, error } = await supabase
                .from('time_cards')
                .select('*')
                .in('shoot_day_id', dayIds);

            if (error) throw error;

            return data.map((row: TimeCardRow) => ({
                id: row.id,
                crewMemberId: row.crew_member_id || '',
                shootDayId: row.shoot_day_id,
                role: row.role || undefined,
                department: row.department || undefined,
                rate: row.rate || undefined,
                call: row.in_time || '',
                wrap: row.out_time || '',
                meal1In: row.meal1_in || '',
                meal1Out: row.meal1_out || '',
                meal2In: row.meal2_in || '',
                meal2Out: row.meal2_out || '',
                mpCount: row.mp_count || 0,
                ndb: row.ndb || false,
                grace: row.grace || false,
                otOverride: row.ot_override || false,
            }));
        },
        enabled: shootDays.length > 0,
    });

    const upsertTimeCard = async (entry: TimeCardEntry) => {
        // Prepare DB object
        const dbEntry: any = {
            shoot_day_id: entry.shootDayId,
            crew_member_id: entry.crewMemberId, // what if null?
            role: entry.role,
            department: entry.department,
            rate: entry.rate,
            in_time: entry.call,
            out_time: entry.wrap,
            meal1_in: entry.meal1In,
            meal1_out: entry.meal1Out,
            meal2_in: entry.meal2In,
            meal2_out: entry.meal2Out,
            mp_count: entry.mpCount,
            ndb: entry.ndb,
            grace: entry.grace,
            ot_override: entry.otOverride
        };

        if (entry.id) {
            dbEntry.id = entry.id;
        }

        const { error } = await supabase
            .from('time_cards')
            .upsert(dbEntry)
            .select();

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['timeCards'] });
    };

    const getTimeCardsByDay = (dayId: string) => {
        return timeCards.filter(tc => tc.shootDayId === dayId);
    };

    const deleteTimeCard = async (id: string) => {
        const { error } = await supabase
            .from('time_cards')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting time card:', error);
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['timeCards'] });
    };

    return (
        <TimeCardContext.Provider value={{
            timeCards,
            getTimeCardsByDay,
            upsertTimeCard,
            deleteTimeCard,
            isLoading,
            error: error ? (error as Error).message : null
        }}>
            {children}
        </TimeCardContext.Provider>
    );
}

export const useTimeCard = () => {
    const context = useContext(TimeCardContext);
    if (context === undefined) {
        throw new Error('useTimeCard must be used within a TimeCardProvider');
    }
    return context;
};
