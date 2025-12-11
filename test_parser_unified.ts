import * as fs from 'fs';
import { parseScheduleText } from './src/utils/scheduleParser';

const files = [
    { name: 'Ep 104', path: 'debug_output_104.txt', source: 'White Plains_S1_Oneline_104_Official_080825.pdf' },
    { name: 'Ep 107', path: 'debug_output_107.txt', source: 'White Plains_S1_Oneline_107_Official_092525.pdf' }
];

files.forEach(file => {
    console.log(`\n--- Testing ${file.name} ---`);
    if (fs.existsSync(file.path)) {
        const text = fs.readFileSync(file.path, 'utf-8');
        const days = parseScheduleText(text, file.source);
        console.log(`Parsed ${days.length} days.`);

        if (days.length === 0) {
            console.error(`FAILURE: No days parsed for ${file.name}`);
        } else {
            console.log(`SUCCESS: Parsed ${days.length} days.`);
            // Print first day details
            const d = days[0];
            console.log(`Day ${d.dayNumber}: ${d.scenes.length} scenes`);
            d.scenes.forEach(s => console.log(`  ${s.sceneNumber}: ${s.description} (${s.location})`));
        }
    } else {
        console.error(`File not found: ${file.path}`);
    }
});
