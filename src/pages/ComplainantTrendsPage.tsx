import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ReportHeader } from '../components/ReportHeader';
import { ALLOWED_COMPLAINANT_NAMES } from '../data/officerMappings';
import { Download, Calendar, Filter } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';

export const ComplainantTrendsPage: React.FC = () => {
    const { data, filteredData, dateFrom, dateTo, setDateFrom, setDateTo, applyDateFilter } = useData();

    // Compute available months from the FULL dataset (not just filtered)
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        data.forEach(record => {
            const dateStr = record['Complaint Registered Date'];
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                months.add(monthKey);
            }
        });
        // Sort chronologically
        return Array.from(months).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [data]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedMonth = e.target.value;
        if (!selectedMonth) return;

        if (selectedMonth === 'all') {
            setDateFrom('');
            setDateTo('');
            setTimeout(applyDateFilter, 0); // Apply after state update
            return;
        }

        const date = new Date(selectedMonth); // e.g., "May 2024"
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Format as YYYY-MM-DD for input type="date"
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        setDateFrom(formatDate(firstDay));
        setDateTo(formatDate(lastDay));

        // Trigger filter application
        setTimeout(applyDateFilter, 100);
    };

    const trendsData = useMemo(() => {
        // Initialize structure for allowed complainants
        const data: Record<string, { total: number; monthly: Record<string, number>; daily: Record<string, number> }> = {};

        ALLOWED_COMPLAINANT_NAMES.forEach(name => {
            data[name] = { total: 0, monthly: {}, daily: {} };
        });

        filteredData.forEach(accord => {
            const name = accord['Name']?.trim();
            if (!name) return;

            // Check if name matches (case-insensitive)
            const matchedName = ALLOWED_COMPLAINANT_NAMES.find(allowed => allowed.toLowerCase() === name.toLowerCase());

            if (matchedName) {
                const dateStr = accord['Complaint Registered Date'];
                const date = new Date(dateStr);

                if (!isNaN(date.getTime())) {
                    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g., "May 2024"
                    const dateKey = date.toLocaleDateString('en-GB'); // DD/MM/YYYY

                    data[matchedName].total++;
                    data[matchedName].monthly[monthKey] = (data[matchedName].monthly[monthKey] || 0) + 1;
                    data[matchedName].daily[dateKey] = (data[matchedName].daily[dateKey] || 0) + 1;
                }
            }
        });

        return data;
    }, [filteredData]);

    const allMonths = useMemo(() => {
        const months = new Set<string>();
        Object.values(trendsData).forEach(stats => {
            Object.keys(stats.monthly).forEach(m => months.add(m));
        });
        return Array.from(months).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [trendsData]);

    const handleExport = () => {
        const exportData = ALLOWED_COMPLAINANT_NAMES.map((name, index) => {
            const stats = trendsData[name];
            const row: any = {
                'Sr. No': index + 1,
                'Complainant Name': name,
                'Total Complaints': stats.total,
            };
            allMonths.forEach(month => {
                row[month] = stats.monthly[month] || 0;
            });
            return row;
        });
        exportToExcel(exportData, 'Complainant_Trends_Report');
    };

    return (
        <div className="space-y-6">

            {/* Filter Controls */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-end">
                <div className="flex items-center gap-2 mb-1 text-slate-700 font-semibold w-full border-b border-slate-100 pb-2">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <span>Filter Data</span>
                </div>

                {/* Month Selector */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Select Month (Quick Filter)</label>
                    <div className="relative">
                        <select
                            onChange={handleMonthChange}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none"
                            defaultValue=""
                        >
                            <option value="" disabled>Choose a month...</option>
                            <option value="all" className="font-semibold text-blue-600">Show All Dates</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                        <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Date From */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">From Date</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">To Date</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                </div>

                {/* Apply Button */}
                <div>
                    <button
                        onClick={applyDateFilter}
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none transition-colors shadow-sm"
                    >
                        Apply Filter
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <ReportHeader title="Complainant Trends Report" dateFrom={dateFrom} dateTo={dateTo} />
                <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Sr. No</th>
                                <th className="px-6 py-4">Complainant Name</th>
                                <th className="px-6 py-4 text-center bg-blue-50/50">Total Complaints</th>
                                {allMonths.map(month => (
                                    <th key={month} className="px-6 py-4 text-center">{month}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {ALLOWED_COMPLAINANT_NAMES.map((name, index) => {
                                const stats = trendsData[name];
                                const hasData = stats.total > 0;

                                return (
                                    <tr key={name} className={`hover:bg-slate-50 transition-colors ${!hasData ? 'opacity-60 bg-slate-50/30' : ''}`}>
                                        <td className="px-6 py-4 font-medium text-slate-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">{name}</td>
                                        <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30">{stats.total}</td>
                                        {allMonths.map(month => (
                                            <td key={month} className="px-6 py-4 text-center text-slate-600">
                                                {stats.monthly[month] > 0 ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-medium text-xs">
                                                        {stats.monthly[month]}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 text-sm">
                <p className="font-medium">Note:</p>
                <p>This report only includes data for the {ALLOWED_COMPLAINANT_NAMES.length} monitored complainants and filtered complaint types.</p>
            </div>
        </div>
    );
};
