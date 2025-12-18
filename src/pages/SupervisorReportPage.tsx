import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { SupervisorReportTable } from '../components/SupervisorReportTable';
import { officerMappings } from '../data/officerMappings';
import { UserCheck } from 'lucide-react';
import { ReportHeader } from '../components/ReportHeader';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { normalizeSupervisorName } from '../utils/dataProcessor';

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

    const [selectedWard, setSelectedWard] = useState<string>('');
    const [selectedOfficer, setSelectedOfficer] = useState<string>('');

    // Reset filters when department changes
    React.useEffect(() => {
        setSelectedWard('');
        setSelectedOfficer('');
    }, [department]);

    // Get filter options based on department
    const { wards, officers } = React.useMemo(() => {
        const relevant = officerMappings.filter(m => m.department === department);
        return {
            wards: Array.from(new Set(relevant.map(m => m.ward))).sort((a, b) => {
                // Sort by ward number if present
                const numA = parseInt(a.match(/^\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/^\d+/)?.[0] || '0');
                return numA - numB || a.localeCompare(b);
            }),
            officers: Array.from(new Set(relevant.map(m => m.officer))).sort()
        };
    }, [department]);

    // Filter data for the table
    const pageData = React.useMemo(() => {
        return filteredData.filter(record => {
            // Ward Filter
            if (selectedWard) {
                // Strict match might fail if data has slight variations, checking inclusion of number + name part might be safer
                // But let's try exact or "includes" logic
                // For better matching, check if record['Ward'] contains the selected ward name (ignoring prefixes if needed)
                // actually officerMappings "01-Birjapur". Data "01-Birjapur".
                if (record['Ward'] !== selectedWard) return false;
            }

            // Officer Filter
            if (selectedOfficer) {
                if (record.assignedOfficer !== selectedOfficer) return false;
            }

            return true;
        });
    }, [filteredData, selectedWard, selectedOfficer]);

    // Calculate active supervisors based on filters
    const activeSupervisors = React.useMemo(() => {
        if (!selectedWard && !selectedOfficer) return undefined;

        return officerMappings
            .filter(m => {
                if (m.department !== department) return false;
                if (selectedWard && m.ward !== selectedWard) return false;
                if (selectedOfficer && m.officer !== selectedOfficer) return false;
                return true;
            })
            .map(m => m.supervisor);
    }, [department, selectedWard, selectedOfficer]);

    // Filter supervisors based on selected department from mappings
    const relevantSupervisors = officerMappings
        .filter(m => m.department === department)
        .map(m => m.supervisor);

    const uniqueRelevantSupervisors = new Set(relevantSupervisors.map(name => normalizeSupervisorName(name)));

    const handleExportExcel = () => {
        // Identify unique statuses from data
        const uniqueStatuses = Array.from(new Set(filteredData.map(d => (d['Status'] || 'Unknown').trim()))).sort();

        interface DynamicSupervisorExportStats {
            supervisor: string;
            total: number;
            closed: number;
            statusCounts: Record<string, number>;
            closureRate: number;
        }

        const supervisorStats: Record<string, DynamicSupervisorExportStats> = {};

        // Initialize only relevant supervisors
        uniqueRelevantSupervisors.forEach(supervisor => {
            supervisorStats[supervisor] = {
                supervisor,
                total: 0,
                closed: 0,
                statusCounts: {},
                closureRate: 0
            };
            uniqueStatuses.forEach(s => supervisorStats[supervisor].statusCounts[s] = 0);
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
            const rawStatus = (complaint['Status'] || 'Unknown').trim();
            s.statusCounts[rawStatus] = (s.statusCounts[rawStatus] || 0) + 1;

            if (rawStatus.toLowerCase().includes('close')) s.closed++;
        });

        // Calculate Rate & Format
        const dataToExport = Object.values(supervisorStats).map((s, index) => {
            const rate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
            const row: any = {
                'Sr No': index + 1,
                'Supervisor Name': s.supervisor,
                'Total Complaints': s.total,
                'Closed': s.closed,
            };
            uniqueStatuses.forEach(st => row[st] = s.statusCounts[st]);
            row['Closure Rate'] = `${rate.toFixed(1)}%`;
            return row;
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

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Ward</label>
                    <select
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Wards</option>
                        {wards.map(ward => (
                            <option key={ward} value={ward}>{ward}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Officer</label>
                    <select
                        value={selectedOfficer}
                        onChange={(e) => setSelectedOfficer(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Officers</option>
                        {officers.map(officer => (
                            <option key={officer} value={officer}>{officer}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Export Wrapper */}
            <div id="supervisor-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                <ReportHeader
                    title={`${department} Supervisor Report`}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />

                <SupervisorReportTable
                    data={pageData}
                    department={department}
                    allowedSupervisors={activeSupervisors}
                />

                <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                    <p>© 2025 A-PAG Portal • {department} Supervisor Metrics</p>
                </div>
            </div>
        </div>
    );
};
