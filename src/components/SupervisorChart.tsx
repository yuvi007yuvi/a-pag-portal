import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SupervisorChartProps {
    data: Record<string, number>;
}

export const SupervisorChart: React.FC<SupervisorChartProps> = ({ data }) => {
    // Get top 10 supervisors by complaint count
    const chartData = Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow h-[400px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Top 10 Supervisors by Complaints</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 11 }}
                        interval={0}
                    />
                    <YAxis />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
