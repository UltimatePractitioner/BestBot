
import fs from 'fs';
import path from 'path';
import { ScheduleParserLLM } from './src/utils/scheduleParserLLM';
import * as dotenv from 'dotenv';
dotenv.config();

// const pdfPath = path.join(process.cwd(), 'White Plains_S1_Oneline_104_Official_080825.pdf');
const pdfPath = path.join(process.cwd(), 'White Plains_S1_Oneline_107_Official_092525.pdf'); // Using Ep107 as it was problematic before

async function run() {
    try {
        console.log(`Reading PDF: ${pdfPath}`);
        const fileBuffer = fs.readFileSync(pdfPath);

        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        const data = new Uint8Array(fileBuffer);
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Add some newlines to preserve structure better
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n`;
        }

        console.log(`Extracted Text Length: ${fullText.length} characters`);

        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("ERROR: No API Key found.");
            process.exit(1);
        }

        const parser = new ScheduleParserLLM(apiKey);
        console.log("Parsing schedule with LLM...");
        const days = await parser.parse(fullText);

        console.log("\n--- Parsing Result ---");
        days.forEach((day: any) => {
            console.log(`\nDay ${day.dayNumber} [${day.date}]: ${day.location}`);
            console.log(`Scenes: ${day.scenes?.length || 0}`);
            day.scenes?.forEach((s: any) => {
                console.log(`  - Scene ${s.sceneNumber}: ${s.slugline} (${s.description})`);
            });
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
