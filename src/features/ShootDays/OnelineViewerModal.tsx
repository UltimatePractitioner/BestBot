import React from 'react';
import { X, FileText } from 'lucide-react';

interface OnelineViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

export const OnelineViewerModal: React.FC<OnelineViewerModalProps> = ({
    isOpen,
    onClose,
    title,
    content
}) => {
    if (!isOpen) return null;

    // Helper to format lines for "Script/Oneline" look
    const formatLine = (line: string, index: number) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-4" />; // Empty line

        // End of Day - Bold, Centered, Separator
        if (trimmed.match(/^END\s+(?:OF\s+)?(?:[A-Z]+\s+)?DAY/i)) {
            return (
                <div key={index} className="py-8 text-center font-bold border-t-4 border-black mt-12 mb-8 text-lg tracking-widest">
                    {line}
                </div>
            );
        }

        // Scene Header - Bold, Uppercase
        if (trimmed.match(/^(INT|EXT|I\/E)\b/)) {
            return (
                <div key={index} className="font-bold mt-8 mb-2 text-black text-base border-t border-gray-200 pt-4">
                    {line}
                </div>
            );
        }

        // Scene Number (heuristic: starts with number, short line)
        if (trimmed.match(/^\d+[A-Z]?\s*$/) || trimmed.match(/^\d+[A-Z]?\s+[\w\s]+$/)) {
            // If it looks like just a scene number line or Scene + Slug
            // We can bold the number part if we want, or just leave it.
            // Let's just render standard mono for now, but maybe bold if it's short
        }

        return (
            <div key={index} className="whitespace-pre-wrap pl-4 border-l-2 border-transparent hover:border-gray-200 transition-colors">
                {line}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <FileText className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Oneline View</h3>
                            <p className="text-sm text-gray-400">{title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area - The "Paper" */}
                <div className="p-0 overflow-y-auto flex-1 bg-gray-100/50">
                    <div className="max-w-6xl mx-auto bg-white min-h-full shadow-lg p-8 sm:p-16 font-mono text-sm text-gray-900 leading-relaxed selection:bg-yellow-200 selection:text-black">
                        {content ? (
                            content.split('\n').map((line, i) => formatLine(line, i))
                        ) : (
                            <div className="text-gray-400 italic text-center py-10">
                                No original text available for this day.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-900 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
