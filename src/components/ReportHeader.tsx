import React from 'react';
import logo2 from '../logo 2.png';

interface ReportHeaderProps {
    title: string;
    dateFrom?: string;
    dateTo?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, dateFrom, dateTo }) => {
    return (
        <div className="bg-white p-6 border-b border-slate-200 mb-6 flex justify-between items-center" id="report-header">
            <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
                <img src={logo2} alt="Logo 2" className="h-16 w-auto" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">{title}</h1>
                    <p className="text-sm text-slate-500">A-PAG Portal Generated Report</p>
                </div>
            </div>
            <div className="text-right">
                <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Report Period</p>
                    <p className="font-bold text-slate-800 text-lg">
                        {dateFrom} <span className="text-slate-400 mx-1">—</span> {dateTo}
                    </p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    Generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
};
