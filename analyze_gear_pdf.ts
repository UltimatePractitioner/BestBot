
import { extractTextFromPDF } from './src/utils/pdfUtils';
import fs from 'fs';
import path from 'path';

const pdfPath = path.join(process.cwd(), 'ALS - Shoot Truck Pkg_O# 992968.pdf');

async function run() {
    try {
        const fileBuffer = fs.readFileSync(pdfPath);
        // Mock a File object since extractTextFromPDF expects one (or modify it to take buffer, but let's see)
        // Actually pdfUtils uses pdfjs-dist which takes array buffer usually.
        // Let's look at pdfUtils first.

        // Wait, I can't easily mock File in Node environment without polyfills.
        // Let's just use pdfjs-dist directly if pdfUtils is browser-bound.
        // Or I can check if pdfUtils handles ArrayBuffer.

        // Let's just try to read it using the same logic as pdfUtils but adapted for Node.
        const pdfjsLib = await import('pdfjs-dist');

        // Point to the worker
        // In node we might not need the worker setup the same way or it might fail.
        // Let's try a simpler approach: just read the file and use a basic pdf parser if possible, 
        // or just try to use the existing function if I can mock the File.

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

        console.log(fullText);

    } catch (error) {
        console.error("Error reading PDF:", error);
    }
}

run();
