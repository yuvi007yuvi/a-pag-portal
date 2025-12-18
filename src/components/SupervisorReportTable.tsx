import React, { useMemo, useState } from 'react';
import { officerMappings } from '../data/officerMappings';
import { normalizeSupervisorName, type ComplaintRecord } from '../utils/dataProcessor';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
    data: ComplaintRecord[];
    department?: 'Sanitation' | 'Civil';
    allowedSupervisors?: string[];
}



export const SupervisorReportTable: React.FC<Props> = ({ data, department, allowedSupervisors }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'total', direction: 'desc' });
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (supervisor: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(supervisor)) {
            newExpanded.delete(supervisor);
        } else {
            newExpanded.add(supervisor);
        }
        setExpandedRows(newExpanded);
    };

    // Identify unique statuses
    const uniqueStatuses = useMemo(() => Array.from(new Set(data.map(d => {
        const s = d['Status'] || 'Unknown';
        return s.trim();
    }))).sort(), [data]);

    // Map normalized supervisor name to list of wards
    const supervisorWardsMap = useMemo(() => {
        const map: Record<string, string[]> = {};
        const relevantMappings = department
            ? officerMappings.filter(m => m.department === department)
            : officerMappings;

        relevantMappings.forEach(m => {
            const normName = normalizeSupervisorName(m.supervisor);
            if (!map[normName]) map[normName] = [];
            if (!map[normName].includes(m.ward)) {
                map[normName].push(m.ward);
            }
        });
        // Sort wards for consistency
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => {
                const numA = parseInt(a.match(/^\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/^\d+/)?.[0] || '0');
                return numA - numB || a.localeCompare(b);
            });
        });
        return map;
    }, [department]);

    interface DynamicSupervisorStats {
        supervisor: string;
        total: number;
        closed: number;
        statusCounts: Record<string, number>;
        closureRate: number;
        wards: Record<string, {
            name: string;
            total: number;
            closed: number;
            statusCounts: Record<string, number>;
            closureRate: number;
        }>;
        [key: string]: any;
    }

    const stats = useMemo(() => {
        const statsMap: Record<string, DynamicSupervisorStats> = {};

        let supervisorsList: string[] = [];

        if (allowedSupervisors && allowedSupervisors.length > 0) {
            supervisorsList = allowedSupervisors;
        } else {
            const relevantMappings = department
                ? officerMappings.filter(m => m.department === department)
                : officerMappings;
            supervisorsList = relevantMappings.map(m => m.supervisor);
        }

        const uniqueSupervisors = new Set(supervisorsList.map(name => normalizeSupervisorName(name)));
        uniqueSupervisors.forEach(supervisor => {
            statsMap[supervisor] = {
                supervisor,
                total: 0,
                closed: 0,
                statusCounts: {},
                closureRate: 0,
                wards: {}
            };
            uniqueStatuses.forEach(s => statsMap[supervisor].statusCounts[s] = 0);
        });

        data.forEach(accord => {
            const supervisor = accord.assignedSupervisor;
            if (!supervisor) return;

            // If strict department/filter filtering is active, ignore supervisors not in the relevant mappings
            if ((department || (allowedSupervisors && allowedSupervisors.length > 0)) && !uniqueSupervisors.has(supervisor)) return;

            if (!statsMap[supervisor]) {
                statsMap[supervisor] = {
                    supervisor,
                    total: 0,
                    closed: 0,
                    statusCounts: {},
                    closureRate: 0,
                    wards: {}
                };
                uniqueStatuses.forEach(s => statsMap[supervisor].statusCounts[s] = 0);
            }

            const s = statsMap[supervisor];
            s.total++;

            // Ward-wise stats
            const ward = accord['Ward'] || 'Unknown Ward';
            if (!s.wards[ward]) {
                s.wards[ward] = {
                    name: ward,
                    total: 0,
                    closed: 0,
                    statusCounts: {},
                    closureRate: 0
                };
                uniqueStatuses.forEach(st => s.wards[ward].statusCounts[st] = 0);
            }
            const w = s.wards[ward];
            w.total++;

            const rawStatus = (accord['Status'] || 'Unknown').trim();
            s.statusCounts[rawStatus] = (s.statusCounts[rawStatus] || 0) + 1;
            w.statusCounts[rawStatus] = (w.statusCounts[rawStatus] || 0) + 1;

            if (rawStatus.toLowerCase().includes('close')) {
                s.closed++;
                w.closed++;
            }
        });

        // Calculate Rates
        Object.values(statsMap).forEach(s => {
            s.closureRate = s.total > 0 ? (s.closed / s.total) * 100 : 0;

            // Calculate ward rates
            Object.values(s.wards).forEach(w => {
                w.closureRate = w.total > 0 ? (w.closed / w.total) * 100 : 0;
            });
        });

        return Object.values(statsMap);
    }, [data, department, uniqueStatuses]);

    const filteredStats = useMemo(() => {
        return stats.filter(s =>
            s.supervisor.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stats, searchTerm]);

    const sortedStats = useMemo(() => {
        if (!sortConfig) return filteredStats;

        return [...filteredStats].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            // Handle dynamic status keys
            if (uniqueStatuses.includes(sortConfig.key)) {
                aVal = a.statusCounts[sortConfig.key] || 0;
                bVal = b.statusCounts[sortConfig.key] || 0;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredStats, sortConfig, uniqueStatuses]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: string }) => {
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
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('supervisor')}>
                                Supervisor Name <SortIcon column="supervisor" />
                            </th>
                            <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('total')}>
                                Total Complaints <SortIcon column="total" />
                            </th>

                            {/* Dynamic Status Columns */}
                            {uniqueStatuses.map(status => (
                                <th key={status} className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort(status)}>
                                    {status} <SortIcon column={status} />
                                </th>
                            ))}

                            <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors bg-blue-50" onClick={() => handleSort('closureRate')}>
                                Closure Rate <SortIcon column="closureRate" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {sortedStats.map((stat, index) => (
                            <React.Fragment key={stat.supervisor}>
                                <tr className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleRow(stat.supervisor)}
                                                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
                                            >
                                                {expandedRows.has(stat.supervisor) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-900">
                                        <div
                                            className="cursor-pointer hover:text-blue-600"
                                            onClick={() => toggleRow(stat.supervisor)}
                                        >
                                            {stat.supervisor}
                                        </div>
                                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                                            ({supervisorWardsMap[stat.supervisor]?.join(', ') || 'No Ward'})
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800 bg-slate-50/50">{stat.total}</td>

                                    {/* Dynamic Status Counts */}
                                    {uniqueStatuses.map(status => {
                                        const count = stat.statusCounts[status] || 0;
                                        let colorClass = 'text-slate-600 bg-slate-50/30';
                                        if (status.toLowerCase().includes('close')) colorClass = 'text-green-600 bg-green-50/30 font-medium';
                                        else if (status.toLowerCase().includes('open')) colorClass = 'text-red-600 bg-red-50/30 font-medium';
                                        else if (status.toLowerCase().includes('pending')) colorClass = 'text-yellow-600 bg-yellow-50/30 font-medium';

                                        return (
                                            <td key={status} className={`px-6 py-4 text-center ${colorClass}`}>
                                                {count}
                                            </td>
                                        );
                                    })}

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
                                {expandedRows.has(stat.supervisor) && (
                                    <tr>
                                        <td colSpan={uniqueStatuses.length + 4} className="bg-slate-50/50 p-0 border-b border-slate-200 shadow-inner">
                                            <div className="px-16 py-4">
                                                <table className="w-full text-xs text-left bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                                    <thead className="bg-slate-100 text-slate-600">
                                                        <tr>
                                                            <th className="px-4 py-2 font-medium">Ward Name</th>
                                                            <th className="px-4 py-2 font-medium text-center">Total</th>
                                                            {uniqueStatuses.map(status => (
                                                                <th key={status} className="px-4 py-2 font-medium text-center truncate max-w-[100px]" title={status}>{status}</th>
                                                            ))}
                                                            <th className="px-4 py-2 font-medium text-center">Closure Rate</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {Object.values(stat.wards).sort((a, b) => b.total - a.total).map((ward) => (
                                                            <tr key={ward.name} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 font-medium text-slate-700">{ward.name}</td>
                                                                <td className="px-4 py-2 text-center font-semibold">{ward.total}</td>
                                                                {uniqueStatuses.map(status => (
                                                                    <td key={status} className="px-4 py-2 text-center text-slate-500">
                                                                        {ward.statusCounts[status] || 0}
                                                                    </td>
                                                                ))}
                                                                <td className="px-4 py-2 text-center font-semibold text-blue-600">
                                                                    {ward.total > 0 ? `${ward.closureRate.toFixed(1)}%` : 'N/A'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {Object.keys(stat.wards).length === 0 && (
                                                            <tr>
                                                                <td colSpan={uniqueStatuses.length + 3} className="px-4 py-3 text-center text-slate-400 italic">
                                                                    No ward data found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {sortedStats.length === 0 && (
                            <tr>
                                <td colSpan={uniqueStatuses.length + 4} className="px-6 py-12 text-center text-slate-500">
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
