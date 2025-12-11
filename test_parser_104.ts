import * as fs from 'fs';

const text = fs.readFileSync('debug_output.txt', 'utf-8');
const lines = text.split('\n').map(l => l.trim());

const days = [];
let tempScenes = [];
let currentDayNum = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Strategy 1: "Scenes:" anchor (Ep 107)
    if (line === 'Scenes:') {
        // ... (Existing logic)
        console.log(`Found Ep 107 style scene at ${i}`);
    }

    // Strategy 2: Slugline + Preceding Scene Number (Ep 104)
    // Look for INT/EXT start
    if (line.match(/^(INT|EXT|I\/E)/)) {
        // Check previous line for Scene Number pattern (e.g. 4-9, 4-11pt A)
        const prevLine = lines[i - 1] || '';
        const sceneNumMatch = prevLine.match(/^\d+-\d+/);

        if (sceneNumMatch) {
            console.log(`Found Ep 104 style scene at ${i}`);
            const sceneNum = prevLine;
            const slugline = line;

            // Parse forward for Description, Page Count, etc.
            // Ep 104:
            // i: Slugline
            // i+1: pgs.1.4, 4.4 (or similar)
            // i+2: Description

            let description = 'No description';
            let location = slugline; // Default location to slugline

            // Simple forward scan for description
            // It usually comes after "pgs..." line
            let descIdx = i + 1;
            if (lines[descIdx].startsWith('pgs.')) {
                descIdx++;
            }

            if (lines[descIdx]) {
                description = lines[descIdx];
            }

            tempScenes.push({
                sceneNumber: sceneNum,
                description: description,
                location: location
            });
        }
    }

    // End of Day Detection
    // Ep 104: --- END OF DAY 1 -- Monday, August 11, 2025 -- 3 3/8 pgs.--
    const endDayMatch = line.match(/END.*?DAY\s+(\d+)/i);
    if (endDayMatch) {
        const dayNum = parseInt(endDayMatch[1]);
        console.log(`Found End of Day ${dayNum} at ${i}`);

        days.push({
            dayNumber: dayNum,
            scenes: [...tempScenes]
        });
        tempScenes = [];
    }
}

console.log(`Parsed ${days.length} days.`);
days.forEach(d => {
    console.log(`Day ${d.dayNumber}: ${d.scenes.length} scenes`);
    d.scenes.forEach(s => console.log(`  ${s.sceneNumber}: ${s.description}`));
});
