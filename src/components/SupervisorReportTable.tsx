import React, { useMemo, useState } from 'react';
import { officerMappings } from '../data/officerMappings';
import type { ComplaintRecord } from '../utils/dataProcessor';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface Props {
    data: ComplaintRecord[];
    department?: 'Sanitation' | 'Civil';
}

interface SupervisorStats {
    supervisor: string;
    total: number;
    closed: number;
    open: number;
    pending: number;
    closureRate: number;
}

export const SupervisorReportTable: React.FC<Props> = ({ data, department }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof SupervisorStats; direction: 'asc' | 'desc' } | null>({ key: 'total', direction: 'desc' });

    const stats = useMemo(() => {
        const statsMap: Record<string, SupervisorStats> = {};

        // 1. Initialize all mapped supervisors with 0 counts, optionally filtered
        const relevantMappings = department
            ? officerMappings.filter(m => m.department === department)
            : officerMappings;

        const uniqueSupervisors = new Set(relevantMappings.map(m => m.supervisor));
        uniqueSupervisors.forEach(supervisor => {
            // Normalize supervisor names if needed (some have '&' or multiple names)
            // Ideally we keep them as is from the mapping to match the 'assignedSupervisor' logic
            statsMap[supervisor] = {
                supervisor,
                total: 0,
                closed: 0,
                open: 0,
                pending: 0,
                closureRate: 0
            };
        });

        // 2. Aggregate counts from actual data
        data.forEach(accord => {
            const supervisor = accord.assignedSupervisor;
            if (!supervisor) return;

            // If supervisor exists in mapping (it should), update stats
            // If not (e.g. data has a supervisor name slightly different but findOfficer failed?), we skip or add new?
            // "findOfficer" normalizes mappings, so assignedSupervisor should match mapping values.
            if (!statsMap[supervisor]) {
                // Should technically not happen if mappings are complete, but safe fallback
                statsMap[supervisor] = {
                    supervisor,
                    total: 0,
                    closed: 0,
                    open: 0,
                    pending: 0,
                    closureRate: 0
                };
            }

            const s = statsMap[supervisor];
            s.total++;

            const status = accord['Status']?.toLowerCase() || '';
            if (status.includes('close')) s.closed++;
            else if (status.includes('open')) s.open++;
            // 'pending' is sometimes separate or part of open depending on definitions. 
            // In SFITable logic: if status has 'pending' -> pending. else open.
            else if (status.includes('pending')) s.pending++;
            else s.open++; // Default fallback
        });

        // 3. Calculate Rates
        Object.values(statsMap).forEach(s => {
            s.closureRate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
        });

        return Object.values(statsMap);
    }, [data]);

    const filteredStats = useMemo(() => {
        return stats.filter(s =>
            s.supervisor.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stats, searchTerm]);

    const sortedStats = useMemo(() => {
        if (!sortConfig) return filteredStats;

        return [...filteredStats].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredStats, sortConfig]);

    const handleSort = (key: keyof SupervisorStats) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default desc for numbers usually

        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: keyof SupervisorStats }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="w-4 h-4 text-slate-400 ml-1 inline" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-4 h-4 text-blue-600 ml-1 inline" />
            : <ArrowDown className="w-4 h-4 text-blue-600 ml-1 inline" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Supervisor Performance Metrics</h3>
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Search supervisor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 w-16">Sr No</th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('supervisor')}
                            >
                                Supervisor Name <SortIcon column="supervisor" />
                            </th>
                            <th
                                className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('total')}
                            >
                                Total Complaints <SortIcon column="total" />
                            </th>
                            <th
                                className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors text-green-700"
                                onClick={() => handleSort('closed')}
                            >
                                Closed <SortIcon column="closed" />
                            </th>
                            <th
                                className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors text-red-600"
                                onClick={() => handleSort('open')}
                            >
                                Open <SortIcon column="open" />
                            </th>
                            <th
                                className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors text-yellow-600"
                                onClick={() => handleSort('pending')}
                            >
                                Pending <SortIcon column="pending" />
                            </th>
                            <th
                                className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors bg-blue-50"
                                onClick={() => handleSort('closureRate')}
                            >
                                Closure Rate <SortIcon column="closureRate" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {sortedStats.map((stat, index) => (
                            <tr key={stat.supervisor} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-500">{index + 1}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900">{stat.supervisor}</td>
                                <td className="px-6 py-4 text-center font-bold text-slate-800 bg-slate-50/50">{stat.total}</td>
                                <td className="px-6 py-4 text-center text-green-600 font-medium bg-green-50/30">{stat.closed}</td>
                                <td className="px-6 py-4 text-center text-red-600 font-medium bg-red-50/30">{stat.open}</td>
                                <td className="px-6 py-4 text-center text-yellow-600 font-medium bg-yellow-50/30">{stat.pending}</td>
                                <td className="px-6 py-4 text-center font-bold bg-blue-50/30 text-blue-700">
                                    {stat.total > 0 ? (
                                        <span className={`px-2 py-1 rounded ${stat.closureRate >= 80 ? 'bg-green-100 text-green-800' :
                                            stat.closureRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {stat.closureRate.toFixed(1)}%
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs">N/A</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {sortedStats.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    No supervisors found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
