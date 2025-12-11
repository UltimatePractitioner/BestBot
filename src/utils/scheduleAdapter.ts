import type { ShootDay, Scene } from '../types';
import { PARSED_SCHEDULE } from '../data/parsedSchedule';

interface ParsedScene {
    slugline: string;
    timeOfDay: string;
    description: string;
    cast: string;
    sceneNum: string;
}

interface ParsedDay {
    dayNumber: number;
    date: string;
    scenes: ParsedScene[];
    rawContent: string;
}

export const adaptParsedSchedule = (parsedData: ParsedDay[]): ShootDay[] => {
    return parsedData.map((day) => {
        // Extract Call Time
        const callTimeMatch = day.rawContent.match(/Approximate Call Time:\s*(.*)/i);
        const callTime = callTimeMatch ? callTimeMatch[1].trim() : 'TBD';

        // Determine Location (heuristic: use first scene's slugline)
        const location = day.scenes.length > 0
            ? day.scenes[0].slugline
            : 'Company Move / TBD';

        // Map Scenes
        const scenes: Scene[] = day.scenes.map((scene, sIndex) => ({
            id: `d${day.dayNumber}-s${sIndex}`,
            sceneNumber: scene.sceneNum,
            description: scene.description,
            location: scene.slugline // Using slugline as location for now
        }));

        // Determine Status
        // For demo, let's say past dates are completed, future are scheduled.
        // But since dates are in 2025, they are all scheduled.
        const status = 'scheduled';

        return {
            id: `day-${day.dayNumber}`,
            dayNumber: day.dayNumber,
            date: day.date, // The UI handles date strings well enough usually, or we can parse if needed
            title: `Day ${day.dayNumber} - ${location.split('-')[0].trim()}`, // Simplified title
            location: location,
            callTime: callTime,
            status: status,
            scenes: scenes,
            notes: day.rawContent.includes('COMPANY OFF') ? 'Company Off' : undefined
        };
    });
};

export const SCHEDULE_DATA = adaptParsedSchedule(PARSED_SCHEDULE);
