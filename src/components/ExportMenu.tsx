import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileImage, FileText, Sheet } from 'lucide-react';

interface ExportMenuProps {
    onExportJPEG: () => void;
    onExportPDF: () => void;
    onExportExcel?: () => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExportJPEG, onExportPDF, onExportExcel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                        onClick={() => { setIsOpen(false); onExportJPEG(); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                        <FileImage className="w-4 h-4 text-purple-600" />
                        Export as JPEG
                    </button>
                    <button
                        onClick={() => { setIsOpen(false); onExportPDF(); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                        <FileText className="w-4 h-4 text-red-600" />
                        Export as PDF
                    </button>
                    {onExportExcel && (
                        <button
                            onClick={() => { setIsOpen(false); onExportExcel(); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors border-t border-slate-100"
                        >
                            <Sheet className="w-4 h-4 text-green-600" />
                            Export Excel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
