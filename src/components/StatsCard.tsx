import React from 'react';
import { Calendar, type LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    color: string;
    dateRange?: string;
    onFilterChange?: (start: string, end: string) => void;
    startDate?: string;
    endDate?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, dateRange, onFilterChange, startDate, endDate }) => {
    const [showFilters, setShowFilters] = React.useState(false);

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
            <div className="flex items-center space-x-4 mb-2">
                <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value.toLocaleString()}</h3>
                </div>
                {onFilterChange && (
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors absolute top-4 right-4"
                        title="Filter Date Range"
                    >
                        <Calendar className="w-4 h-4" />
                    </button>
                )}
            </div>

            {dateRange && !showFilters && (
                <div className="ml-[60px]">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        {dateRange}
                    </p>
                </div>
            )}

            {showFilters && onFilterChange && (
                <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-bold text-slate-500">Filter</label>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => onFilterChange?.('', '')}
                                    className="text-[10px] font-medium text-blue-600 hover:text-blue-800"
                                >
                                    Reset
                                </button>
                                <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="text-xs">Close</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">From</label>
                                <input
                                    type="date"
                                    className="w-full text-xs border border-slate-200 rounded px-1 py-1 text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={startDate || ''}
                                    onChange={(e) => onFilterChange(e.target.value, endDate || '')}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">To</label>
                                <input
                                    type="date"
                                    className="w-full text-xs border border-slate-200 rounded px-1 py-1 text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={endDate || ''}
                                    onChange={(e) => onFilterChange(startDate || '', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
