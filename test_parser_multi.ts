import * as fs from 'fs';
import { parseScheduleText } from './src/utils/scheduleParser';

const text = fs.readFileSync('schedule_sample.txt', 'utf-8');
const sourceFile = 'Test_Schedule.pdf';
const days = parseScheduleText(text, sourceFile);

console.log(`Parsed ${days.length} days from ${sourceFile}.`);
const firstDay = days[0];
if (firstDay) {
    console.log(`Day 1 Source: ${firstDay.sourceFile}`);
    if (firstDay.sourceFile === sourceFile) {
        console.log('SUCCESS: Source file attached correctly.');
    } else {
        console.log(`FAILURE: Expected ${sourceFile}, got ${firstDay.sourceFile}`);
    }
}
