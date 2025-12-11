const fs = require('fs');
const pdf = require('pdf-parse');

const parseOneLine = async () => {
    const dataBuffer = fs.readFileSync('sample oneline.pdf');
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Simple heuristic parser
    const days = [];
    let currentDay = null;

    // Split text into lines for easier processing
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let buffer = [];

    // Regex to find "END DAY X"
    const endDayRegex = /END DAY (\d+) — (.*?) — (.*?) Total Pages/i;

    // Regex to find Scene Start (INT/EXT)
    // Note: PDF text might merge INT/EXT with the location, e.g. "INTJOHN"
    const sceneStartRegex = /^(INT|EXT|I\/E)/;

    let sceneBuffer = [];

    // We'll iterate and try to group by Day
    // Since "END DAY" is at the end, we collect lines until we hit it.

    let currentScenes = [];

    // Fix slugline spacing (e.g. INTJOHN -> INT. JOHN or INT JOHN)
    // We'll just add a space after INT/EXT/I/E if followed immediately by a letter
    const fixSlugline = (slug) => {
        return slug.replace(/^(INT|EXT|I\/E)(?=[A-Z0-9])/, '$1 ');
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for End of Day
        const endDayMatch = line.match(endDayRegex);
        if (endDayMatch) {
            const dayNum = parseInt(endDayMatch[1]);
            const dateStr = endDayMatch[2];

            days.push({
                dayNumber: dayNum,
                date: dateStr,
                scenes: [...currentScenes],
                rawContent: sceneBuffer.join('\n')
            });

            currentScenes = [];
            sceneBuffer = [];
            continue;
        }

        sceneBuffer.push(line);

        // Try to identify scenes within the buffer
        // This is tricky with raw text, but let's try to find Sluglines
        if (sceneStartRegex.test(line)) {
            // This is likely a slugline.
            // The lines following it are Description, Cast, Scene #, etc.
            // Let's grab the next few lines as a "Scene Block"

            // Heuristic: 
            // Line 1: Slugline (e.g. INTJOHN...)
            // Line 2: Day/Night
            // Line 3: Description
            // Line 4: Cast
            // Line 5: Scene Number

            // We can look ahead if possible, or just store the index
            const slugline = fixSlugline(line);
            const timeOfDay = lines[i + 1] || '';
            const description = lines[i + 2] || '';
            const cast = lines[i + 3] || '';
            const sceneNum = lines[i + 4] || '';

            // Only add if it looks like a scene (has Day/Night)
            if (['Day', 'Night', 'Morning', 'Evening', 'D4N'].some(t => timeOfDay.includes(t))) {
                currentScenes.push({
                    slugline,
                    timeOfDay,
                    description,
                    cast,
                    sceneNum
                });
            }
        }
    }

    return days;
};

parseOneLine().then(days => {
    const outputPath = './src/data/schedule.json';
    // Ensure directory exists
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(days, null, 2));
    console.log(`Successfully wrote schedule to ${outputPath}`);
}).catch(console.error);
