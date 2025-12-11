import { parseScheduleText } from './src/utils/scheduleParser';
import * as fs from 'fs';

// Read the extracted PDF text
const text = fs.readFileSync('/tmp/ep104_raw_text.txt', 'utf-8');

console.log('=== TESTING EPISODE 104 PARSER ===\n');

const result = parseScheduleText(text, 'Episode 104 Test');

console.log(`\n=== RESULTS ===`);
console.log(`Total days parsed: ${result.length}`);

result.forEach((day, idx) => {
    console.log(`\nDay ${day.dayNumber}:`);
    console.log(`  Date: ${day.date}`);
    console.log(`  Scenes: ${day.scenes.length}`);
    day.scenes.forEach(scene => {
        console.log(`    - Scene ${scene.sceneNumber}: ${scene.description.substring(0, 50)}...`);
    });
});
