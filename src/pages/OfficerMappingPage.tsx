import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { officerMappings } from '../data/officerMappings';

export const OfficerMappingPage: React.FC = () => {
    const { filteredData } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterZone, setFilterZone] = useState<string>('All');
    const [filterDept, setFilterDept] = useState<string>('All');

    // Calculate complaint counts for each officer
    const officerCounts: Record<string, number> = {};
    const supervisorCounts: Record<string, number> = {};

    filteredData.forEach(complaint => {
        if (complaint.assignedOfficer) {
            officerCounts[complaint.assignedOfficer] = (officerCounts[complaint.assignedOfficer] || 0) + 1;
        }
        if (complaint.assignedSupervisor) {
            supervisorCounts[complaint.assignedSupervisor] = (supervisorCounts[complaint.assignedSupervisor] || 0) + 1;
        }
    });

    // Get unique zones and departments
    const zones = ['All', ...new Set(officerMappings.map(m => m.zone))];
    const departments = ['All', ...new Set(officerMappings.map(m => m.department))];

    // Filter mappings
    let filteredMappings = officerMappings.filter(mapping => {
        const matchesSearch =
            mapping.officer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.zone.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesZone = filterZone === 'All' || mapping.zone === filterZone;
        const matchesDept = filterDept === 'All' || mapping.department === filterDept;

        return matchesSearch && matchesZone && matchesDept;
    });

    // Calculate summary stats
    const totalOfficers = new Set(officerMappings.map(m => m.officer)).size;
    const totalSupervisors = new Set(officerMappings.map(m => m.supervisor)).size;
    const totalZones = new Set(officerMappings.map(m => m.zone)).size;
    const totalWards = new Set(officerMappings.map(m => m.ward)).size;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Officer & Supervisor Mapping</h2>
                <p className="text-slate-500 mt-1">Complete organizational structure with zone and ward assignments</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-blue-600 text-sm font-medium">Total Officers</p>
                    <p className="text-3xl font-bold text-blue-700">{totalOfficers}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-green-600 text-sm font-medium">Total Supervisors</p>
                    <p className="text-3xl font-bold text-green-700">{totalSupervisors}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-purple-600 text-sm font-medium">Total Zones</p>
                    <p className="text-3xl font-bold text-purple-700">{totalZones}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-amber-600 text-sm font-medium">Total Wards</p>
                    <p className="text-3xl font-bold text-amber-700">{totalWards}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search officer, supervisor, ward..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Zone</label>
                        <select
                            value={filterZone}
                            onChange={(e) => setFilterZone(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {zones.map(zone => (
                                <option key={zone} value={zone}>{zone}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Mapping Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="font-semibold text-slate-800 text-lg">Officer-Ward-Zone Mapping</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Showing {filteredMappings.length} of {officerMappings.length} assignments
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left">Zone</th>
                                <th className="px-4 py-3 text-left">Ward</th>
                                <th className="px-4 py-3 text-left">Department</th>
                                <th className="px-4 py-3 text-left">Supervisor</th>
                                <th className="px-4 py-3 text-center">Sup. Count</th>
                                <th className="px-4 py-3 text-left">Officer (SFI/JE)</th>
                                <th className="px-4 py-3 text-center">Officer Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMappings.map((mapping, index) => (
                                <tr key={index} className={`border-b hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{mapping.zone}</td>
                                    <td className="px-4 py-3 text-slate-600">{mapping.ward}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${mapping.department === 'Sanitation'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                            }`}>
                                            {mapping.department}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-green-700">{mapping.supervisor}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                            {supervisorCounts[mapping.supervisor] || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-blue-700">{mapping.officer}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                            {officerCounts[mapping.officer] || 0}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        Total Assignments: <span className="font-semibold">{filteredMappings.length}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
