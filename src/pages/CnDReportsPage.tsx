import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { officerMappings } from '../data/officerMappings';
import { Printer, Trash2, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';

export const CnDReportsPage: React.FC = () => {
    const { filteredData, stats, dateFrom, dateTo } = useData();
    const selectedDept = 'C&D Waste';
    const targetComplaintType = "Illegal Dumping of C&D waste";

    const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    interface WardStats {
        wardName: string;
        total: number;
        closed: number;
        open: number;
        outOfScope: number;
        pending: number;
        reopen: number;
        closureRate: number;
    }

    interface DynamicSupervisorStats {
        supervisor: string;
        zones: Set<string>;
        wards: WardStats[];
        total: number;
        closed: number;
        open: number;
        outOfScope: number;
        pending: number;
        reopen: number;
        closureRate: number;
    }

    // Calculate supervisor-wise statistics with ward-level breakdown
    const calculateSupervisorStats = (): DynamicSupervisorStats[] => {
        const supervisorStatsMap: Record<string, DynamicSupervisorStats> = {};

        // Get relevant supervisor mappings - C&D Waste Department
        const relevantMappings = officerMappings.filter(m => m.department === selectedDept);

        // Initialize supervisors
        relevantMappings.forEach(mapping => {
            if (!supervisorStatsMap[mapping.supervisor]) {
                supervisorStatsMap[mapping.supervisor] = {
                    supervisor: mapping.supervisor,
                    zones: new Set([mapping.zone]),
                    wards: [],
                    total: 0,
                    closed: 0,
                    open: 0,
                    outOfScope: 0,
                    pending: 0,
                    reopen: 0,
                    closureRate: 0
                };
            } else {
                supervisorStatsMap[mapping.supervisor].zones.add(mapping.zone);
            }
        });

        // Build ward-level stats for each supervisor
        relevantMappings.forEach(mapping => {
            const wardStats: WardStats = {
                wardName: mapping.ward,
                total: 0,
                closed: 0,
                open: 0,
                outOfScope: 0,
                pending: 0,
                reopen: 0,
                closureRate: 0
            };

            // Count complaints for this specific ward
            filteredData.forEach(complaint => {
                const type = complaint['complaintsubtype'] || '';
                if (!type.includes(targetComplaintType)) return;

                const ward = complaint['Ward'] || '';
                if (ward === mapping.ward) {
                    wardStats.total++;

                    const rawStatus = (complaint['Status'] || 'Unknown').trim().toLowerCase();
                    if (rawStatus.includes('close')) wardStats.closed++;
                    else if (rawStatus.includes('open') && !rawStatus.includes('re-open')) wardStats.open++;
                    else if (rawStatus.includes('scope')) wardStats.outOfScope++;
                    else if (rawStatus.includes('pending')) wardStats.pending++;
                    else if (rawStatus.includes('re-open') || rawStatus.includes('reopen')) wardStats.reopen++;
                }
            });

            wardStats.closureRate = wardStats.total > 0 ? (wardStats.closed / wardStats.total) * 100 : 0;
            supervisorStatsMap[mapping.supervisor].wards.push(wardStats);
        });

        // Calculate supervisor totals from ward stats
        Object.values(supervisorStatsMap).forEach(supervisor => {
            supervisor.wards.forEach(ward => {
                supervisor.total += ward.total;
                supervisor.closed += ward.closed;
                supervisor.open += ward.open;
                supervisor.outOfScope += ward.outOfScope;
                supervisor.pending += ward.pending;
                supervisor.reopen += ward.reopen;
            });
            supervisor.closureRate = supervisor.total > 0 ? (supervisor.closed / supervisor.total) * 100 : 0;
        });

        // Sort by total complaints descending
        return Object.values(supervisorStatsMap).sort((a, b) => b.total - a.total);
    };

    const supervisorStats = calculateSupervisorStats();

    // Filter supervisors based on search
    const filteredSupervisors = supervisorStats.filter(s =>
        s.supervisor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Summary statistics
    const totalSupervisors = supervisorStats.filter(s => s.total > 0).length;
    const totalComplaints = supervisorStats.reduce((sum, s) => sum + s.total, 0);
    const totalClosed = supervisorStats.reduce((sum, s) => sum + s.closed, 0);
    const totalOpen = supervisorStats.reduce((sum, s) => sum + s.open, 0);
    const overallClosureRate = totalComplaints > 0 ? (totalClosed / totalComplaints) * 100 : 0;

    const handlePrint = () => {
        window.print();
    };

    const toggleSupervisor = (supervisor: string) => {
        const newExpanded = new Set(expandedSupervisors);
        if (newExpanded.has(supervisor)) {
            newExpanded.delete(supervisor);
        } else {
            newExpanded.add(supervisor);
        }
        setExpandedSupervisors(newExpanded);
    };

    const handleExportExcel = () => {
        const excelData: any[] = [];
        supervisorStats.forEach((s, index) => {
            // Supervisor row
            excelData.push({
                'Sr No': index + 1,
                'Supervisor Name': s.supervisor,
                'Total Complaints': s.total,
                'Closed': s.closed,
                'Open': s.open,
                'Out Of Scope': s.outOfScope,
                'Pending': s.pending,
                'Re-open': s.reopen,
                'Closure Rate': `${s.closureRate.toFixed(2)}%`
            });

            // Ward rows
            s.wards.forEach(ward => {
                excelData.push({
                    'Sr No': '',
                    'Supervisor Name': `  ${ward.wardName}`,
                    'Total Complaints': ward.total,
                    'Closed': ward.closed,
                    'Open': ward.open,
                    'Out Of Scope': ward.outOfScope,
                    'Pending': ward.pending,
                    'Re-open': ward.reopen,
                    'Closure Rate': `${ward.closureRate.toFixed(2)}%`
                });
            });
        });
        exportToExcel(excelData, `Nature_Green_CnD_Report_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="space-y-6">
            {/* Control Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Trash2 className="w-6 h-6 text-green-600" />
                        Nature Green C&D Reports
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
                        onExportJPEG={() => exportToJPEG('cnd-report-content', 'Nature_Green_CnD_Report')}
                        onExportPDF={() => exportToPDF('cnd-report-content', 'Nature_Green_CnD_Report')}
                        onExportExcel={handleExportExcel}
                    />
                </div>
            </div>

            {/* Report Content Wrapper */}
            <div id="cnd-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                {/* Custom Header with Nature Green Logo */}
                <div className="bg-white p-6 border-b border-slate-200 mb-6 flex justify-between items-center" id="report-header">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="A-PAG Logo" className="h-16 w-auto" />
                        <img src="/NatureGreen_Logo.png" alt="Nature Green Logo" className="h-16 w-auto" />
                        <div>
                            <h1 className="text-2xl font-bold text-green-800 uppercase tracking-wide">NATURE GREEN C&D WASTE PERFORMANCE REPORT</h1>
                            <p className="text-sm text-slate-500">A-PAG Portal Generated Report</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                            <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">Report Period</p>
                            <p className="font-bold text-green-800 text-lg">
                                {dateFrom} <span className="text-slate-400 mx-1">—</span> {dateTo}
                            </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <p className="text-green-600 text-sm font-medium uppercase tracking-wide">Active Supervisors</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">{totalSupervisors}</p>
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
                        <p className="text-amber-600 text-sm font-medium uppercase tracking-wide">Open</p>
                        <p className="text-3xl font-bold text-amber-700 mt-1">{totalOpen}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <p className="text-purple-600 text-sm font-medium uppercase tracking-wide">Closure Rate</p>
                        <p className="text-3xl font-bold text-purple-700 mt-1">{overallClosureRate.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4 print:hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search supervisor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>

                {/* Supervisor Performance Table */}
                <div className="overflow-hidden border border-slate-400">
                    <div className="px-6 py-3 border-b border-slate-400 bg-white">
                        <h3 className="font-bold text-slate-800 text-base">
                            Supervisor Performance Metrics
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="excel-table">
                            <thead>
                                <tr>
                                    <th className="text-center w-12">Sr No</th>
                                    <th className="text-left">Supervisor Name</th>
                                    <th className="text-center w-32">Total Complaints</th>
                                    <th className="text-center w-20 bg-green-200">Close</th>
                                    <th className="text-center w-20 bg-amber-200">Open</th>
                                    <th className="text-center w-28 bg-gray-200">Out Of Scope</th>
                                    <th className="text-center w-20 bg-blue-200">Pending</th>
                                    <th className="text-center w-20 bg-red-200">Re-open</th>
                                    <th className="text-center w-28 bg-purple-200">Closure Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSupervisors.map((supervisor) => (
                                    <React.Fragment key={supervisor.supervisor}>
                                        {/* Supervisor Row */}
                                        <tr className="cursor-pointer hover:bg-slate-100" onClick={() => toggleSupervisor(supervisor.supervisor)}>
                                            <td className="text-center">
                                                {expandedSupervisors.has(supervisor.supervisor) ?
                                                    <ChevronDown className="w-4 h-4 inline text-slate-600" /> :
                                                    <ChevronRight className="w-4 h-4 inline text-slate-600" />
                                                }
                                            </td>
                                            <td className="font-semibold text-slate-900">
                                                {supervisor.supervisor}
                                                <div className="text-xs text-slate-500 font-normal">({Array.from(supervisor.zones).join(', ')})</div>
                                            </td>
                                            <td className="text-center font-semibold text-slate-900">{supervisor.total}</td>
                                            <td className="status-closed text-center">{supervisor.closed}</td>
                                            <td className="status-open text-center">{supervisor.open}</td>
                                            <td className="status-scope text-center">{supervisor.outOfScope}</td>
                                            <td className="status-pending text-center">{supervisor.pending}</td>
                                            <td className="status-reopen text-center">{supervisor.reopen}</td>
                                            <td className={`text-center font-semibold ${supervisor.closureRate >= 80 ? 'rate-excellent' :
                                                supervisor.closureRate >= 60 ? 'rate-good' :
                                                    supervisor.closureRate >= 40 ? 'rate-fair' : 'rate-poor'
                                                }`}>
                                                {supervisor.closureRate.toFixed(1)}%
                                            </td>
                                        </tr>

                                        {/* Ward Rows (Expandable) */}
                                        {expandedSupervisors.has(supervisor.supervisor) && supervisor.wards.map((ward) => (
                                            <tr key={`${supervisor.supervisor}-${ward.wardName}`} className="bg-blue-50">
                                                <td></td>
                                                <td className="pl-8 text-slate-700 text-xs">
                                                    {ward.wardName}
                                                </td>
                                                <td className="text-center text-slate-700">{ward.total}</td>
                                                <td className="bg-green-50 text-green-700 text-center font-semibold">{ward.closed}</td>
                                                <td className="bg-amber-50 text-amber-700 text-center font-semibold">{ward.open}</td>
                                                <td className="bg-gray-50 text-gray-600 text-center">{ward.outOfScope}</td>
                                                <td className="bg-blue-50 text-blue-700 text-center font-semibold">{ward.pending}</td>
                                                <td className="bg-red-50 text-red-700 text-center font-semibold">{ward.reopen}</td>
                                                <td className="text-center text-slate-700">{ward.closureRate.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                    <p>© 2025 A-PAG Portal • Nature Green C&D Waste Report generated automatically.</p>
                </div>
            </div>
        </div>
    );
};
