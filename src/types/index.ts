export type ShootStatus = 'scheduled' | 'completed' | 'cancelled' | 'scouting';

export interface Scene {
    id: string;
    sceneNumber: string;
    description: string;
    location: string;
    sortOrder?: number;
    pages?: string | number;
    slugline?: string;
}

export interface ShootDay {
    id: string;
    date: string; // ISO date string
    dayNumber: number;
    title: string; // e.g., "Day 1 - Studio A"
    location: string;
    callTime: string; // e.g., "07:00 AM"
    wrapTime?: string;
    status: ShootStatus;
    scenes: Scene[];
    notes?: string;
    sourceFile?: string;
    scheduleCreatedAt?: string; // Timestamp from the parent schedule record
    originalText?: string; // Raw text content for this day
}

export type Department =
    | 'Production'
    | 'Camera'
    | 'Sound'
    | 'Grip'
    | 'Electric'
    | 'Art'
    | 'Makeup'
    | 'Wardrobe'
    | 'Stunts'
    | 'Locations'
    | 'Transportation'
    | 'Catering';

export interface CrewMember {
    id: string;
    name: string;
    role: string;
    department: Department;
    rate: number;
    email: string;
    phone: string;
    avatar?: string;
    sortOrder?: number;
}
