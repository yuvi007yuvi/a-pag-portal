import React from 'react';
import { useData } from '../context/DataContext';
import { StatsCard } from '../components/StatsCard';
import { ZoneChart } from '../components/ZoneChart';
import { StatusChart } from '../components/StatusChart';
import { OfficerChart } from '../components/OfficerChart';
import { SupervisorChart } from '../components/SupervisorChart';
import { PendingAnalysisChart } from '../components/PendingAnalysisChart';
import { SupervisorRankCard } from '../components/SupervisorRankCard';
import { CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
import { calculateStats } from '../utils/dataProcessor';
import { getDepartmentFromComplaintType, officerMappings } from '../data/officerMappings';
import { normalizeSupervisorName } from '../utils/dataProcessor';

export const DashboardPage: React.FC = () => {
    const { stats, filteredData, data, dateFrom, dateTo, minDate, maxDate, setDateFrom, setDateTo, setStats, setFilteredData } = useData();
    const [selectedDepartment, setSelectedDepartment] = React.useState<'All' | 'Sanitation' | 'Civil' | 'C&D Waste'>('All');

    const applyFilters = () => {
        let filtered = [...data];

        // 1. Filter by Department
        if (selectedDepartment !== 'All') {
            filtered = filtered.filter(record =>
                getDepartmentFromComplaintType(record.complaintsubtype) === selectedDepartment
            );
        }

        // 2. Filter by Date
        if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);

            filtered = filtered.filter(record => {
                const complaintDate = new Date(record['Complaint Registered Date']);
                return complaintDate >= fromDate && complaintDate <= toDate;
            });
        }

        setFilteredData(filtered);
        setStats(calculateStats(filtered));
    };

    // Auto-apply filters when department changes
    React.useEffect(() => {
        applyFilters();
    }, [selectedDepartment]);

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    // Process Supervisor Ranks by Department
    const allSupervisors = stats.supervisorPerformance || [];

    // Create map for supervisor department lookup
    const supervisorDeptMap = React.useMemo(() => {
        const map = new Map<string, string>();
        officerMappings.forEach(m => {
            map.set(normalizeSupervisorName(m.supervisor), m.department);
        });
        return map;
    }, []);

    const getSupervisorsByDept = (dept: 'Sanitation' | 'Civil' | 'C&D Waste') => {
        return allSupervisors.filter(s => {
            // Check direct mapping
            let d = supervisorDeptMap.get(normalizeSupervisorName(s.name));
            // If strictly filtered by department in filteredData, we might assume they belong,
            // but relying on mapping is safer.
            // If unknown, fallback?
            return d === dept;
        });
    };

    const sanitationSupervisors = getSupervisorsByDept('Sanitation');
    const civilSupervisors = getSupervisorsByDept('Civil');
    const cndSupervisors = getSupervisorsByDept('C&D Waste');

    const getTopBottom = (list: typeof allSupervisors) => {
        const sorted = [...list].sort((a, b) => b.closureRate - a.closureRate);
        const top = sorted.slice(0, 5);
        const bottom = [...list]
            .filter(s => s.total > 0)
            .sort((a, b) => a.closureRate - b.closureRate)
            .slice(0, 5);
        return { top, bottom };
    };

    const sanStats = getTopBottom(sanitationSupervisors);
    const civilStats = getTopBottom(civilSupervisors);
    const cndStats = getTopBottom(cndSupervisors);

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

                        <div className="flex items-center gap-3 border-l border-slate-100 pl-6 ml-2">
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-slate-500 mb-1 ml-1">Department</label>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg h-[38px]">
                                    {(['All', 'Sanitation', 'Civil', 'C&D Waste'] as const).map((dept) => (
                                        <button
                                            key={dept}
                                            onClick={() => setSelectedDepartment(dept)}
                                            className={`px-3 text-xs font-medium rounded-md transition-all ${selectedDepartment === dept
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={applyFilters}
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

            {/* Supervisor Rankings */}
            {/* Supervisor Rankings */}
            {(selectedDepartment === 'All' || selectedDepartment === 'Sanitation') && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-500 pl-3">
                            Sanitation Department Rankings
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <SupervisorRankCard
                            title="Top 5 Sanitation Supervisors"
                            supervisors={sanStats.top}
                            type="top"
                        />
                        <SupervisorRankCard
                            title="Bottom 5 Sanitation Supervisors"
                            supervisors={sanStats.bottom}
                            type="bottom"
                        />
                    </div>
                </>
            )}

            {(selectedDepartment === 'All' || selectedDepartment === 'Civil') && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">
                            Civil Department Rankings
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SupervisorRankCard
                            title="Top 5 Civil Supervisors"
                            supervisors={civilStats.top}
                            type="top"
                        />
                        <SupervisorRankCard
                            title="Bottom 5 Civil Supervisors"
                            supervisors={civilStats.bottom}
                            type="bottom"
                        />
                    </div>
                </>
            )}

            {(selectedDepartment === 'All' || selectedDepartment === 'C&D Waste') && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-amber-500 pl-3">
                            C&D Waste Department Rankings
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <SupervisorRankCard
                            title="Top 5 C&D Waste Supervisors"
                            supervisors={cndStats.top}
                            type="top"
                        />
                        <SupervisorRankCard
                            title="Bottom 5 C&D Waste Supervisors"
                            supervisors={cndStats.bottom}
                            type="bottom"
                        />
                    </div>
                </>
            )}

            {/* Pending Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PendingAnalysisChart stats={stats} />
                <div className="hidden lg:block"></div> {/* Spacer if we want it to be half width, or remove to make full width if class changed */}
            </div>

            {/* Officer & Supervisor Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OfficerChart data={stats.officers} />
                <SupervisorChart data={stats.supervisors} />
            </div>
        </div>
    );
};
