import React from 'react';
import { useData } from '../context/DataContext';

export const ComplaintsPage: React.FC = () => {
    const { filteredData, stats } = useData();

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 text-lg">No data available. Please upload a complaint file first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">All Complaints</h2>
                <span className="text-sm text-slate-500">Total: {filteredData.length} complaints</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">Sr No</th>
                                <th className="px-6 py-3">Zone</th>
                                <th className="px-6 py-3">Ward</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Officer</th>
                                <th className="px-6 py-3">Supervisor</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row, index) => (
                                <tr key={index} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{row['Sr No']}</td>
                                    <td className="px-6 py-4">{row['Zone']}</td>
                                    <td className="px-6 py-4">{row['Ward']}</td>
                                    <td className="px-6 py-4">{row['Complainttype']}</td>
                                    <td className="px-6 py-4 text-blue-600 font-medium">{row.assignedOfficer || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600">{row.assignedSupervisor || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 text-xs">{row['Complaint Registered Date']}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row['Status']?.toLowerCase().includes('open')
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                            {row['Status']}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
