import * as pdfjsLib from 'pdfjs-dist';

// Initialize worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Group items by Y coordinate (with tolerance)
        const lines: { y: number; items: { x: number; str: string }[] }[] = [];
        const tolerance = 2.0; // Vertical tolerance in PDF units

        for (const item of textContent.items as any[]) {
            const tx = item.transform; // [scaleX, skewY, skewX, scaleY, x, y]
            const x = tx[4];
            const y = tx[5];
            const str = item.str;

            // Find an existing line that matches this Y
            let line = lines.find(l => Math.abs(l.y - y) < tolerance);

            if (!line) {
                line = { y, items: [] };
                lines.push(line);
            }

            line.items.push({ x, str });
        }

        // Sort lines top-to-bottom (PDF y starts at bottom usually, so higher Y is higher up)
        // Actually, standard PDF coord system: (0,0) is bottom-left. So sort Descending Y.
        lines.sort((a, b) => b.y - a.y);

        // Process each line
        for (const line of lines) {
            // Sort items left-to-right
            line.items.sort((a, b) => a.x - b.x);

            // Join items with space
            // TODO: Could use x-distance to determine if we need a space or not, but space is safer.
            const lineText = line.items.map(item => item.str).join(' ');
            fullText += lineText + '\n';
        }

        // Add page break marker if needed, or just continue
        fullText += '\n';
    }

    return fullText;
}
