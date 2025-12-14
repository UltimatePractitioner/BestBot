
import fs from 'fs';
import path from 'path';
import { GearParser } from './src/utils/gearParser';
import * as dotenv from 'dotenv';
dotenv.config();

const pdfPath = path.join(process.cwd(), 'ALS - Shoot Truck Pkg_O# 992968.pdf');

async function run() {
    try {
        const fileBuffer = fs.readFileSync(pdfPath);
        // Use legacy build for Node.js environment to avoid DOMMatrix errors
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        const data = new Uint8Array(fileBuffer);
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n`;
        }

        console.log("Extracted Text Length:", fullText.length);

        // Initialize parser with API Key from env (Support both for testing)
        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("WARNING: No API Key found (GEMINI_API_KEY or OPENAI_API_KEY).");
        }

        const parser = new GearParser(apiKey || '');
        console.log("Parsing with LLM...");
        const items = await parser.parse(fullText);

        console.log("--- Extracted Gear Items ---");
        console.log(JSON.stringify(items, null, 2));

    } catch (error) {
        console.error("Error reading PDF:", error);
    }
}

run();
