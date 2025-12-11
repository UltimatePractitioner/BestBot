import { type ShootDay } from '../types';

export const MOCK_SHOOT_DAYS: ShootDay[] = [
    {
        id: '1',
        dayNumber: 1,
        date: '2025-11-20',
        title: 'Principal Photography - Day 1',
        location: 'Studio A - Soundstage 3',
        callTime: '06:00 AM',
        status: 'completed',
        scenes: [
            { id: 's1', sceneNumber: '1A', description: 'Hero enters the bar', location: 'Bar Set' },
            { id: 's2', sceneNumber: '1B', description: 'Hero orders a drink', location: 'Bar Set' },
        ],
        notes: 'Heavy equipment load-in at 5am.'
    },
    {
        id: '2',
        dayNumber: 2,
        date: '2025-11-21',
        title: 'Exterior Night Shoot',
        location: 'Downtown Alley (Permit #4421)',
        callTime: '04:00 PM',
        status: 'scheduled',
        scenes: [
            { id: 's3', sceneNumber: '14', description: 'Chase sequence start', location: 'Alley' },
            { id: 's4', sceneNumber: '15', description: 'Hero hides in dumpster', location: 'Alley' },
        ],
        notes: 'Rain towers needed. Extra generator power required.'
    },
    {
        id: '3',
        dayNumber: 3,
        date: '2025-11-22',
        title: 'Interior Apartment',
        location: 'Location House - 123 Maple St',
        callTime: '08:00 AM',
        status: 'scheduled',
        scenes: [
            { id: 's5', sceneNumber: '4', description: 'Breakfast conversation', location: 'Kitchen' },
        ],
    },
    {
        id: '4',
        dayNumber: 4,
        date: '2025-11-25',
        title: 'Stunt Prep & Rehearsal',
        location: 'Warehouse B',
        callTime: '09:00 AM',
        status: 'scouting',
        scenes: [],
        notes: 'Safety meeting at 09:00 sharp.'
    }
];

export const MOCK_CREW: import('../types').CrewMember[] = [
    { id: 'c1', name: 'Sarah Jenkins', role: 'Director of Photography', department: 'Camera', rate: 850, email: 'sarah.j@example.com', phone: '555-0101' },
    { id: 'c2', name: 'Mike Chen', role: 'Camera Operator', department: 'Camera', rate: 600, email: 'mike.c@example.com', phone: '555-0102' },
    { id: 'c3', name: 'Jessica Alverez', role: '1st AC', department: 'Camera', rate: 450, email: 'jess.a@example.com', phone: '555-0103' },
    { id: 'c4', name: 'Tom Wilson', role: 'Gaffer', department: 'Electric', rate: 550, email: 'tom.w@example.com', phone: '555-0104' },
    { id: 'c5', name: 'David Black', role: 'Key Grip', department: 'Grip', rate: 550, email: 'david.b@example.com', phone: '555-0105' },
    { id: 'c6', name: 'Emma White', role: 'Sound Mixer', department: 'Sound', rate: 650, email: 'emma.w@example.com', phone: '555-0106' },
    { id: 'c7', name: 'Chris Green', role: 'Boom Operator', department: 'Sound', rate: 400, email: 'chris.g@example.com', phone: '555-0107' },
    { id: 'c8', name: 'Amanda Lee', role: 'Production Designer', department: 'Art', rate: 700, email: 'amanda.l@example.com', phone: '555-0108' },
    { id: 'c9', name: 'Robert Taylor', role: 'Stunt Coordinator', department: 'Stunts', rate: 900, email: 'rob.t@example.com', phone: '555-0109' },
    { id: 'c10', name: 'Lisa Brown', role: 'Makeup Artist', department: 'Makeup', rate: 450, email: 'lisa.b@example.com', phone: '555-0110' },
];
