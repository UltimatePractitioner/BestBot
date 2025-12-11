import * as fs from 'fs';
import { parseScheduleText } from './src/utils/scheduleParser';

const text = fs.readFileSync('schedule_sample.txt', 'utf-8');
const days = parseScheduleText(text);

console.log(`Parsed ${days.length} days.`);
days.forEach(day => {
    console.log(`Day ${day.dayNumber}: ${day.date} - ${day.scenes.length} scenes`);
    day.scenes.forEach(scene => {
        console.log(`  Scene ${scene.sceneNumber}: ${scene.description} (${scene.location})`);
    });
});
