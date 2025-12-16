import React from 'react';
import { useData } from '../context/DataContext';
import { StatsCard } from '../components/StatsCard';
import { ZoneChart } from '../components/ZoneChart';
import { StatusChart } from '../components/StatusChart';
import { OfficerChart } from '../components/OfficerChart';
import { SupervisorChart } from '../components/SupervisorChart';
import { CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
import { calculateStats } from '../utils/dataProcessor';

export const DashboardPage: React.FC = () => {
    const { stats, filteredData, data, dateFrom, dateTo, minDate, maxDate, setDateFrom, setDateTo, setStats, setFilteredData } = useData();

    const applyDateFilter = () => {
        if (!dateFrom || !dateTo) {
            setFilteredData(data);
            setStats(calculateStats(data));
            return;
        }

        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);

        const filtered = data.filter(record => {
            const complaintDate = new Date(record['Complaint Registered Date']);
            return complaintDate >= fromDate && complaintDate <= toDate;
        });

        setFilteredData(filtered);
        setStats(calculateStats(filtered));
    };

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
                <p className="text-slate-500 mt-1">Key performance metrics and complaint analytics</p>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 pr-6 border-r border-slate-100">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Data Range</span>
                            <span className="font-semibold text-slate-900">
                                {minDate} — {maxDate}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-slate-500 mb-1 ml-1">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    min={minDate}
                                    max={maxDate}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                            </div>
                            <div className="self-end pb-2 text-slate-400">→</div>
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-slate-500 mb-1 ml-1">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    min={minDate}
                                    max={maxDate}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={applyDateFilter}
                            className="self-end mb-[2px] px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                        >
                            Apply Filter
                        </button>

                        <div className="flex-1 text-right self-end pb-3">
                            <span className="text-sm font-medium text-slate-500">
                                Showing <span className="text-slate-900">{filteredData.length}</span> of {data.length} complaints
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Complaints"
                    value={stats.total}
                    icon={FileText}
                    color="text-slate-600 bg-slate-50"
                />

                {Object.entries(stats.statusDistribution).map(([status, count]) => {
                    let color = 'text-slate-600 bg-slate-50';
                    let icon = AlertCircle;
                    const lowerStatus = status.toLowerCase();

                    if (lowerStatus.includes('open')) { color = 'text-amber-600 bg-amber-50'; icon = AlertCircle; }
                    else if (lowerStatus.includes('close')) { color = 'text-green-600 bg-green-50'; icon = CheckCircle; }
                    else if (lowerStatus.includes('pending')) { color = 'text-blue-600 bg-blue-50'; icon = AlertCircle; }
                    else if (lowerStatus.includes('reject')) { color = 'text-red-600 bg-red-50'; icon = AlertCircle; }
                    else if (lowerStatus.includes('progress')) { color = 'text-indigo-600 bg-indigo-50'; icon = AlertCircle; }

                    return (
                        <StatsCard
                            key={status}
                            title={`${status} Complaints`}
                            value={count}
                            icon={icon}
                            color={color}
                        />
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ZoneChart data={stats.zones} />
                <StatusChart data={stats.statusDistribution} />
            </div>

            {/* Officer & Supervisor Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OfficerChart data={stats.officers} />
                <SupervisorChart data={stats.supervisors} />
            </div>
        </div>
    );
};
