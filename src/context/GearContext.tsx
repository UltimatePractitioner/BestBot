import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type GearOrder, parseGearOrderText } from '../utils/gearParser';
import { extractTextFromPDF } from '../utils/pdfUtils';
import { apiKeyStore } from '../utils/apiKeyStore';
import { useAuth } from './AuthContext';

interface GearContextType {
    orders: GearOrder[];
    importOrder: (file: File) => Promise<void>;
    deleteOrder: (id: string) => void;
    clearAllOrders: () => void;
    isLoading: boolean;
    error: string | null;
}

const GearContext = createContext<GearContextType | undefined>(undefined);

export function GearProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const storageKey = `gear_orders_${user?.id} `;

    const [orders, setOrders] = useState<GearOrder[]>(() => {
        if (!user?.id) return [];
        const saved = localStorage.getItem(`gear_orders_${user.id} `);
        return saved ? JSON.parse(saved) : [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            localStorage.setItem(storageKey, JSON.stringify(orders));
        }
    }, [orders, user?.id, storageKey]);

    const importOrder = async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            let text = '';
            if (file.type === 'application/pdf') {
                text = await extractTextFromPDF(file);
            } else {
                text = await file.text();
            }

            let parsedOrder: GearOrder | null = null;

            // Try LLM Parser
            const apiKey = apiKeyStore.getEffectiveKey(user?.id);

            if (apiKey) {
                try {
                    const { GearParser } = await import('../utils/gearParser');
                    const parser = new GearParser(apiKey);
                    console.log('Using LLM Gear Parser...');
                    const items = await parser.parse(text);

                    if (items.length > 0) {
                        // Construct a Order object from the raw items
                        // Ideally we'd ask the LLM for the header info too, but for now we'll mock/infer it 
                        // or use a hybrid approach (regex for header, LLM for items)

                        // Simple header inference
                        const orderNumberMatch = text.match(/Order\s*#:\s*(\d+)/i);
                        const vendorMatch = file.name.split('-')[0]?.trim() || "Unknown Vendor";

                        parsedOrder = {
                            id: crypto.randomUUID(),
                            orderNumber: orderNumberMatch ? orderNumberMatch[1] : 'Unknown Order',
                            description: file.name.replace('.pdf', ''),
                            customer: 'Production',
                            packageType: 'Equipment',
                            shipDate: new Date().toLocaleDateString(), // Placeholder
                            returnDate: new Date().toLocaleDateString(),
                            vendor: vendorMatch,
                            items: items.map(i => ({
                                ...i,
                                code: i.code || 'MISC', // Ensure code exists
                            })),
                            sourceFile: file.name,
                            importedAt: new Date().toISOString()
                        };
                    }
                } catch (e) {
                    console.warn("LLM Gear Parse failed:", e);
                }
            }

            // 2. Fallback to Regex Parser
            if (!parsedOrder || parsedOrder.items.length === 0) {
                console.log('--- FALLBACK TO REGEX GEAR PARSER ---');
                parsedOrder = parseGearOrderText(text, file.name);
            }

            if (!parsedOrder || parsedOrder.items.length === 0) {
                throw new Error('No gear items found in file.');
            }

            const finalOrder = parsedOrder; // ensure type safety
            setOrders(prev => [...prev, finalOrder]);

        } catch (err) {
            console.error('Import failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to import order');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteOrder = (id: string) => {
        setOrders(prev => prev.filter(o => o.id !== id));
    };

    const clearAllOrders = () => {
        setOrders([]);
    };

    return (
        <GearContext.Provider value={{ orders, importOrder, deleteOrder, clearAllOrders, isLoading, error }}>
            {children}
        </GearContext.Provider>
    );
}

export function useGear() {
    const context = useContext(GearContext);
    if (context === undefined) {
        throw new Error('useGear must be used within a GearProvider');
    }
    return context;
}
