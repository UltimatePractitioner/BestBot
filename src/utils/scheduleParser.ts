import type { ShootDay, Scene } from '../types';

// Convert date string from "Friday, September 26, 2025" or "08/11/2025" to "2025-09-26"
function convertDateToISO(dateStr: string): string {
    if (!dateStr || dateStr === 'Unknown Date') return dateStr;

    // Clean up the date string: remove extra spaces, weird punctuation
    // Keep only alphanumeric, comma, space, slash, dash
    const cleanStr = dateStr.replace(/[^A-Za-z0-9, \/\-]/g, ' ').trim().replace(/\s+/g, ' ');
    console.log(`DEBUG: Converting date '${dateStr}' -> Cleaned: '${cleanStr}'`);

    try {
        const date = new Date(cleanStr);
        if (isNaN(date.getTime())) {
            console.warn(`DEBUG: Date conversion failed for '${cleanStr}'`);
            return dateStr;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error(`DEBUG: Date conversion error:`, e);
        return dateStr;
    }
}

export function parseScheduleText(text: string, sourceFile: string = 'Unknown Source'): ShootDay[] {
    const days: ShootDay[] = [];
    const lines = text.split('\n'); // Keep empty lines for index calculations if needed, but trimming usually helps.

    // Step 1: Identify Day Boundaries
    // We look for lines containing "END OF DAY" or "END [TYPE] DAY"
    // We'll store the line index of each "End of Day" marker.
    const endDayIndices: number[] = [];



    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Check for "END DAY" marker
        if (line.match(/END\s+(?:OF\s+)?(?:[A-Z]+\s+)?DAY/i)) {
            // Check if this line is "incomplete" (missing date)
            // and if the NEXT line (scanning forward) looks like a continuation
            // Stricter check: Must have a 4-digit year OR a comma to be considered a "date line"
            const hasDate = line.match(/\d{4}/) || line.indexOf(',') > -1;

            if (!hasDate) {
                // Scan forward up to 8 lines to find the date line
                let foundContinuation = false;
                for (let k = 1; k <= 8; k++) {
                    if (i + k >= lines.length) break;

                    const nextLine = lines[i + k].trim();
                    if (!nextLine) continue; // Skip empty lines

                    // Stop if we hit a new Scene Header or "Scenes:"
                    if (nextLine.match(/^(INT|EXT|I\/E)\b/) || nextLine.match(/^Scenes:/)) {
                        console.log(`DEBUG: Hit scene header at +${k}. Stopping scan.`);
                        break;
                    }

                    console.log(`DEBUG: Checking candidate line +${k} for date: "${nextLine}"`);

                    // Check for Date Presence
                    // 1. Full Month Name + Day (e.g. "September 26")
                    // 2. Short Month + Day (e.g. "Sep 26")
                    // 3. 4-digit Year (e.g. "2025")
                    // 4. MM/DD/YYYY format
                    const hasDateContent = nextLine.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+/i) ||
                        nextLine.match(/\d{4}/) ||
                        nextLine.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);

                    if (hasDateContent) {
                        console.log(`DEBUG: Found Date Line at +${k}. Merging line ${i} and ${i + k}`);
                        // We found the real end. 
                        endDayIndices.push(i + k);

                        // Advance main loop to skip these lines
                        i += k;
                        foundContinuation = true;
                        break;
                    }

                    // If it's not a date and not a scene header, it might be "Total Pages" or other footer info.
                    // We continue scanning.
                }

                if (!foundContinuation) {
                    // If we scanned and found nothing, mark current line as end.
                    endDayIndices.push(i);
                }
            } else {
                endDayIndices.push(i);
            }
        }
    }

    if (endDayIndices.length === 0) {
        console.warn('No "END OF DAY" markers found. Attempting fallback parsing or returning empty.');
        // Fallback: Treat whole file as one day or try old method? 
        // For now, let's return empty and let the user know, or maybe try to parse scenes anyway?
        // Let's assume at least one day exists if there's text.
        if (lines.length > 0) {
            endDayIndices.push(lines.length - 1); // Treat end of file as end of day
        }
    }

    // Step 2: Process Each Block
    let startIdx = 0;

    for (let i = 0; i < endDayIndices.length; i++) {
        const endIdx = endDayIndices[i];
        const dayLines = lines.slice(startIdx, endIdx + 1); // Include the END line for date parsing

        // --- Parse the Block ---
        const parsedDay = parseDayBlock(dayLines, days.length + 1, sourceFile);
        if (parsedDay) {
            days.push(parsedDay);
        }

        startIdx = endIdx + 1;
    }

    return days;
}

