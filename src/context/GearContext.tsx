
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type GearOrder, parseGearOrderText } from '../utils/gearParser';
import { extractTextFromPDF } from '../utils/pdfUtils';
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
    const storageKey = `gear_orders_${user?.id}`;

    const [orders, setOrders] = useState<GearOrder[]>(() => {
        if (!user?.id) return [];
        const saved = localStorage.getItem(`gear_orders_${user.id}`);
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

            const parsedOrder = parseGearOrderText(text, file.name);

            if (parsedOrder.items.length === 0) {
                throw new Error('No gear items found in file.');
            }

            setOrders(prev => [...prev, parsedOrder]);
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
