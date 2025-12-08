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
}

export const SFIReportTable: React.FC<SFIReportTableProps> = ({ data }) => {
    const [sortColumn, setSortColumn] = useState<keyof OfficerStats>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Initialize all officers from mapping with zero stats
    const officerStats: Record<string, OfficerStats> = {};

    // First, add all officers from the mapping
    const uniqueOfficers = new Set(officerMappings.map(m => m.officer));
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                <h3 className="font-semibold text-slate-800 text-lg">SFI/Officer Performance Report</h3>
                <p className="text-sm text-slate-500 mt-1">All officers including those with no assigned complaints</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b-2 border-slate-200">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('officer')}>
                                <div className="flex items-center gap-1">
                                    Officer Name <SortIcon column="officer" />
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('total')}>
                                <div className="flex items-center justify-center gap-1">
                                    Total <SortIcon column="total" />
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('closed')}>
                                <div className="flex items-center justify-center gap-1">
                                    Closed <SortIcon column="closed" />
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('open')}>
                                <div className="flex items-center justify-center gap-1">
                                    Open <SortIcon column="open" />
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('pending')}>
                                <div className="flex items-center justify-center gap-1">
                                    Pending <SortIcon column="pending" />
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('closureRate')}>
                                <div className="flex items-center justify-center gap-1">
                                    Closure Rate <SortIcon column="closureRate" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {statsArray.map((stats, index) => (
                            <tr key={stats.officer} className={`border-b hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                <td className="px-6 py-4 font-medium text-blue-700">{stats.officer}</td>
                                <td className="px-6 py-4 text-center font-semibold text-slate-900">
                                    {stats.total === 0 ? <span className="text-slate-400">N/A</span> : stats.total}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full font-medium ${stats.total === 0 ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {stats.closed}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full font-medium ${stats.total === 0 ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                        {stats.open}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full font-medium ${stats.total === 0 ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {stats.pending}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {stats.total === 0 ? (
                                        <span className="text-slate-400">N/A</span>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-24 bg-slate-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${stats.closureRate >= 80 ? 'bg-green-500' :
                                                            stats.closureRate >= 60 ? 'bg-yellow-500' :
                                                                stats.closureRate >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${stats.closureRate}%` }}
                                                />
                                            </div>
                                            <span className="font-semibold text-slate-700 min-w-[3rem] text-right">
                                                {stats.closureRate.toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                    Total Officers: <span className="font-semibold">{statsArray.length}</span> •
                    With Data: <span className="font-semibold">{statsArray.filter(s => s.total > 0).length}</span> •
                    Click column headers to sort
                </p>
            </div>
        </div>
    );
};
