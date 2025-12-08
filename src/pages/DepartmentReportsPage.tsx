import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Building2, Droplet } from 'lucide-react';

interface DepartmentStats {
    total: number;
    closed: number;
    open: number;
    pending: number;
    closureRate: number;
    officers: Set<string>;
}

export const DepartmentReportsPage: React.FC = () => {
    const { filteredData, stats } = useData();
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
        <div className={`bg-white p-6 rounded-xl shadow-sm border-2 ${color} transition-all hover:shadow-lg`}>
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

            {/* Progress Bar */}
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Department-Wise Reports</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedDept('Both')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDept === 'Both'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        Both
                    </button>
                    <button
                        onClick={() => setSelectedDept('Sanitation')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDept === 'Sanitation'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        Sanitation Only
                    </button>
                    <button
                        onClick={() => setSelectedDept('Civil')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDept === 'Civil'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        Civil Only
                    </button>
                </div>
            </div>

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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-blue-50">
                        <h3 className="font-semibold text-slate-800 text-lg">Sanitation Officers Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Officer</th>
                                    <th className="px-6 py-3 text-center">Total</th>
                                    <th className="px-6 py-3 text-center">Closed</th>
                                    <th className="px-6 py-3 text-center">Open</th>
                                    <th className="px-6 py-3 text-center">Closure Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sanitationOfficers.map((officer, idx) => (
                                    <tr key={officer.officer} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                        <td className="px-6 py-4 font-medium text-blue-700">{officer.officer}</td>
                                        <td className="px-6 py-4 text-center font-semibold">{officer.total}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                                {officer.closed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                                                {officer.open}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold text-slate-700">
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-green-50">
                        <h3 className="font-semibold text-slate-800 text-lg">Civil Officers Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Officer</th>
                                    <th className="px-6 py-3 text-center">Total</th>
                                    <th className="px-6 py-3 text-center">Closed</th>
                                    <th className="px-6 py-3 text-center">Open</th>
                                    <th className="px-6 py-3 text-center">Closure Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {civilOfficers.map((officer, idx) => (
                                    <tr key={officer.officer} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                        <td className="px-6 py-4 font-medium text-green-700">{officer.officer}</td>
                                        <td className="px-6 py-4 text-center font-semibold">{officer.total}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                                {officer.closed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                                                {officer.open}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold text-slate-700">
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
    );
};
