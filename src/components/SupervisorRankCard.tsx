import React from 'react';
import { Trophy, TrendingDown, Medal } from 'lucide-react';

interface SupervisorRankProps {
    title: string;
    supervisors: Array<{
        name: string;
        total: number;
        closed: number;
        closureRate: number;
    }>;
    type: 'top' | 'bottom';
}

export const SupervisorRankCard: React.FC<SupervisorRankProps> = ({ title, supervisors, type }) => {
    const isTop = type === 'top';
    const Icon = isTop ? Trophy : TrendingDown;
    const headerColor = isTop ? 'text-amber-600' : 'text-red-600';
    const bgColor = isTop ? 'bg-amber-50' : 'bg-red-50';

    const getRankIcon = (index: number) => {
        if (!isTop) return <span className="text-slate-500 w-6 text-center font-bold">#{index + 1}</span>;

        switch (index) {
            case 0: return <Medal className="w-6 h-6 text-yellow-500 fill-current" />;
            case 1: return <Medal className="w-6 h-6 text-slate-400 fill-current" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700 fill-current" />;
            default: return <span className="text-slate-500 w-6 text-center font-bold">#{index + 1}</span>;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
            <div className={`p-4 border-b border-slate-200 ${bgColor} flex items-center gap-2`}>
                <Icon className={`w-5 h-5 ${headerColor}`} />
                <h3 className={`font-semibold ${headerColor}`}>{title}</h3>
            </div>
            <div className="p-4">
                {supervisors.length > 0 ? (
                    <div className="space-y-4">
                        {supervisors.map((sup, index) => (
                            <div key={sup.name} className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    {getRankIcon(index)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium text-slate-800 truncate" title={sup.name}>
                                            {sup.name}
                                        </p>
                                        <span className={`text-sm font-bold ${isTop ? 'text-green-600' : 'text-red-500'}`}>
                                            {sup.closureRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isTop ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                                            style={{ width: `${sup.closureRate}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {sup.closed} closed / {sup.total} total
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
};
