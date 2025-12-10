import React, { useState } from 'react';
import type { ComplaintRecord } from '../utils/dataProcessor';
import { officerMappings } from '../data/officerMappings';

interface OfficerStats {
    officer: string;
    total: number;
    closed: number;
    open: number;
    pending: number;
    closureRate: number;
}

interface SFIReportTableProps {
    data: ComplaintRecord[];
    department?: 'Sanitation' | 'Civil';
}

export const SFIReportTable: React.FC<SFIReportTableProps> = ({ data, department }) => {
    const [sortColumn, setSortColumn] = useState<keyof OfficerStats>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Initialize all officers from mapping with zero stats
    const officerStats: Record<string, OfficerStats> = {};

    // First, add all officers from the mapping, optionally filtered by department
    const relevantMappings = department
        ? officerMappings.filter(m => m.department === department)
        : officerMappings;

    const uniqueOfficers = new Set(relevantMappings.map(m => m.officer));
    uniqueOfficers.forEach(officer => {
        officerStats[officer] = {
            officer,
            total: 0,
            closed: 0,
            open: 0,
            pending: 0,
            closureRate: 0,
        };
    });

    // Then, populate with actual complaint data
    data.forEach(complaint => {
        const officer = complaint.assignedOfficer;
        if (!officer) return;

        // If officer not in mapping, add them
        if (!officerStats[officer]) {
            officerStats[officer] = {
                officer,
                total: 0,
                closed: 0,
                open: 0,
                pending: 0,
                closureRate: 0,
            };
        }

        const stats = officerStats[officer];
        stats.total++;

        const status = complaint['Status']?.toLowerCase() || '';

        if (status.includes('close')) {
            stats.closed++;
        } else if (status.includes('open')) {
            stats.open++;
        } else if (status.includes('pending')) {
            stats.pending++;
        } else {
            stats.open++; // Count other statuses as open
        }
    });

    // Calculate closure rates
    Object.values(officerStats).forEach(stats => {
        stats.closureRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
    });

    // Convert to array and sort
    let statsArray = Object.values(officerStats);

    statsArray.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        return aVal > bVal ? multiplier : -multiplier;
    });

    const handleSort = (column: keyof OfficerStats) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ column }: { column: keyof OfficerStats }) => {
        if (sortColumn !== column) return <span className="text-slate-400">⇅</span>;
        return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="bg-white border border-slate-300 overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-3 border-b border-slate-300 bg-slate-50">
                <h3 className="font-semibold text-slate-800 text-lg">SFI/Officer Performance Report</h3>
                <p className="text-sm text-slate-500">All officers including those with no assigned complaints</p>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm text-left border-collapse border border-slate-300 relative">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 z-10 sticky top-0 shadow-sm">
                        <tr>
                            <th className="border border-slate-300 px-2 py-1 text-center w-16 bg-slate-100">Sr. No.</th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 bg-slate-100" onClick={() => handleSort('officer')}>
                                <div className="flex items-center gap-1">
                                    Officer Name <SortIcon column="officer" />
                                </div>
                            </th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center w-24 bg-slate-100" onClick={() => handleSort('total')}>
                                <div className="flex items-center justify-center gap-1">
                                    Total <SortIcon column="total" />
                                </div>
                            </th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center w-24 bg-slate-100" onClick={() => handleSort('closed')}>
                                <div className="flex items-center justify-center gap-1">
                                    Closed <SortIcon column="closed" />
                                </div>
                            </th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center w-24 bg-slate-100" onClick={() => handleSort('open')}>
                                <div className="flex items-center justify-center gap-1">
                                    Open <SortIcon column="open" />
                                </div>
                            </th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center w-24 bg-slate-100" onClick={() => handleSort('pending')}>
                                <div className="flex items-center justify-center gap-1">
                                    Pending <SortIcon column="pending" />
                                </div>
                            </th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center w-32 bg-slate-100" onClick={() => handleSort('closureRate')}>
                                <div className="flex items-center justify-center gap-1">
                                    Closure Rate <SortIcon column="closureRate" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {statsArray.map((stats, index) => (
                            <tr key={stats.officer} className="hover:bg-blue-50 even:bg-slate-50/50 transition-colors">
                                <td className="border border-slate-300 px-2 py-1 text-center font-medium text-slate-600">{index + 1}</td>
                                <td className="border border-slate-300 px-2 py-1 font-medium text-slate-800">{stats.officer}</td>
                                <td className="border border-slate-300 px-2 py-1 text-center font-semibold text-slate-900 bg-slate-50">
                                    {stats.total === 0 ? <span className="text-slate-400">-</span> : stats.total}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-center text-green-700 bg-green-50">
                                    {stats.closed}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-center text-amber-700 bg-amber-50">
                                    {stats.open}
                                </td>
                                <td className="border border-slate-300 px-2 py-1 text-center text-blue-700 bg-blue-50">
                                    {stats.pending}
                                </td>
                                <td className={`border border-slate-300 px-2 py-1 text-center font-semibold ${stats.total === 0 ? 'text-slate-400' :
                                    stats.closureRate >= 80 ? 'text-green-700 bg-green-100' :
                                        stats.closureRate >= 60 ? 'text-yellow-700 bg-yellow-100' :
                                            stats.closureRate >= 40 ? 'text-orange-700 bg-orange-100' : 'text-red-700 bg-red-100'
                                    }`}>
                                    {stats.total === 0 ? '-' : `${stats.closureRate.toFixed(1)}%`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-300">
                <p className="text-xs text-slate-500">
                    Total Officers: <span className="font-semibold">{statsArray.length}</span> •
                    With Data: <span className="font-semibold">{statsArray.filter(s => s.total > 0).length}</span>
                </p>
            </div>
        </div>
    );
};
