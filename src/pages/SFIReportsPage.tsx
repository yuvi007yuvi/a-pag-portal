import React from 'react';
import { useData } from '../context/DataContext';
import { SFIReportTable } from '../components/SFIReportTable';
import { officerMappings } from '../data/officerMappings';
import { FileText } from 'lucide-react';
import { ReportHeader } from '../components/ReportHeader';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';

export const SFIReportsPage: React.FC = () => {
    const { filteredData, stats, dateFrom, dateTo } = useData();

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    const handleExportExcel = () => {
        // Replicate stats logic for Export
        const officerStats: Record<string, any> = {};

        // Initialize
        const uniqueOfficers = new Set(officerMappings.map(m => m.officer));
        uniqueOfficers.forEach(officer => {
            officerStats[officer] = { officer, total: 0, closed: 0, open: 0, pending: 0, closureRate: 0 };
        });

        // Populate
        filteredData.forEach(complaint => {
            const officer = complaint.assignedOfficer;
            if (!officer) return;

            if (!officerStats[officer]) {
                officerStats[officer] = { officer, total: 0, closed: 0, open: 0, pending: 0, closureRate: 0 };
            }

            const s = officerStats[officer];
            s.total++;
            const status = complaint['Status']?.toLowerCase() || '';
            if (status.includes('close')) s.closed++;
            else if (status.includes('open')) s.open++;
            else if (status.includes('pending')) s.pending++;
            else s.open++;
        });

        // Calculate Rate & Format
        const dataToExport = Object.values(officerStats).map((s, index) => {
            const rate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
            return {
                'Sr No': index + 1,
                'Officer Name': s.officer,
                'Total Complaints': s.total,
                'Closed': s.closed,
                'Open': s.open,
                'Pending': s.pending,
                'Closure Rate': `${rate.toFixed(1)}%`
            };
        }).sort((a, b) => b['Total Complaints'] - a['Total Complaints']); // Sort by total desc by default

        exportToExcel(dataToExport, `SFI_Performance_Report_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Control Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-slate-700" />
                    SFI/Officer Reports
                </h2>
                <div className="flex gap-2">
                    <ExportMenu
                        onExportJPEG={() => exportToJPEG('sfi-report-content', 'SFI_Performance_Report')}
                        onExportPDF={() => exportToPDF('sfi-report-content', 'SFI_Performance_Report')}
                        onExportExcel={handleExportExcel}
                    />
                </div>
            </div>

            {/* Export Wrapper */}
            <div id="sfi-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                <ReportHeader
                    title="SFI & Officer Performance Report"
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />

                <SFIReportTable data={filteredData} />

                <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                    <p>© 2025 A-PAG Portal • SFI Performance Metrics</p>
                </div>
            </div>
        </div>
    );
};
