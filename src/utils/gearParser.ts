
import { v4 as uuidv4 } from 'uuid';

export interface GearItem {
    code: string;
    description: string;
    quantity: number;
}

export interface GearOrder {
    id: string;
    orderNumber: string;
    description: string;
    customer: string;
    packageType: string;
    shipDate: string;
    returnDate: string;
    vendor: string; // Inferred or extracted
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
    let vendor = 'Unknown Vendor'; // Default

    const items: GearItem[] = [];

    // 1. Parse Header Info
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Order Number
        // Matches: "Order#: 992968" or "Order #: 992968"
        const orderMatch = line.match(/Order\s*#:\s*(\d+)/i);
        if (orderMatch) {
            orderNumber = orderMatch[1];

            // Description often on same line: "Order#: 992968 Order Description: ALS..."
            const descMatch = line.match(/Order Description:\s*(.+)$/i);
            if (descMatch) {
                description = descMatch[1].trim();
            }
        }

        // Fallback for Description if on separate line or not caught above
        if (line.match(/^Order Description:\s*(.+)/i)) {
            const descMatch = line.match(/^Order Description:\s*(.+)/i);
            if (descMatch) description = descMatch[1].trim();
        }

        if (line.match(/^Customer:/i)) {
            const match = line.match(/Customer:\s*(.+)/i);
            if (match) customer = match[1].trim();
        }

        if (line.match(/^Package Type:/i)) {
            const match = line.match(/Package Type:\s*(.+)/i);
            if (match) packageType = match[1].trim();
        }

        // Dates
        if (line.match(/Ship Date:/i)) {
            const shipMatch = line.match(/Ship Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
            if (shipMatch) shipDate = shipMatch[1];

            const returnMatch = line.match(/Return Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
            if (returnMatch) returnDate = returnMatch[1];
        }
    }

    // Infer Vendor from Filename or Description
    // e.g. "ALS - Shoot Truck Pkg" -> maybe ALS is the show, but let's use it as a tag for now.
    // If the user wants "Vendor", we might need a mapping or manual input.
    // For now, let's guess from the file name or description.
    if (sourceFile.includes('ALS')) vendor = 'ALS';

    // 2. Parse Line Items
    // Format: Code (approx 4-10 chars) Description (variable) Qty (digits at end)
    // Regex: ^([A-Z0-9\.-]{4,12})\s+(.+?)\s+(\d+)$
    // Added \.- to code chars just in case. 
    // Ensure code is at start of line.

    const itemRegex = /^([A-Z0-9\.-]{4,12})\s+(.+?)\s+(\d+)$/;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip header lines, empty lines, or footer lines
        if (!trimmed
            || trimmed.match(/^Order\s*#:/i)
            || trimmed.match(/^Page:\s*\d+/i)
            || trimmed.match(/Page\s+\d+\s+of\s+\d+/i)
            || trimmed.match(/^Date:/i)
            || trimmed.includes('Subtotal:')
            || trimmed.includes('Total:')
            || trimmed.match(/^Equipment\s+Description\s+Qty/i) // Table Header
        ) continue;

        const match = trimmed.match(itemRegex);
        if (match) {
            const code = match[1];
            const desc = match[2].trim();
            const qty = parseInt(match[3], 10);

            // Filter out false positives
            // e.g. "Date: 5/16/2025" might match if not careful, but we skip "Date:" above.

            items.push({
                code,
                description: desc,
                quantity: qty
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
