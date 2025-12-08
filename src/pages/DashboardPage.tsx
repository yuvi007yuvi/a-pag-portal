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
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>

            {/* Date Range Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-slate-700">Date Range:</span>
                        <span className="text-sm text-slate-500">
                            {minDate} to {maxDate}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">From:</label>
                            <input
                                type="date"
                                value={dateFrom}
                                min={minDate}
                                max={maxDate}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">To:</label>
                            <input
                                type="date"
                                value={dateTo}
                                min={minDate}
                                max={maxDate}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={applyDateFilter}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Apply Filter
                        </button>
                        {filteredData.length !== data.length && (
                            <span className="text-sm text-slate-600">
                                Showing {filteredData.length} of {data.length} complaints
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Complaints"
                    value={stats.total}
                    icon={FileText}
                    color="text-blue-600 bg-blue-50"
                />
                <StatsCard
                    title="Open Complaints"
                    value={stats.open}
                    icon={AlertCircle}
                    color="text-amber-600 bg-amber-50"
                />
                <StatsCard
                    title="Closed Complaints"
                    value={stats.closed}
                    icon={CheckCircle}
                    color="text-green-600 bg-green-50"
                />
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
