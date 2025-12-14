
import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Trash2, Search, Filter, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { useGear } from '../../context/GearContext';
import type { GearItem } from '../../utils/gearParser';


export const GearView: React.FC = () => {
    const { orders, importOrder, deleteOrder, isLoading, error } = useGear();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState<string>('All');
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

    const vendors = useMemo(() => {
        const v = new Set(orders.map(o => o.vendor));
        return ['All', ...Array.from(v)];
    }, [orders]);

    // Filter orders and determine which items to show for each
    const filteredData = useMemo(() => {
        return orders.map(order => {
            const matchesVendor = selectedVendor === 'All' || order.vendor === selectedVendor;
            if (!matchesVendor) return null;

            const lowerSearch = searchTerm.toLowerCase();

            // Check if order metadata matches
            const orderMatches =
                order.orderNumber.toLowerCase().includes(lowerSearch) ||
                order.description.toLowerCase().includes(lowerSearch);

            // Check which items match
            const matchingItems = order.items.filter(item =>
                item.description.toLowerCase().includes(lowerSearch) ||
                (item.code || '').toLowerCase().includes(lowerSearch)
            );

            // If search is empty, show everything
            if (!searchTerm) {
                return { order, itemsToShow: order.items, isMatch: true };
            }

            // If order matches, show ALL items
            if (orderMatches) {
                return { order, itemsToShow: order.items, isMatch: true };
            }

            // If items match, show ONLY matching items
            if (matchingItems.length > 0) {
                return { order, itemsToShow: matchingItems, isMatch: true };
            }

            return null;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [orders, searchTerm, selectedVendor]);

    // Auto-expand when searching
    useEffect(() => {
        if (searchTerm) {
            const allIds = new Set(filteredData.map(d => d.order.id));
            setExpandedOrders(allIds);
        } else {
            setExpandedOrders(new Set());
        }
    }, [searchTerm, filteredData.length]); // Depend on length to avoid loops, but re-expand if list changes

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await importOrder(file);
        }
    };

    const toggleOrder = (id: string) => {
        const newSet = new Set(expandedOrders);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedOrders(newSet);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header Actions */}
            <div className="glass-panel p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH_GEAR_DATABASE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-border-subtle rounded-sm text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none font-mono text-sm transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors" size={18} />
                        <select
                            value={selectedVendor}
                            onChange={(e) => setSelectedVendor(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-black/20 border border-border-subtle rounded-sm text-primary appearance-none focus:border-accent-primary focus:outline-none cursor-pointer font-mono text-sm min-w-[150px]"
                        >
                            {vendors.map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown size={14} className="text-text-muted" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/50 text-accent-primary hover:bg-accent-primary hover:text-black transition-all cursor-pointer rounded-sm group">
                        <Upload size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="font-mono text-sm font-bold">IMPORT_ORDER</span>
                        <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-sm font-mono text-sm flex items-center gap-2">
                    <span className="font-bold">ERROR:</span> {error}
                </div>
            )}

            {isLoading && (
                <div className="text-center py-12 text-accent-primary">
                    <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <span className="font-mono animate-pulse">PROCESSING_DATA_STREAM...</span>
                </div>
            )}

            {/* Orders List */}
            <div className="space-y-4">
                {filteredData.length === 0 && !isLoading && (
                    <div className="text-center py-16 text-text-muted glass-panel border-dashed">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-mono text-sm">NO_MATCHING_RECORDS_FOUND</p>
                    </div>
                )}

                {filteredData.map(({ order, itemsToShow }) => {
                    // Group items by category
                    const groupedItems = itemsToShow.reduce((acc, item) => {
                        const category = item.category || 'Uncategorized';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(item);
                        return acc;
                    }, {} as Record<string, GearItem[]>);

                    // Sort categories: Kits/Specific first, General/Uncategorized last
                    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
                        if (a === 'Uncategorized') return 1;
                        if (b === 'Uncategorized') return -1;
                        return a.localeCompare(b);
                    });

                    return (
                        <div key={order.id} className="glass-panel overflow-hidden group hover:border-accent-primary/30 transition-all duration-300">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                                onClick={() => toggleOrder(order.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`transition-transform duration-300 ${expandedOrders.has(order.id) ? 'rotate-90 text-accent-primary' : 'text-text-muted'}`}>
                                        <ChevronRight size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-display font-bold text-primary tracking-wide">{order.description}</h3>
                                            <span className="text-[10px] font-mono text-accent-primary px-1.5 py-0.5 border border-accent-primary/30 rounded-sm bg-accent-primary/5">
                                                {order.vendor}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                                            <span>ID: {order.orderNumber}</span>
                                            <span className="text-border-highlight">|</span>
                                            <span>{itemsToShow.length} / {order.items.length} ITEMS</span>
                                            <span className="text-border-highlight">|</span>
                                            <span>{order.shipDate} - {order.returnDate}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {expandedOrders.has(order.id) && (
                                <div className="border-t border-border-subtle bg-black/20 p-4 animate-fade-in-up">
                                    <div className="space-y-6">
                                        {sortedCategories.map(category => (
                                            <div key={category} className="space-y-2">
                                                {category !== 'Uncategorized' && (
                                                    <h4 className="text-xs font-mono font-bold text-accent-primary uppercase tracking-wider pl-4 border-l-2 border-accent-primary/50">
                                                        {category}
                                                    </h4>
                                                )}

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left font-mono">
                                                        <thead className="text-text-muted text-xs border-b border-border-subtle">
                                                            <tr>
                                                                <th className="pb-2 pl-4 font-normal w-24">CODE</th>
                                                                <th className="pb-2 font-normal">DESCRIPTION</th>
                                                                <th className="pb-2 pr-4 text-right font-normal w-16">QTY</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border-subtle/50">
                                                            {groupedItems[category].map((item: GearItem, idx: number) => (
                                                                <tr key={idx} className="hover:bg-white/5 transition-colors group/row">
                                                                    <td className="py-2 pl-4 text-accent-primary/70 group-hover/row:text-accent-primary">{item.code || '-'}</td>
                                                                    <td className="py-2 text-primary/80 group-hover/row:text-primary">{item.description}</td>
                                                                    <td className="py-2 pr-4 text-right text-text-secondary">{item.quantity}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
