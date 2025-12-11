import * as fs from 'fs';
import { parseScheduleText } from './src/utils/scheduleParser';

const text = fs.readFileSync('debug_output.txt', 'utf-8');
const sourceFile = 'White Plains_S1_Oneline_107_Official_092525.pdf';
const days = parseScheduleText(text, sourceFile);

console.log(`Parsed ${days.length} days.`);
days.forEach(day => {
    console.log(`Day ${day.dayNumber}: ${day.date} - ${day.scenes.length} scenes`);
    day.scenes.forEach(scene => {
        console.log(`  Scene ${scene.sceneNumber}: ${scene.description} (${scene.location})`);
    });
});
