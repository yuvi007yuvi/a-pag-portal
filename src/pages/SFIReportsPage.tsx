import React from 'react';
import { useData } from '../context/DataContext';
import { SFIReportTable } from '../components/SFIReportTable';

export const SFIReportsPage: React.FC = () => {
    const { filteredData, stats } = useData();

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">SFI/Officer Performance Reports</h2>
            <SFIReportTable data={filteredData} />
        </div>
    );
};
