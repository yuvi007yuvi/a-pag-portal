import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import type { Stats } from '../utils/dataProcessor';

interface PendingAnalysisChartProps {
    stats: Stats;
}

export const PendingAnalysisChart: React.FC<PendingAnalysisChartProps> = ({ stats }) => {
    const [view, setView] = useState<'zone' | 'age'>('zone');

    // Data for Pending by Zone
    const zoneData = Object.entries(stats.pendingByZone)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Data for Pending by Age
    const ageData = [
        { name: '< 24 Hours', value: stats.pendingByAge.lessThan24h, color: '#4ade80' },
        { name: '1-3 Days', value: stats.pendingByAge.oneToThreeDays, color: '#facc15' },
        { name: '3-7 Days', value: stats.pendingByAge.threeToSevenDays, color: '#fb923c' },
        { name: '> 7 Days', value: stats.pendingByAge.moreThanSevenDays, color: '#f87171' },
    ].filter(item => item.value > 0);



    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Pending Complaints Analysis</h3>
                    <p className="text-sm text-slate-500">Breakdown of open and re-opened complaints</p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setView('zone')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'zone'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        By Zone
                    </button>
                    <button
                        onClick={() => setView('age')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'age'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Aging
                    </button>
                </div>
            </div>

            <div className="h-[350px]">
                {view === 'zone' ? (
                    zoneData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zoneData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {zoneData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#f87171" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            No pending complaints found
                        </div>
                    )
                ) : (
                    ageData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            No data for aging analysis
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
