import { LLMService } from '../services/llmService';
import { v4 as uuidv4 } from 'uuid';

export interface GearItem {
    quantity: number;
    description: string;
    serialNumber?: string;
    notes?: string;
    category?: string;
    code?: string; // Keep support for code if LLM finds it, or legacy compatibility
}

export class GearParser {
    private llm: LLMService;

    constructor(apiKey: string) {
        this.llm = new LLMService({ apiKey });
    }

    async parse(text: string): Promise<GearItem[]> {
        const systemPrompt = `You are an expert Production Assistant. 
    Your job is to parse equipment lists from raw text (extracted from PDFs) into structured JSON.
    
    CRITICAL OBJECTIVE: Group related items together!
    - If items belong to a specific kit (e.g., "18K Arrimax Sytem", "Skypanel S60 Kit"), assign them the SAME specific 'category'.
    - For loose items, use general categories like "Electric", "Grip", "Camera", "Sound".
    - The goal is to keep heads, ballasts, cables, and accessories for the same unit together in the list.

    The text might be messy. Look for Quantities, Descriptions, Serial Numbers, and optional Codes.
    Return a JSON object with a key 'items' containing an array of gear items.
    
    Structure the response exactly as:
    {
      "items": [
        { 
          "quantity": number, 
          "description": "string", 
          "serialNumber": "string", 
          "category": "string (Specific Kit Name or General Category)", 
          "code": "string (optional)" 
        }
      ]
    }`;

        // Truncate text to avoid context limit (assuming ~4 chars per token, safe buffer)
        // Adjust this based on specific model limits if needed.
        const truncatedText = text.substring(0, 15000);

        const prompt = `Here is the raw text from a gear list PDF:\n\n${truncatedText}\n\nPlease extract the gear items.`;

        console.log("Sending text to LLM for parsing...");
        const result = await this.llm.generateStructuredData<{ items: GearItem[] }>(prompt, systemPrompt);

        if (result.error) {
            console.error("LLM Parsing Error:", result.error);
            return [];
        }

        return result.data?.items || [];
    }
}

// --- Legacy Regex Parser (Restored for Fallback/Hybrid use) ---

export interface GearOrder {
    id: string;
    orderNumber: string;
    description: string;
    customer: string;
    packageType: string;
    shipDate: string;
    returnDate: string;
    vendor: string;
    items: GearItem[];
    sourceFile: string;
    importedAt: string;
}

export function parseGearOrderText(text: string, sourceFile: string): GearOrder {
    const lines = text.split('\n');
    let orderNumber = 'Unknown';
    let description = 'Unknown Description';
    let customer = 'Unknown Customer';
    let packageType = 'Unknown Package';
    let shipDate = 'Unknown Date';
    let returnDate = 'Unknown Date';
    let vendor = 'Unknown Vendor';
    const items: GearItem[] = [];

    // Simple inference similar to original
    if (sourceFile.includes('ALS')) vendor = 'ALS';

    const itemRegex = /^([A-Z0-9\.-]{4,12})\s+(.+?)\s+(\d+)$/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Header extraction (simplified from original)
        const orderMatch = trimmed.match(/Order\s*#:\s*(\d+)/i);
        if (orderMatch) orderNumber = orderMatch[1];

        if (trimmed.match(/Order Description:\s*(.+)/i)) description = trimmed.match(/Order Description:\s*(.+)/i)![1].trim();

        const match = trimmed.match(itemRegex);
        if (match) {
            items.push({
                code: match[1],
                description: match[2].trim(),
                quantity: parseInt(match[3], 10)
            });
        }
    }

    return {
        id: uuidv4(),
        orderNumber,
        description,
        customer,
        packageType,
        shipDate,
        returnDate,
        vendor,
        items,
        sourceFile,
        importedAt: new Date().toISOString()
    };
}

