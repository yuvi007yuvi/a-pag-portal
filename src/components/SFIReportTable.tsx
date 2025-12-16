import React, { useState } from 'react';
import type { ComplaintRecord } from '../utils/dataProcessor';
import { officerMappings } from '../data/officerMappings';



interface SFIReportTableProps {
    data: ComplaintRecord[];
    department?: 'Sanitation' | 'Civil';
}

export const SFIReportTable: React.FC<SFIReportTableProps> = ({ data, department }) => {


    // Normalize statuses for keys (e.g. "In Progress" -> "In Progress")
    // actually dataProcessor might already normalize. Let's assume we want to collect them all.
    // Better: Collect unique normalized statuses
    const uniqueStatuses = Array.from(new Set(data.map(d => {
        const s = d['Status'] || 'Unknown';
        // Capitalize first letter of each word? Or just trust data? 
        // Let's trust data but trim.
        return s.trim();
    }))).sort();

    // interface for dynamic usage
    interface DynamicOfficerStats {
        officer: string;
        total: number;
        closed: number; // Keep track of closed specifically for rate
        statusCounts: Record<string, number>;
        closureRate: number;
        [key: string]: any; // Allow indexing by status name
    }

    const [sortColumn, setSortColumn] = useState<string>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Initialize all officers from mapping
    const officerStats: Record<string, DynamicOfficerStats> = {};

    const relevantMappings = department
        ? officerMappings.filter(m => m.department === department)
        : officerMappings;

    const uniqueOfficers = new Set(relevantMappings.map(m => m.officer));
    uniqueOfficers.forEach(officer => {
        officerStats[officer] = {
            officer,
            total: 0,
            closed: 0,
            statusCounts: {},
            closureRate: 0,
        };
        // Initialize 0 for all known statuses (optional, helps table alignment if sparse)
        uniqueStatuses.forEach(s => officerStats[officer].statusCounts[s] = 0);
    });

    // Populate data
    data.forEach(complaint => {
        const officer = complaint.assignedOfficer;
        if (!officer) return;

        // If officer not in mapping (e.g. from another dept), add them?
        // For SFI report we usually filter by department in parent, but if data passes through:
        if (!officerStats[officer]) {
            officerStats[officer] = {
                officer,
                total: 0,
                closed: 0,
                statusCounts: {},
                closureRate: 0,
            };
            uniqueStatuses.forEach(s => officerStats[officer].statusCounts[s] = 0);
        }

        const stats = officerStats[officer];
        stats.total++;

        const rawStatus = (complaint['Status'] || 'Unknown').trim();
        stats.statusCounts[rawStatus] = (stats.statusCounts[rawStatus] || 0) + 1;

        // "closed" counter for rate calculation - strict check or includes?
        // Usually closure rate is based on "Close" or similar.
        if (rawStatus.toLowerCase().includes('close')) {
            stats.closed++;
        }
    });

    // Calculate rates
    Object.values(officerStats).forEach(stats => {
        stats.closureRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
    });

    // Sort
    let statsArray = Object.values(officerStats);
    statsArray.sort((a, b) => {
        let aVal: any = a[sortColumn];
        let bVal: any = b[sortColumn];

        // Handle sorting by specific status column
        if (uniqueStatuses.includes(sortColumn)) {
            aVal = a.statusCounts[sortColumn] || 0;
            bVal = b.statusCounts[sortColumn] || 0;
        }

        const multiplier = sortDirection === 'asc' ? 1 : -1;
        if (aVal > bVal) return multiplier;
        if (aVal < bVal) return -multiplier;
        return 0;
    });

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) return <span className="text-slate-400">⇅</span>;
        return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="bg-white border border-slate-300 overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-3 border-b border-slate-300 bg-slate-50">
                <h3 className="font-semibold text-slate-800 text-lg">OFFICERS WISE Performance Report</h3>
                <p className="text-sm text-slate-500">All officers breakdown by status</p>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm text-left border-collapse border border-slate-300 relative">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 z-10 sticky top-0 shadow-sm">
                        <tr>
                            <th className="border border-slate-300 px-2 py-1 text-center w-12 bg-slate-100">Sr.</th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 bg-slate-100 min-w-[150px]" onClick={() => handleSort('officer')}>
                                <div className="flex items-center gap-1">Officer <SortIcon column="officer" /></div>
                            </th>
                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center w-20 bg-slate-100" onClick={() => handleSort('total')}>
                                <div className="flex items-center justify-center gap-1">Total <SortIcon column="total" /></div>
                            </th>

                            {/* Dynamic Status Columns */}
                            {uniqueStatuses.map(status => (
                                <th key={status} className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center min-w-[80px] bg-slate-100" onClick={() => handleSort(status)}>
                                    <div className="flex items-center justify-center gap-1">{status} <SortIcon column={status} /></div>
                                </th>
                            ))}

                            <th className="border border-slate-300 px-2 py-1 cursor-pointer hover:bg-slate-200 text-center w-24 bg-slate-100" onClick={() => handleSort('closureRate')}>
                                <div className="flex items-center justify-center gap-1">Rate <SortIcon column="closureRate" /></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {statsArray.map((stats, index) => (
                            <tr key={stats.officer} className="hover:bg-blue-50 even:bg-slate-50/50 transition-colors">
                                <td className="border border-slate-300 px-2 py-1 text-center font-medium text-slate-600">{index + 1}</td>
                                <td className="border border-slate-300 px-2 py-1 font-medium text-slate-800">{stats.officer}</td>
                                <td className="border border-slate-300 px-2 py-1 text-center font-semibold text-slate-900 bg-slate-50">
                                    {stats.total === 0 ? '-' : stats.total}
                                </td>

                                {/* Dynamic Status Counts */}
                                {uniqueStatuses.map(status => {
                                    const count = stats.statusCounts[status] || 0;
                                    // Optional: Color coding for common statuses?
                                    let textColor = 'text-slate-600';
                                    let bgColor = '';
                                    if (status.toLowerCase().includes('close')) { textColor = 'text-green-700'; bgColor = 'bg-green-50'; }
                                    else if (status.toLowerCase().includes('open')) { textColor = 'text-amber-700'; bgColor = 'bg-amber-50'; }
                                    else if (status.toLowerCase().includes('pending')) { textColor = 'text-blue-700'; bgColor = 'bg-blue-50'; }

                                    return (
                                        <td key={status} className={`border border-slate-300 px-2 py-1 text-center ${textColor} ${bgColor}`}>
                                            {count || '-'}
                                        </td>
                                    );
                                })}

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
