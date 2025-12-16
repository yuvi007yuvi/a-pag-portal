import React from 'react';
import { useData } from '../context/DataContext';
import { officerMappings } from '../data/officerMappings';
import { Printer, Trash2 } from 'lucide-react';
import { ReportHeader } from '../components/ReportHeader';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';



export const CnDReportsPage: React.FC = () => {
    const { filteredData, stats, dateFrom, dateTo } = useData();
    // C&D is handled by Civil department officers
    const selectedDept = 'Civil';
    const targetComplaintType = "Illegal Dumping of C&D waste";

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    // Identify unique statuses ONLY for C&D
    const uniqueStatuses = Array.from(new Set(filteredData
        .filter(c => (c['complaintsubtype'] || '').includes(targetComplaintType))
        .map(d => {
            const s = d['Status'] || 'Unknown';
            return s.trim();
        }))).sort();

    interface DynamicOfficerStats {
        officer: string;
        supervisor: string;
        zones: Set<string>;
        wards: Set<string>;
        total: number;
        closed: number;
        statusCounts: Record<string, number>;
        closureRate: number;
        [key: string]: any;
    }

    // Calculate officer-wise statistics for C&D ONLY
    const calculateOfficerStats = (): DynamicOfficerStats[] => {
        const officerStatsMap: Record<string, DynamicOfficerStats> = {};

        // Get relevant officer mappings - Civil Department
        const relevantMappings = officerMappings.filter(m => m.department === selectedDept);

        // Initialize officers
        relevantMappings.forEach(mapping => {
            if (!officerStatsMap[mapping.officer]) {
                officerStatsMap[mapping.officer] = {
                    officer: mapping.officer,
                    supervisor: mapping.supervisor,
                    zones: new Set([mapping.zone]),
                    wards: new Set([mapping.ward]),
                    total: 0,
                    closed: 0,
                    statusCounts: {},
                    closureRate: 0
                };
                uniqueStatuses.forEach(s => officerStatsMap[mapping.officer].statusCounts[s] = 0);
            } else {
                officerStatsMap[mapping.officer].zones.add(mapping.zone);
                officerStatsMap[mapping.officer].wards.add(mapping.ward);
            }
        });

        // Add complaint data - FILTERED FOR C&D ONLY
        filteredData.forEach(complaint => {
            // STRICT FILTER FOR C&D
            const type = complaint['complaintsubtype'] || '';
            if (!type.includes(targetComplaintType)) return;

            const officer = complaint.assignedOfficer;
            if (!officer) return;

            if (officerStatsMap[officer]) {
                const s = officerStatsMap[officer];
                s.total++;

                const rawStatus = (complaint['Status'] || 'Unknown').trim();
                s.statusCounts[rawStatus] = (s.statusCounts[rawStatus] || 0) + 1;

                if (rawStatus.toLowerCase().includes('close')) s.closed++;
            }
        });

        // Calculate closure rates
        Object.values(officerStatsMap).forEach(stats => {
            stats.closureRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
        });

        // Sort by total complaints descending
        return Object.values(officerStatsMap).sort((a, b) => b.total - a.total);
    };

    const officerStats = calculateOfficerStats();

    // Summary statistics
    const totalOfficers = officerStats.filter(o => o.total > 0).length;
    const totalComplaints = officerStats.reduce((sum, o) => sum + o.total, 0);
    const totalClosed = officerStats.reduce((sum, o) => sum + o.closed, 0);
    const totalOpen = officerStats.reduce((sum, o) => sum + (o.total - o.closed), 0); // Logic fix: Open is approx total-closed unless we want specific open statuses
    const overallClosureRate = totalComplaints > 0 ? (totalClosed / totalComplaints) * 100 : 0;

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const excelData = officerStats.map((o, index) => {
            const row: any = {
                'Sr No': index + 1,
                'Officer Name': o.officer,
                'Supervisor': o.supervisor,
                'Zones': Array.from(o.zones).join(', '),
                'Wards': Array.from(o.wards).join(', '),
                'Total Complaints': o.total,
                'Closed': o.closed,
            };
            uniqueStatuses.forEach(s => row[s] = o.statusCounts[s]);
            row['Closure Rate'] = `${o.closureRate.toFixed(2)}%`;
            return row;
        });
        exportToExcel(excelData, `CnD_Dev_Waste_Report_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="space-y-6">
            {/* Control Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Trash2 className="w-6 h-6 text-amber-600" />
                        C&D Waste Reports
                    </h2>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm font-medium"
                    >
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <ExportMenu
                        onExportJPEG={() => exportToJPEG('cnd-report-content', 'CnD_Waste_Report')}
                        onExportPDF={() => exportToPDF('cnd-report-content', 'CnD_Waste_Report')}
                        onExportExcel={handleExportExcel}
                    />
                </div>
            </div>

            {/* Report Content Wrapper */}
            <div id="cnd-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                <ReportHeader
                    title="C&D Waste Performance Report"
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">Active Officers</p>
                        <p className="text-3xl font-bold text-blue-700 mt-1">{totalOfficers}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Total Complaints</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{totalComplaints}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <p className="text-green-600 text-sm font-medium uppercase tracking-wide">Closed</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">{totalClosed}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <p className="text-amber-600 text-sm font-medium uppercase tracking-wide">Others</p>
                        <p className="text-3xl font-bold text-amber-700 mt-1">{totalOpen}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <p className="text-purple-600 text-sm font-medium uppercase tracking-wide">Closure Rate</p>
                        <p className="text-3xl font-bold text-purple-700 mt-1">{overallClosureRate.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Officer Report Table */}
                <div className="overflow-hidden border border-slate-300">
                    <div className="px-6 py-4 border-b border-slate-300 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-lg uppercase">
                            C&D Waste Officer Performance List
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-slate-300 relative">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800 w-16 bg-slate-100">Sr. No.</th>
                                    <th className="border border-slate-300 px-2 py-2 text-left font-bold text-slate-800 bg-slate-100">Officer Name</th>
                                    <th className="border border-slate-300 px-2 py-2 text-left font-bold text-slate-800 bg-slate-100">Supervisor</th>
                                    <th className="border border-slate-300 px-2 py-2 text-left font-bold text-slate-800 bg-slate-100">Zones</th>
                                    <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800 w-16 bg-slate-100">Wards</th>
                                    <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800 w-20 bg-slate-100">Total</th>

                                    {/* Dynamic Status Columns */}
                                    {uniqueStatuses.map(status => (
                                        <th key={status} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800 w-20 bg-slate-100">
                                            {status}
                                        </th>
                                    ))}

                                    <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800 w-24 bg-slate-100">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {officerStats.map((officer, index) => (
                                    <tr
                                        key={officer.officer}
                                        className="hover:bg-blue-50 even:bg-slate-50/30 transition-colors"
                                    >
                                        <td className="border border-slate-300 px-2 py-1 text-center text-slate-700 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-900">
                                            {officer.officer}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-slate-700 font-medium">
                                            {officer.supervisor}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-slate-600 text-xs font-medium">
                                            {Array.from(officer.zones).join(', ')}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-center text-slate-700">
                                            {officer.wards.size}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-900 bg-slate-50">
                                            {officer.total}
                                        </td>

                                        {/* Dynamic Status Counts */}
                                        {uniqueStatuses.map(status => {
                                            const count = officer.statusCounts[status] || 0;
                                            let colorClass = 'text-slate-700';
                                            let bgClass = '';
                                            if (status.toLowerCase().includes('close')) { colorClass = 'text-green-700'; bgClass = 'bg-green-50'; }
                                            else if (status.toLowerCase().includes('open')) { colorClass = 'text-amber-700'; bgClass = 'bg-amber-50'; }
                                            else if (status.toLowerCase().includes('pending')) { colorClass = 'text-blue-700'; bgClass = 'bg-blue-50'; }

                                            return (
                                                <td key={status} className={`border border-slate-300 px-2 py-1 text-center font-bold ${colorClass} ${bgClass}`}>
                                                    {count || '-'}
                                                </td>
                                            );
                                        })}

                                        <td className={`border border-slate-300 px-2 py-1 text-center font-bold ${officer.closureRate >= 80 ? 'text-green-700 bg-green-100' :
                                            officer.closureRate >= 60 ? 'text-yellow-700 bg-yellow-100' :
                                                officer.closureRate >= 40 ? 'text-orange-700 bg-orange-100' : 'text-red-700 bg-red-100'
                                            }`}>
                                            {officer.total === 0 ? '-' : `${officer.closureRate.toFixed(1)}%`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                    <td colSpan={5} className="border border-slate-300 px-2 py-2 text-right text-slate-800 bg-slate-50 uppercase tracking-wide">
                                        Total / Average
                                    </td>
                                    <td className="border border-slate-300 px-2 py-2 text-center text-slate-900 bg-white text-lg">
                                        {totalComplaints}
                                    </td>

                                    {/* Dynamic Status Footer Totals */}
                                    {uniqueStatuses.map(status => {
                                        const count = officerStats.reduce((sum, o) => sum + (o.statusCounts[status] || 0), 0);
                                        let colorClass = 'text-slate-900';
                                        if (status.toLowerCase().includes('close')) colorClass = 'text-green-700 bg-green-50';
                                        else if (status.toLowerCase().includes('open')) colorClass = 'text-amber-700 bg-amber-50';

                                        return (
                                            <td key={status} className={`border border-slate-300 px-2 py-2 text-center text-lg ${colorClass}`}>
                                                {count}
                                            </td>
                                        )
                                    })}

                                    <td className="border border-slate-300 px-2 py-2 text-center text-purple-700 bg-purple-50 text-lg">
                                        {overallClosureRate.toFixed(1)}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                    <p>© 2025 A-PAG Portal • C&D Waste Report generated automatically.</p>
                </div>
            </div>
        </div>
    );
};
