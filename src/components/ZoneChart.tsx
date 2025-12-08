import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ZoneChartProps {
    data: Record<string, number>;
}

export const ZoneChart: React.FC<ZoneChartProps> = ({ data }) => {
    const chartData = Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow h-[400px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Complaints by Zone</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
