export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            projects: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    user_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    user_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    user_id?: string
                }
            }
            shoot_days: {
                Row: {
                    id: string
                    created_at: string
                    date: string
                    day_number: number
                    title: string
                    location: string
                    call_time: string
                    wrap_time: string | null
                    status: string
                    notes: string | null
                    original_text: string | null
                    project_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    date: string
                    day_number: number
                    title?: string
                    location?: string
                    call_time?: string
                    wrap_time?: string | null
                    status?: string
                    notes?: string | null
                    original_text?: string | null
                    project_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    date?: string
                    day_number?: number
                    title?: string
                    location?: string
                    call_time?: string
                    wrap_time?: string | null
                    status?: string
                    notes?: string | null
                    original_text?: string | null
                    project_id?: string
                }
            }
            scenes: {
                Row: {
                    id: string
                    shoot_day_id: string
                    scene_number: string
                    description: string
                    location: string
                }
                // Simplified for brevity, normally generated
            }
            crew: {
                Row: {
                    id: string
                    project_id: string
                    name: string
                    role: string | null
                    department: string | null
                    rate: number | null
                    email: string | null
                    phone: string | null
                    avatar: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    name: string
                    role?: string | null
                    department?: string | null
                    rate?: number | null
                    email?: string | null
                    phone?: string | null
                    avatar?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    name?: string
                    role?: string | null
                    department?: string | null
                    rate?: number | null
                    email?: string | null
                    phone?: string | null
                    avatar?: string | null
                    created_at?: string
                }
            }
            time_cards: {
                Row: {
                    id: string
                    shoot_day_id: string
                    crew_member_id: string | null
                    role: string | null
                    department: string | null
                    rate: number | null
                    in_time: string | null
                    out_time: string | null
                    meal1_in: string | null
                    meal1_out: string | null
                    meal2_in: string | null
                    meal2_out: string | null
                    mp_count: number
                    ndb: boolean
                    grace: boolean
                    ot_override: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    shoot_day_id: string
                    crew_member_id?: string | null
                    role?: string | null
                    department?: string | null
                    rate?: number | null
                    in_time?: string | null
                    out_time?: string | null
                    meal1_in?: string | null
                    meal1_out?: string | null
                    meal2_in?: string | null
                    meal2_out?: string | null
                    mp_count?: number
                    ndb?: boolean
                    grace?: boolean
                    ot_override?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    shoot_day_id?: string
                    crew_member_id?: string | null
                    role?: string | null
                    department?: string | null
                    rate?: number | null
                    in_time?: string | null
                    out_time?: string | null
                    meal1_in?: string | null
                    meal1_out?: string | null
                    meal2_in?: string | null
                    meal2_out?: string | null
                    mp_count?: number
                    ndb?: boolean
                    grace?: boolean
                    ot_override?: boolean
                    created_at?: string
                }
            }
        }
    }
}
