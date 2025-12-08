import React from 'react';
import { Upload } from 'lucide-react';


interface FileUploadProps {
    onFileSelect: (file: File) => void;
    label: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, label }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-500" />
                    <p className="mb-1 text-sm text-slate-500 font-medium">
                        <span className="font-semibold">Click to upload</span> {label}
                    </p>
                    <p className="text-xs text-slate-500">CSV files only</p>
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                />
            </label>
        </div>
    );
};