function parseDayBlock(lines: string[], defaultDayNum: number, sourceFile: string): ShootDay | null {
    if (lines.length === 0) return null;

    // Handle split footer in the block
    // The `lines` array passed here ends at the detected "End Index".
    // If we did our job right in Step 1, lines[lines.length-1] is the Date Line (or the END DAY line if no date).

    let endLine = lines[lines.length - 1].trim();

    // If the last line doesn't have "END DAY", we need to find where "END DAY" is and merge everything in between.
    if (!endLine.match(/END\s+(?:OF\s+)?(?:[A-Z]+\s+)?DAY/i)) {
        // Scan back to find "END DAY"
        for (let k = 2; k <= 6; k++) {
            if (lines.length - k < 0) break;
            const prevLine = lines[lines.length - k].trim();
            if (prevLine.match(/END\s+(?:OF\s+)?(?:[A-Z]+\s+)?DAY/i)) {
                // Found it. Merge everything from here to end.
                // But we only really care about the END DAY line + the Date line.
                // The stuff in between is likely empty or garbage.
                endLine = prevLine + " " + endLine;
                console.log(`DEBUG: Merged split footer (gap of ${k - 1}): "${endLine}"`);
                break;
            }
        }
    }

    console.log(`DEBUG: Parsing Block for Day ${defaultDayNum}. End Line: "${endLine}"`);

    // 1. Extract Day Number and Date from the END line
    let dayNum = defaultDayNum;
    let dateStr = 'Unknown Date';
    let dayType = '';

    // Regex for Date: Matches "Wednesday, August 13, 2025" or "Aug 13, 2025" etc.
    const dateRegex = /([A-Za-z]+,?\s*[A-Za-z]+\s+\d+,?\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/;

    // Try to find Day Number
    const dayNumMatch = endLine.match(/DAY\s+(\d+)/i);
    if (dayNumMatch) {
        dayNum = parseInt(dayNumMatch[1]);
    }

    // Try to find Day Type (e.g. END BEACH DAY)
    const typeMatch = endLine.match(/END\s+([A-Z\s]+)\s+DAY/i);
    if (typeMatch) {
        let type = typeMatch[1].trim();
        type = type.replace(/OF/i, '').trim(); // Remove "OF" if present (END OF DAY)
        if (type && type !== 'OF') dayType = type;
    }

    // Extract Date
    const dateMatch = endLine.match(dateRegex);
    if (dateMatch) {
        dateStr = convertDateToISO(dateMatch[1].trim());
    } else {
        console.warn(`DEBUG: No date match found in end line: "${endLine}"`);
    }

    // 2. Extract Location from the TOP of the block
    // We scan the first few lines of the block.
    // User says: "THE LOCATION WILL BE JUST BELOW THE PREVIOUS DAYS END OF DAY"
    // So it should be at lines[0], lines[1], etc.

    let dayLocation = 'TBD';
    const locationBanners: string[] = [];

    // Scan first 25 lines for location banners (increased from 15)
    console.log(`DEBUG: Scanning top 25 lines for Location Banners...`);
    for (let i = 0; i < Math.min(lines.length, 25); i++) {
        const line = lines[i].trim();
        console.log(`DEBUG: Scanning Line ${i}: "${line}"`);
        if (!line) continue;

        // Heuristic: "ON LOCATION", "STAGE X", "MOVE TO"
        // Also check for just "STAGE 20" (uppercase, specific words)
        // Relaxed Heuristic for Ep 107: Any UPPERCASE line that isn't a date, "END DAY", or Scene Header

        const isExplicitBanner = line.match(/^(STAGE\s+\d+|ON\s+LOCATION|COMPANY\s+MOVE|MOVE\s+TO)/i);

        // Check if it's a standalone uppercase line (Location Name)
        // Must be > 3 chars, not a date, not "END DAY", not "INT/EXT"
        const cleanLine = line.replace(/[^A-Z0-9\s&'-]/g, ''); // Allow & and '
        const isUppercase = cleanLine.length > 3 && cleanLine.trim() === line.trim() && !line.match(/[a-z]/);

        const isDate = line.match(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December/i);
        const isEndDay = line.match(/END\s+(?:OF\s+)?(?:[A-Z]+\s+)?DAY/i);
        const isSceneHeader = line.match(/^(INT|EXT|I\/E)\b/);
        const isPageCount = line.match(/pgs\.?$/i) || line.match(/^[\d\s\/]+pgs/);

        if (isExplicitBanner || (isUppercase && !isDate && !isEndDay && !isSceneHeader && !isPageCount)) {
            // Clean it up
            let cleanLoc = line;
            cleanLoc = cleanLoc.replace(/^(ON\s+LOCATION\s*[-–:]?\s*)/i, '');
            cleanLoc = cleanLoc.replace(/^(MOVE\s+TO\s+)/i, '');
            cleanLoc = cleanLoc.replace(/^(COMPANY\s+MOVE\s*[-–:]?\s*)/i, '');

            if (cleanLoc.trim().length > 2) {
                locationBanners.push(cleanLoc.trim());
                console.log(`DEBUG: Found Banner: "${line}" -> "${cleanLoc.trim()}"`);
            }
        } else {
            console.log(`DEBUG: Rejected Banner Candidate: "${line}" (Upper: ${isUppercase}, Date: ${!!isDate}, End: ${!!isEndDay}, Header: ${!!isSceneHeader}, PageCount: ${!!isPageCount})`);
        }
    }

    if (locationBanners.length > 0) {
        dayLocation = [...new Set(locationBanners)].join(' / ');
    }

    // 3. Parse Scenes within the block
    // We reuse the logic, but applied to this slice of lines.
    // We exclude the last line (END OF DAY) from scene parsing to avoid confusion.
    const sceneLines = lines.slice(0, -1);
    const scenes = parseScenesFromBlock(sceneLines);

    // If no location found from banners, try first scene
    if (dayLocation === 'TBD' && scenes.length > 0) {
        dayLocation = scenes[0].location;
    }

    // 4. Capture Original Text
    const originalText = lines.join('\n');

    return {
        id: `day-${dayNum}`,
        dayNumber: dayNum,
        date: dateStr,
        title: `Day ${dayNum}${dayType ? ` - ${dayType}` : ''} - ${dayLocation}`,
        location: dayLocation,
        callTime: 'TBD',
        status: 'scheduled',
        scenes: scenes,
        sourceFile: sourceFile,
        originalText: originalText
    };
}

function parseScenesFromBlock(lines: string[]): Scene[] {
    const scenes: Scene[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // --- Scene Parsing Logic ---

        // Strategy 1: "Scenes:" anchor (Ep 107)
        if (line === 'Scenes:') {
            // Extract Scene Number (line before "Scenes:")
            const sceneNum = lines[i - 1]?.trim() || 'Unknown';

            // Block Scanning Strategy:
            // 1. Find the start of the block (INT/EXT/I/E) by scanning backwards.
            let k = i - 2;
            let sluglineStartIdx = -1;

            // Scan back for Slugline Start
            while (k >= Math.max(0, i - 20)) { // Limit scan to 20 lines back
                const l = lines[k].trim();
                if (l.match(/^(INT|EXT|I\/E)\b/)) {
                    sluglineStartIdx = k;
                    break;
                }
                k--;
            }

            let description = 'No description';
            let slugline = 'Unknown Location';

            if (sluglineStartIdx !== -1) {
                // We found the start. Now parse forward from there up to i-1 (Scene Num)
                const blockLines = lines.slice(sluglineStartIdx, i - 1).map(l => l.trim());

                // 1. Extract Slugline
                // Slugline includes the start line and subsequent UPPERCASE lines
                let sluglineParts = [];
                let currentBlockIdx = 0;

                while (currentBlockIdx < blockLines.length) {
                    const l = blockLines[currentBlockIdx];
                    const cleanLine = l.replace(/(?:Day|Night|Dusk|Dawn|D4N)$/i, '').trim();
                    const isUpper = cleanLine.length > 0 && cleanLine === cleanLine.toUpperCase();
                    const isSlugStart = l.match(/^(INT|EXT|I\/E)\b/);

                    if (isSlugStart || isUpper) {
                        sluglineParts.push(l);
                        currentBlockIdx++;
                    } else {
                        break;
                    }
                }
                slugline = sluglineParts.join(' ');

                // 2. Extract Description
                // Lines after Slugline, but before Cast
                let descParts = [];
                let castStartIdx = blockLines.length;
                for (let j = blockLines.length - 1; j >= currentBlockIdx; j--) {
                    const l = blockLines[j];
                    if (l.match(/[\d.,]+\s*$/) || l.match(/^[\d.,\s]+$/)) {
                        castStartIdx = j;
                    } else {
                        break;
                    }
                }

                for (let j = currentBlockIdx; j < castStartIdx; j++) {
                    descParts.push(blockLines[j]);
                }

                if (descParts.length > 0) {
                    description = descParts.join(' ');
                }
            } else {
                // Fallback
                let currentIdx = i - 2;
                while (currentIdx >= 0 && lines[currentIdx].match(/[\d.,]+/)) {
                    currentIdx--;
                }
                description = lines[currentIdx]?.trim() || 'No description';
            }

            // Extract forward details (Location)
            let location = 'TBD';
            for (let f = 1; f <= 10; f++) {
                const forwardLine = lines[i + f]?.trim();
                if (!forwardLine) continue;
                if (forwardLine.match(/^pgs\.?$/i)) continue;
                if (forwardLine.match(/^[\d\s/]+$/)) continue;
                if (forwardLine.length < 3) continue;

                if (forwardLine.match(/^(INT|EXT|I\/E)\b/)) {
                    location = forwardLine;
                    break;
                }
            }

            scenes.push({
                id: `scene-${Date.now()}-${Math.random()}`,
                sceneNumber: sceneNum,
                description: description,
                location: location || slugline
            });
            continue;
        }

        // Strategy 2: "SceneNum Slugline" on same line (Priority)
        const sameLineMatch = line.match(/^(\d+[A-Za-z0-9\-\,]*)\s+(INT|EXT|I\/E)/);
        if (sameLineMatch) {
            const sceneNum = sameLineMatch[1].trim();
            let slugline = line.substring(sceneNum.length).trim();
            const location = slugline.replace(/^(INT|EXT|I\/E)\s*/, '$1 ').trim();

            let description = 'No description';
            // Look ahead for description
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (!nextLine.match(/^(INT|EXT|I\/E)/) && !nextLine.match(/^\d+/)) {
                    description = nextLine;
                }
            }

            scenes.push({
                id: `scene-${Date.now()}-${Math.random()}`,
                sceneNumber: sceneNum,
                description: description,
                location: location
            });
            continue;
        }

        // Strategy 3: Slugline (INT/EXT) with Scene Num on previous lines
        if (line.match(/^(INT|EXT|I\/E)/)) {
            // Scan back for Scene Number
            let sceneNum = 'Unknown';
            for (let back = 1; back <= 5; back++) {
                if (i - back < 0) break;
                const prev = lines[i - back].trim();
                const match = prev.match(/^(\d+-[A-Za-z0-9\s,]+)/);
                if (match) {
                    sceneNum = match[1].trim();
                    break;
                }
                const simpleMatch = prev.match(/^(\d+[A-Z]?)$/);
                if (simpleMatch) {
                    sceneNum = simpleMatch[1].trim();
                    break;
                }
            }

            let location = line.replace(/^(INT|EXT|I\/E)\s*/, '$1 ').trim();

            // Check for split slugline (e.g. "INT" on one line, "LOCATION" on next)
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                const isNextUpper = nextLine === nextLine.toUpperCase() && nextLine.length > 2 && !nextLine.match(/\d/); // Heuristic
                const isNextDate = nextLine.match(/Day|Night|Dusk|Dawn|Morning|Afternoon/i); // Time of day usually ends slugline

                if (isNextUpper && !isNextDate) {
                    location += " " + nextLine;
                    // Skip next line in description search
                    // But we can't increment i here easily in this loop structure without messing up.
                    // Actually, we should just let the next iteration skip it? 
                    // No, if we consume it here, we should skip it.
                    // But we are just building the location string.
                    // We'll handle description skipping by checking if line is part of slugline?
                }
            }

            let description = 'No description';

            // Look ahead for description
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();

                // If next line was merged into location, skip it
                if (location.includes(nextLine)) {
                    if (i + 2 < lines.length) {
                        const nextNext = lines[i + 2].trim();
                        if (!nextNext.match(/^(INT|EXT|I\/E)/) && !nextNext.match(/^\d+/)) {
                            description = nextNext;
                        }
                    }
                } else {
                    // Skip "pgs." line
                    if (nextLine.match(/^pgs\./i) || nextLine.match(/^[\d\s\/]+pgs/)) {
                        if (i + 2 < lines.length) {
                            description = lines[i + 2].trim();
                        }
                    } else if (!nextLine.match(/^(INT|EXT|I\/E)/) && !nextLine.match(/^\d+/)) {
                        description = nextLine;
                    }
                }
            }

            scenes.push({
                id: `scene-${Date.now()}-${Math.random()}`,
                sceneNumber: sceneNum,
                description: description,
                location: location
            });
        }
    }

    return scenes;
}
