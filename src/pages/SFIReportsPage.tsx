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
    // HARDCODED: SFI Page is for Sanitation ONLY
    const department: 'Sanitation' | 'Civil' = 'Sanitation';
    const cndType = "Illegal Dumping of C&D waste";

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    // Filter officers based on selected department from mappings
    const relevantOfficers = officerMappings
        .filter(m => m.department === department)
        .map(m => m.officer);

    const uniqueRelevantOfficers = new Set(relevantOfficers);

    // Filter data to only show rows relevant to these officers (optional, but Table usually takes full data)
    // SFIReportTable logic: It initializes stats from the *full* officerMappings usually? 
    // Wait, SFIReportTable inside uses its own logic? No, let's check SFIReportTable again or pass filtered data?
    // SFIReportsPage passes `filteredData` to `SFIReportTable`.
    // The previous `handleExportExcel` logic reconstructed stats. 
    // `SFIReportTable` probably has its own logic. I might need to update `SFIReportTable` to accept an optional "officerFilter" list or just Filtered Data.
    // Let's actually Look at SFIReportTable again to be sure.
    // Ah, `SFIReportTable` was viewed earlier (step 398). It initializes `officerStats` by adding all unique officers from `officerMappings`.
    // So if I want to filter the VIEW, I should probably filter the `officerMappings` passed to it?
    // `SFIReportTable` imports `officerMappings` directly! That's a dependency I need to break if I want to filter from outside.
    // OR, I can update `SFIReportTable` to accept `officerList` prop.

    // Let's assume for this step I will rewrite SFIReportsPage to calculate the stats LOCALLY and pass them to a generic table, OR I update SFIReportTable.
    // Updating SFIReportTable is cleaner.

    // BUT the user wants this DONE. "SFIReportTable" logic:
    // "const uniqueOfficers = new Set(officerMappings.map(m => m.officer));"

    // I will rewrite `SFIReportsPage` to handle the export logic correctly (which I am doing here).
    // AND I will likely need to modify `SFIReportTable` to accept a `department` prop or `officerList` prop.
    // Let's modify SFIReportTable in the NEXT step. For now, let's implement the Page logic which controls the view.

    const handleExportExcel = () => {
        // Filter out C&D waste first, to match the table
        const relevantData = filteredData.filter(c => !(c['complaintsubtype'] || '').includes(cndType));

        // Identify unique statuses
        const uniqueStatuses = Array.from(new Set(relevantData.map(d => (d['Status'] || 'Unknown').trim()))).sort();

        interface DynamicOfficerExportStats {
            officer: string;
            total: number;
            closed: number;
            statusCounts: Record<string, number>;
            closureRate: number;
        }

        const officerStats: Record<string, DynamicOfficerExportStats> = {};

        // Initialize only relevant officers
        uniqueRelevantOfficers.forEach(officer => {
            officerStats[officer] = {
                officer,
                total: 0,
                closed: 0,
                statusCounts: {},
                closureRate: 0
            };
            uniqueStatuses.forEach(s => officerStats[officer].statusCounts[s] = 0);
        });

        // Populate
        relevantData.forEach(complaint => {
            const officer = complaint.assignedOfficer;
            if (!officer || !uniqueRelevantOfficers.has(officer)) return;

            if (!officerStats[officer]) {
                // If officer wasn't in list (shouldn't happen if list is comprehensive), ignore or add?
                return;
            }

            const s = officerStats[officer];
            s.total++;
            const rawStatus = (complaint['Status'] || 'Unknown').trim();
            s.statusCounts[rawStatus] = (s.statusCounts[rawStatus] || 0) + 1;

            if (rawStatus.toLowerCase().includes('close')) s.closed++;
        });

        // Calculate Rate & Format
        const dataToExport = Object.values(officerStats).map((s, index) => {
            const rate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
            const row: any = {
                'Sr No': index + 1,
                'Officer Name': s.officer,
                'Total Complaints': s.total,
                'Closed': s.closed,
            };
            uniqueStatuses.forEach(st => row[st] = s.statusCounts[st]);
            row['Closure Rate'] = `${rate.toFixed(1)}%`;
            return row;
        }).sort((a, b) => b['Total Complaints'] - a['Total Complaints']);

        exportToExcel(dataToExport, `${department}_SFI_Performance_Report`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Control Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-slate-700" />
                        OFFICERS WISE Performance Report
                    </h2>
                </div>

                <div className="flex gap-2">
                    <ExportMenu
                        onExportJPEG={() => exportToJPEG('sfi-report-content', `${department}_Performance_Report`)}
                        onExportPDF={() => exportToPDF('sfi-report-content', `${department}_Performance_Report`)}
                        onExportExcel={handleExportExcel}
                    />
                </div>
            </div>

            {/* Export Wrapper */}
            <div id="sfi-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                <ReportHeader
                    title="OFFICERS WISE Performance Report"
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />

                {/* Pass filtered Department to Table, explicitly EXCLUDING C&D if any slipped through */}
                <SFIReportTable
                    data={filteredData.filter(c => !(c['complaintsubtype'] || '').includes(cndType))}
                    department={department}
                />

                <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                    <p>© 2025 A-PAG Portal • {department} Performance Metrics</p>
                </div>
            </div>
        </div>
    );
};
