import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Building2, Droplet, FileText, Trash2 } from 'lucide-react';
import { ReportHeader } from '../components/ReportHeader';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';

interface DepartmentStats {
    total: number;
    closed: number;
    // open/pending removed in favor of dynamic mapping or calculated 'others'
    statusCounts: Record<string, number>;
    closureRate: number;
    officers: Set<string>;
}

export const DepartmentReportsPage: React.FC = () => {
    const { filteredData, stats, dateFrom, dateTo } = useData();
    const [selectedDept, setSelectedDept] = useState<'Sanitation' | 'Civil' | 'C&D' | 'Both'>('Both');

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    // Identify unique statuses
    const uniqueStatuses = useMemo(() => Array.from(new Set(filteredData.map(d => {
        const s = d['Status'] || 'Unknown';
        return s.trim();
    }))).sort(), [filteredData]);

    // Calculate department-wise statistics
    const calculateDepartmentStats = (department: 'Sanitation' | 'Civil' | 'C&D'): DepartmentStats => {
        const deptData = filteredData.filter(complaint => {
            const type = complaint['Complainttype'] || '';
            const subtype = complaint['complaintsubtype'] || '';

            const sanitationTypes = ['Door To Door', 'Road Sweeping', 'Drain Cleaning', 'Sanitation', 'Dead Animals'];
            const civilTypes = ['STREET LIGHT', 'Civil', 'Water Logging'];
            const cndType = "Illegal Dumping of C&D waste";

            if (department === 'Sanitation') {
                return sanitationTypes.some(t => type.includes(t)) && !subtype.includes(cndType);
            } else if (department === 'Civil') {
                return civilTypes.some(t => type.includes(t)) && !subtype.includes(cndType);
            } else {
                return subtype.includes(cndType);
            }
        });

        const stats: DepartmentStats = {
            total: deptData.length,
            closed: 0,
            statusCounts: {},
            closureRate: 0,
            officers: new Set(),
        };
        uniqueStatuses.forEach(s => stats.statusCounts[s] = 0);

        deptData.forEach(complaint => {
            const rawStatus = (complaint['Status'] || 'Unknown').trim();
            stats.statusCounts[rawStatus] = (stats.statusCounts[rawStatus] || 0) + 1;

            if (rawStatus.toLowerCase().includes('close')) stats.closed++;

            if (complaint.assignedOfficer) {
                stats.officers.add(complaint.assignedOfficer);
            }
        });

        stats.closureRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
        return stats;
    };

    const sanitationStats = calculateDepartmentStats('Sanitation');
    const civilStats = calculateDepartmentStats('Civil');
    const cndStats = calculateDepartmentStats('C&D');

    const DepartmentCard = ({
        department,
        stats,
        icon: Icon,
        color
    }: {
        department: string;
        stats: DepartmentStats;
        icon: typeof Building2;
        color: string;
    }) => {
        return (
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${color.replace('border-', 'border-opacity-50 border-')} transition-all hover:shadow-md`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${color.replace('border', 'bg').replace('500', '50')}`}>
                            <Icon className={`w-8 h-8 ${color.replace('border', 'text')}`} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">{department}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Closure Rate</p>
                        <p className={`text-3xl font-bold ${stats.closureRate >= 80 ? 'text-green-600' :
                            stats.closureRate >= 60 ? 'text-yellow-600' :
                                stats.closureRate >= 40 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                            {stats.closureRate.toFixed(1)}%
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Total</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>

                    {/* Dynamic Status Blocks */}
                    {uniqueStatuses.map(status => {
                        // Color mapping fallback
                        let bgColor = 'bg-slate-50';
                        let textColor = 'text-slate-700';
                        const lowerStatus = status.toLowerCase();

                        if (lowerStatus.includes('close')) { bgColor = 'bg-green-50'; textColor = 'text-green-700'; }
                        else if (lowerStatus.includes('open')) { bgColor = 'bg-amber-50'; textColor = 'text-amber-700'; }
                        else if (lowerStatus.includes('pending')) { bgColor = 'bg-blue-50'; textColor = 'text-blue-700'; }
                        else if (lowerStatus.includes('reject')) { bgColor = 'bg-red-50'; textColor = 'text-red-700'; }
                        else if (lowerStatus.includes('progress')) { bgColor = 'bg-indigo-50'; textColor = 'text-indigo-700'; }

                        return (
                            <div key={status} className={`${bgColor} p-3 rounded-lg`}>
                                <p className={`text-xs ${textColor} mb-1`}>{status}</p>
                                <p className={`text-2xl font-bold ${textColor}`}>
                                    {stats.statusCounts[status] || 0}
                                </p>
                            </div>
                        );
                    })}

                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">Officers</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.officers.size}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Progress</span>
                        <span>{stats.closed} / {stats.total}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full ${stats.closureRate >= 80 ? 'bg-green-500' :
                                stats.closureRate >= 60 ? 'bg-yellow-500' :
                                    stats.closureRate >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${stats.closureRate}%` }}
                        />
                    </div>
                </div>
            </div>
        )
    };

    // Filter officers by department
    const getOfficersByDepartment = (department: 'Sanitation' | 'Civil' | 'C&D') => {
        const deptData = filteredData.filter(complaint => {
            const type = complaint['Complainttype'] || '';
            const subtype = complaint['complaintsubtype'] || '';

            const sanitationTypes = ['Door To Door', 'Road Sweeping', 'Drain Cleaning', 'Sanitation', 'Dead Animals'];
            const civilTypes = ['STREET LIGHT', 'Civil', 'Water Logging'];
            const cndType = "Illegal Dumping of C&D waste";

            if (department === 'Sanitation') {
                return sanitationTypes.some(t => type.includes(t)) && !subtype.includes(cndType);
            } else if (department === 'Civil') {
                return civilTypes.some(t => type.includes(t)) && !subtype.includes(cndType);
            } else {
                return subtype.includes(cndType);
            }
        });

        interface OfficerRowStats {
            total: number;
            closed: number;
            statusCounts: Record<string, number>;
        }

        const officerStats: Record<string, OfficerRowStats> = {};

        deptData.forEach(complaint => {
            const officer = complaint.assignedOfficer;
            if (!officer) return;

            if (!officerStats[officer]) {
                officerStats[officer] = { total: 0, closed: 0, statusCounts: {} };
                uniqueStatuses.forEach(s => officerStats[officer].statusCounts[s] = 0);
            }

            const s = officerStats[officer];
            s.total++;
            const rawStatus = (complaint['Status'] || 'Unknown').trim();
            s.statusCounts[rawStatus] = (s.statusCounts[rawStatus] || 0) + 1;

            if (rawStatus.toLowerCase().includes('close')) s.closed++;
        });

        return Object.entries(officerStats)
            .map(([officer, stats]) => ({
                officer,
                ...stats,
                closureRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
            }))
            .sort((a, b) => b.total - a.total);
    };

    const sanitationOfficers = getOfficersByDepartment('Sanitation');
    const civilOfficers = getOfficersByDepartment('Civil');
    const cndOfficers = getOfficersByDepartment('C&D');

    const handleExportExcel = () => {
        const dataToExport: any[] = [];
        const processExport = (deptName: string, officers: any[]) => {
            officers.forEach((o, index) => {
                const row: any = {
                    'Department': deptName,
                    'Sr No': index + 1,
                    'Officer': o.officer,
                    'Total': o.total,
                    'Closed': o.closed,
                };
                uniqueStatuses.forEach(s => row[s] = o.statusCounts[s]);
                row['Closure Rate'] = `${o.closureRate.toFixed(2)}%`;
                dataToExport.push(row);
            });
        };

        if (selectedDept === 'Both' || selectedDept === 'Sanitation') processExport('Sanitation', sanitationOfficers);
        if (selectedDept === 'Both' || selectedDept === 'Civil') processExport('Civil', civilOfficers);
        if (selectedDept === 'Both' || selectedDept === 'C&D') processExport('C&D', cndOfficers);

        exportToExcel(dataToExport, `Department_Report_${selectedDept}_${new Date().toISOString().split('T')[0]}`);
    };

    const DynamicTable = ({ title, officers }: { title: string, officers: any[] }) => (
        <div className="overflow-hidden border border-slate-300">
            <div className={`px-6 py-3 border-b border-slate-400 bg-white`}>
                <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="excel-table">
                    <thead>
                        <tr>
                            <th className="text-center w-16">Sr. No</th>
                            <th className="text-left">Officer</th>
                            <th className="text-center w-24">Total</th>

                            {/* Dynamic Status Columns with Colors */}
                            {uniqueStatuses.map(status => {
                                let bgColor = 'bg-slate-200';
                                const lowerStatus = status.toLowerCase();
                                if (lowerStatus.includes('close')) bgColor = 'bg-green-200';
                                else if (lowerStatus.includes('open')) bgColor = 'bg-amber-200';
                                else if (lowerStatus.includes('pending')) bgColor = 'bg-blue-200';
                                else if (lowerStatus.includes('reject') || lowerStatus.includes('re-open')) bgColor = 'bg-red-200';

                                return (
                                    <th key={status} className={`text-center min-w-[80px] ${bgColor}`}>
                                        {status}
                                    </th>
                                );
                            })}

                            <th className="text-center w-32 bg-purple-200">Closure Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {officers.map((officer, idx) => (
                            <tr key={officer.officer} className="hover:bg-slate-100">
                                <td className="text-center text-slate-600">{idx + 1}</td>
                                <td className="font-semibold text-slate-800">{officer.officer}</td>
                                <td className="text-center font-bold text-slate-900">{officer.total}</td>

                                {uniqueStatuses.map(status => {
                                    const count = officer.statusCounts[status] || 0;
                                    const lowerStatus = status.toLowerCase();
                                    let cellClass = '';

                                    if (lowerStatus.includes('close')) cellClass = 'status-closed';
                                    else if (lowerStatus.includes('open') && !lowerStatus.includes('re-open')) cellClass = 'status-open';
                                    else if (lowerStatus.includes('pending')) cellClass = 'status-pending';
                                    else if (lowerStatus.includes('reject') || lowerStatus.includes('re-open')) cellClass = 'status-reopen';
                                    else cellClass = 'status-scope';

                                    return (
                                        <td key={status} className={`text-center ${cellClass}`}>
                                            {count || '-'}
                                        </td>
                                    );
                                })}

                                <td className={`text-center font-bold ${officer.closureRate >= 80 ? 'rate-excellent' :
                                    officer.closureRate >= 60 ? 'rate-good' :
                                        officer.closureRate >= 40 ? 'rate-fair' : 'rate-poor'
                                    }`}>
                                    {officer.total === 0 ? '-' : `${officer.closureRate.toFixed(1)}%`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Controls Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        Department Reports
                    </h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setSelectedDept('Both')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedDept === 'Both'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setSelectedDept('Sanitation')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedDept === 'Sanitation'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Sanitation
                    </button>
                    <button
                        onClick={() => setSelectedDept('Civil')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedDept === 'Civil'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Civil
                    </button>
                    <button
                        onClick={() => setSelectedDept('C&D')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedDept === 'C&D'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        C&D
                    </button>
                </div>
                <div className="flex gap-2">
                    <ExportMenu
                        onExportJPEG={() => exportToJPEG('dept-report-content', 'Department_Performance_Report')}
                        onExportPDF={() => exportToPDF('dept-report-content', 'Department_Performance_Report')}
                        onExportExcel={handleExportExcel}
                    />
                </div>
            </div>

            {/* Export Wrapper */}
            <div id="dept-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                <ReportHeader
                    title={`${selectedDept === 'Both' ? 'All Departments' : selectedDept + ' Department'} Performance`}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />

                <div className="space-y-8">
                    {/* Department Summary Cards */}
                    {(selectedDept === 'Both' || selectedDept === 'Sanitation') && (
                        <DepartmentCard
                            department="Sanitation Department"
                            stats={sanitationStats}
                            icon={Droplet}
                            color="border-blue-500"
                        />
                    )}

                    {(selectedDept === 'Both' || selectedDept === 'Civil') && (
                        <DepartmentCard
                            department="Civil Department"
                            stats={civilStats}
                            icon={Building2}
                            color="border-green-500"
                        />
                    )}

                    {(selectedDept === 'Both' || selectedDept === 'C&D') && (
                        <DepartmentCard
                            department="C&D Waste Department"
                            stats={cndStats}
                            icon={Trash2}
                            color="border-amber-500"
                        />
                    )}

                    {/* Officer Tables */}
                    {(selectedDept === 'Both' || selectedDept === 'Sanitation') && sanitationOfficers.length > 0 && (
                        <DynamicTable title="Sanitation Officers" officers={sanitationOfficers} />
                    )}

                    {(selectedDept === 'Both' || selectedDept === 'Civil') && civilOfficers.length > 0 && (
                        <DynamicTable title="Civil Officers" officers={civilOfficers} />
                    )}

                    {(selectedDept === 'Both' || selectedDept === 'C&D') && cndOfficers.length > 0 && (
                        <DynamicTable title="C&D Department Officers" officers={cndOfficers} />
                    )}
                </div>
            </div>
        </div>
    );
};
