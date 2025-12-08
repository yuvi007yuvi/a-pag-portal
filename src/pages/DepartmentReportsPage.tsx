import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Building2, Droplet, FileText } from 'lucide-react';
import { ReportHeader } from '../components/ReportHeader';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';

interface DepartmentStats {
    total: number;
    closed: number;
    open: number;
    pending: number;
    closureRate: number;
    officers: Set<string>;
}

export const DepartmentReportsPage: React.FC = () => {
    const { filteredData, stats, dateFrom, dateTo } = useData();
    const [selectedDept, setSelectedDept] = useState<'Sanitation' | 'Civil' | 'Both'>('Both');

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    // Calculate department-wise statistics
    const calculateDepartmentStats = (department: 'Sanitation' | 'Civil'): DepartmentStats => {
        const deptData = filteredData.filter(complaint => {
            const type = complaint['Complainttype'] || '';
            const sanitationTypes = ['Door To Door', 'Road Sweeping', 'Drain Cleaning', 'Sanitation', 'Dead Animals'];
            const civilTypes = ['STREET LIGHT', 'Civil', 'Water Logging'];

            if (department === 'Sanitation') {
                return sanitationTypes.some(t => type.includes(t));
            } else {
                return civilTypes.some(t => type.includes(t));
            }
        });

        const stats: DepartmentStats = {
            total: deptData.length,
            closed: 0,
            open: 0,
            pending: 0,
            closureRate: 0,
            officers: new Set(),
        };

        deptData.forEach(complaint => {
            const status = complaint['Status']?.toLowerCase() || '';
            if (status.includes('close')) stats.closed++;
            else if (status.includes('open')) stats.open++;
            else if (status.includes('pending')) stats.pending++;
            else stats.open++;

            if (complaint.assignedOfficer) {
                stats.officers.add(complaint.assignedOfficer);
            }
        });

        stats.closureRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
        return stats;
    };

    const sanitationStats = calculateDepartmentStats('Sanitation');
    const civilStats = calculateDepartmentStats('Civil');

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
    }) => (
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Total</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 mb-1">Closed</p>
                    <p className="text-2xl font-bold text-green-700">{stats.closed}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-xs text-amber-600 mb-1">Open</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.open}</p>
                </div>
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
    );

    // Filter officers by department
    const getOfficersByDepartment = (department: 'Sanitation' | 'Civil') => {
        const deptData = filteredData.filter(complaint => {
            const type = complaint['Complainttype'] || '';
            const sanitationTypes = ['Door To Door', 'Road Sweeping', 'Drain Cleaning', 'Sanitation', 'Dead Animals'];
            const civilTypes = ['STREET LIGHT', 'Civil', 'Water Logging'];

            if (department === 'Sanitation') {
                return sanitationTypes.some(t => type.includes(t));
            } else {
                return civilTypes.some(t => type.includes(t));
            }
        });

        const officerStats: Record<string, { total: number; closed: number; open: number }> = {};

        deptData.forEach(complaint => {
            const officer = complaint.assignedOfficer;
            if (!officer) return;

            if (!officerStats[officer]) {
                officerStats[officer] = { total: 0, closed: 0, open: 0 };
            }

            officerStats[officer].total++;
            const status = complaint['Status']?.toLowerCase() || '';
            if (status.includes('close')) officerStats[officer].closed++;
            else officerStats[officer].open++;
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

    const handleExportExcel = () => {
        const dataToExport: any[] = [];

        if (selectedDept === 'Both' || selectedDept === 'Sanitation') {
            sanitationOfficers.forEach((o, index) => {
                dataToExport.push({
                    'Department': 'Sanitation',
                    'Sr No': index + 1,
                    'Officer': o.officer,
                    'Total': o.total,
                    'Closed': o.closed,
                    'Open': o.open,
                    'Closure Rate': `${o.closureRate.toFixed(2)}%`
                });
            });
        }

        if (selectedDept === 'Both' || selectedDept === 'Civil') {
            civilOfficers.forEach((o, index) => {
                dataToExport.push({
                    'Department': 'Civil',
                    'Sr No': index + 1,
                    'Officer': o.officer,
                    'Total': o.total,
                    'Closed': o.closed,
                    'Open': o.open,
                    'Closure Rate': `${o.closureRate.toFixed(2)}%`
                });
            });
        }

        exportToExcel(dataToExport, `Department_Report_${selectedDept}_${new Date().toISOString().split('T')[0]}`);
    };

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
                        Both
                    </button>
                    <button
                        onClick={() => setSelectedDept('Sanitation')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedDept === 'Sanitation'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Sanitation Only
                    </button>
                    <button
                        onClick={() => setSelectedDept('Civil')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedDept === 'Civil'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Civil Only
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
                    title={`${selectedDept === 'Both' ? 'Civil & Sanitation' : selectedDept} Department Performance`}
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

                    {/* Officer Tables */}
                    {(selectedDept === 'Both' || selectedDept === 'Sanitation') && sanitationOfficers.length > 0 && (
                        <div className="overflow-hidden border border-slate-300">
                            <div className="px-6 py-4 border-b border-slate-300 bg-blue-50">
                                <h3 className="font-bold text-slate-800 text-lg uppercase">Sanitation Officers</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse border border-slate-300 relative">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-16 bg-slate-100">Sr. No</th>
                                            <th className="border border-slate-300 px-2 py-2 text-left font-bold text-slate-700 bg-slate-100">Officer</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-24 bg-slate-100">Total</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-24 bg-slate-100">Closed</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-24 bg-slate-100">Open</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-32 bg-slate-100">Closure Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sanitationOfficers.map((officer, idx) => (
                                            <tr key={officer.officer} className="hover:bg-blue-50 even:bg-slate-50/50 transition-colors">
                                                <td className="border border-slate-300 px-2 py-1 text-center text-slate-600">{idx + 1}</td>
                                                <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-800">{officer.officer}</td>
                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-900 bg-slate-50">{officer.total}</td>
                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold text-green-700 bg-green-50">{officer.closed}</td>
                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold text-amber-700 bg-amber-50">{officer.open}</td>
                                                <td className={`border border-slate-300 px-2 py-1 text-center font-bold ${officer.closureRate >= 80 ? 'text-green-700 bg-green-100' :
                                                    officer.closureRate >= 60 ? 'text-yellow-700 bg-yellow-100' :
                                                        officer.closureRate >= 40 ? 'text-orange-700 bg-orange-100' : 'text-red-700 bg-red-100'
                                                    }`}>
                                                    {officer.closureRate.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(selectedDept === 'Both' || selectedDept === 'Civil') && civilOfficers.length > 0 && (
                        <div className="overflow-hidden border border-slate-300">
                            <div className="px-6 py-4 border-b border-slate-300 bg-green-50">
                                <h3 className="font-bold text-slate-800 text-lg uppercase">Civil Officers</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse border border-slate-300 relative">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-16 bg-slate-100">Sr. No</th>
                                            <th className="border border-slate-300 px-2 py-2 text-left font-bold text-slate-700 bg-slate-100">Officer</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-24 bg-slate-100">Total</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-24 bg-slate-100">Closed</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-24 bg-slate-100">Open</th>
                                            <th className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-32 bg-slate-100">Closure Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {civilOfficers.map((officer, idx) => (
                                            <tr key={officer.officer} className="hover:bg-green-50 even:bg-slate-50/50 transition-colors">
                                                <td className="border border-slate-300 px-2 py-1 text-center text-slate-600">{idx + 1}</td>
                                                <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-800">{officer.officer}</td>
                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-900 bg-slate-50">{officer.total}</td>
                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold text-green-700 bg-green-50">{officer.closed}</td>
                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold text-amber-700 bg-amber-50">{officer.open}</td>
                                                <td className={`border border-slate-300 px-2 py-1 text-center font-bold ${officer.closureRate >= 80 ? 'text-green-700 bg-green-100' :
                                                    officer.closureRate >= 60 ? 'text-yellow-700 bg-yellow-100' :
                                                        officer.closureRate >= 40 ? 'text-orange-700 bg-orange-100' : 'text-red-700 bg-red-100'
                                                    }`}>
                                                    {officer.closureRate.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
