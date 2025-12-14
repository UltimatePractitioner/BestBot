import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileText, Download, Upload, Trash2, RefreshCw, AlertCircle } from 'lucide-react';


interface ArchivedFile {
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: Record<string, any>;
}

export function TimeCardArchive() {
    // const { user } = useAuth();
    const [files, setFiles] = useState<ArchivedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const BUCKET_NAME = 'time-cards-archive';

    const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .storage
                .from(BUCKET_NAME)
                .list('', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

            if (error) {
                // If bucket doesn't exist, this might fail appropriately
                if (error.message.includes('Bucket not found')) {
                    setError('Archive bucket not initialized. Please contact admin.');
                } else {
                    setError(error.message);
                }
            } else {
                setFiles(data as ArchivedFile[] || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            await fetchFiles();
        } catch (err) {
            alert('Error uploading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (fileName: string) => {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(fileName);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName; // original file name? or simplified?
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Error downloading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm('Are you sure you want to delete this archive?')) return;
        try {
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([fileName]);

            if (error) throw error;

            setFiles(files.filter(f => f.name !== fileName));
        } catch (err) {
            alert('Error deleting file: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface/30 rounded-xl border border-border-subtle p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-primary">Archive & Exports</h2>
                    <p className="text-sm text-secondary">Store printed time card PDFs here for permanent record.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchFiles}
                        className="p-2 text-secondary hover:text-primary transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading && files.length > 0 ? "animate-spin" : ""} />
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-black rounded hover:bg-accent-primary/90 cursor-pointer transition-colors font-bold text-sm">
                        <Upload size={16} />
                        {uploading ? 'UPLOADING...' : 'UPLOAD PDF'}
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg mb-4 flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {loading && files.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-accent-primary font-mono animate-pulse">LOADING_ARCHIVE...</div>
                </div>
            ) : files.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-secondary border-2 border-dashed border-border-subtle rounded-lg">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>No archived files found.</p>
                    <p className="text-xs mt-2">Upload a PDF to get started.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-subtle text-xs font-mono text-secondary uppercase tracking-wider">
                                <th className="p-4 md:p-2 lg:p-4 font-normal">Filename</th>
                                <th className="p-4 md:p-2 lg:p-4 font-normal">Date Uploaded</th>
                                <th className="p-4 md:p-2 lg:p-4 font-normal text-right">Size</th>
                                <th className="p-4 md:p-2 lg:p-4 font-normal text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {files.map((file) => (
                                <tr key={file.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 md:p-2 lg:p-4">
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} className="text-accent-primary" />
                                            <span className="text-sm font-medium text-primary">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 md:p-2 lg:p-4 text-sm text-secondary">
                                        {new Date(file.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 md:p-2 lg:p-4 text-sm text-secondary text-right font-mono">
                                        {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                                    </td>
                                    <td className="p-4 md:p-2 lg:p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDownload(file.name)}
                                                className="p-2 text-secondary hover:text-accent-primary transition-colors"
                                                title="Download"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.name)}
                                                className="p-2 text-secondary hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
