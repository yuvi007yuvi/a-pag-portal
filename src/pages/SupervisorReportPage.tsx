import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { SupervisorReportTable } from '../components/SupervisorReportTable';
import { officerMappings } from '../data/officerMappings';
import { UserCheck } from 'lucide-react';
import { ReportHeader } from '../components/ReportHeader';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';

export const SupervisorReportPage: React.FC = () => {
    const { filteredData, stats, dateFrom, dateTo } = useData();
    const [department, setDepartment] = useState<'Sanitation' | 'Civil'>('Sanitation');

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    // Filter supervisors based on selected department from mappings
    const relevantSupervisors = officerMappings
        .filter(m => m.department === department)
        .map(m => m.supervisor);

    const uniqueRelevantSupervisors = new Set(relevantSupervisors);

    const handleExportExcel = () => {
        const supervisorStats: Record<string, any> = {};

        // Initialize only relevant supervisors
        uniqueRelevantSupervisors.forEach(supervisor => {
            supervisorStats[supervisor] = { supervisor, total: 0, closed: 0, open: 0, pending: 0, closureRate: 0 };
        });

        // Populate from data
        filteredData.forEach(complaint => {
            const supervisor = complaint.assignedSupervisor;
            if (!supervisor || !uniqueRelevantSupervisors.has(supervisor)) return;

            if (!supervisorStats[supervisor]) {
                // Should not happen if initialized
                return;
            }

            const s = supervisorStats[supervisor];
            s.total++;
            const status = complaint['Status']?.toLowerCase() || '';
            if (status.includes('close')) s.closed++;
            else if (status.includes('open')) s.open++;
            else if (status.includes('pending')) s.pending++;
            else s.open++;
        });

        // Calculate Rate & Format
        const dataToExport = Object.values(supervisorStats).map((s, index) => {
            const rate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
            return {
                'Sr No': index + 1,
                'Supervisor Name': s.supervisor,
                'Total Complaints': s.total,
                'Closed': s.closed,
                'Open': s.open,
                'Pending': s.pending,
                'Closure Rate': `${rate.toFixed(1)}%`
            };
        }).sort((a, b) => b['Total Complaints'] - a['Total Complaints']);

        exportToExcel(dataToExport, `${department}_Supervisor_Performance_Report`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Control Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-slate-700" />
                        {department === 'Sanitation' ? 'Sanitation Supervisors' : 'Civil Supervisors'}
                    </h2>

                    {/* Department Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setDepartment('Sanitation')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${department === 'Sanitation'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Sanitation
                        </button>
                        <button
                            onClick={() => setDepartment('Civil')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${department === 'Civil'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Civil
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <ExportMenu
                        onExportJPEG={() => exportToJPEG('supervisor-report-content', `${department}_Supervisor_Report`)}
                        onExportPDF={() => exportToPDF('supervisor-report-content', `${department}_Supervisor_Report`)}
                        onExportExcel={handleExportExcel}
                    />
                </div>
            </div>

            {/* Export Wrapper */}
            <div id="supervisor-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                <ReportHeader
                    title={`${department} Supervisor Report`}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />

                <SupervisorReportTable data={filteredData} department={department} />

                <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                    <p>© 2025 A-PAG Portal • {department} Supervisor Metrics</p>
                </div>
            </div>
        </div>
    );
};
