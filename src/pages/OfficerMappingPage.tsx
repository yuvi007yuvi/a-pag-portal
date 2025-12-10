import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { officerMappings } from '../data/officerMappings';
import { Users } from 'lucide-react';
import { ReportHeader } from '../components/ReportHeader';
import { ExportMenu } from '../components/ExportMenu';
import { exportToJPEG, exportToPDF, exportToExcel } from '../utils/exportUtils';

export const OfficerMappingPage: React.FC = () => {
    const { dateFrom, dateTo } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterZone, setFilterZone] = useState<string>('All');
    const [filterDept, setFilterDept] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'officer' | 'supervisor'>('officer');

    // Get unique zones and departments
    const zones = ['All', ...new Set(officerMappings.map(m => m.zone))];
    const departments = ['All', ...new Set(officerMappings.map(m => m.department))];

    // Filter mappings
    const filteredMappings = officerMappings.filter(mapping => {
        const matchesSearch =
            mapping.officer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.zone.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesZone = filterZone === 'All' || mapping.zone === filterZone;
        const matchesDept = filterDept === 'All' || mapping.department === filterDept;

        return matchesSearch && matchesZone && matchesDept;
    });

    // Group mappings Logic
    interface GroupedMapping {
        primaryKey: string; // Officer Name or Supervisor Name
        department: string;
        zones: string[];
        wards: string[];
        secondaryList: string[]; // Supervisors list (for Officer view) or Officers list (for Supervisor view)
    }

    const groupedMappings: GroupedMapping[] = Object.values(filteredMappings.reduce((acc, mapping) => {
        const isOfficerMode = viewMode === 'officer';
        const primary = isOfficerMode ? mapping.officer : mapping.supervisor;
        const secondary = isOfficerMode ? mapping.supervisor : mapping.officer;

        // Key needs to be unique per row - Aggregating by Primary (Officer/Sup) + Dept
        // We do NOT include zone in the key, so we can aggregate zones
        const key = `${primary}-${mapping.department}`;

        if (!acc[key]) {
            acc[key] = {
                primaryKey: primary,
                department: mapping.department,
                zones: [],
                wards: [],
                secondaryList: []
            };
        }

        if (!acc[key].zones.includes(mapping.zone)) {
            acc[key].zones.push(mapping.zone);
        }

        if (!acc[key].wards.includes(mapping.ward)) {
            acc[key].wards.push(mapping.ward);
        }

        if (!acc[key].secondaryList.includes(secondary)) {
            acc[key].secondaryList.push(secondary);
        }
        return acc;
    }, {} as Record<string, GroupedMapping>));

    // Calculate summary stats
    const totalOfficers = new Set(officerMappings.map(m => m.officer)).size;
    const totalSupervisors = new Set(officerMappings.map(m => m.supervisor)).size;
    const totalZones = new Set(officerMappings.map(m => m.zone)).size;
    const totalWards = new Set(officerMappings.map(m => m.ward)).size;

    const handleExportExcel = () => {
        const dataToExport = groupedMappings.map((m, index) => ({
            'Sr No': index + 1,
            'Zones': m.zones.join(', '),
            'Department': m.department,
            [viewMode === 'officer' ? 'Officer (SFI/JE)' : 'Supervisor']: m.primaryKey,
            'Total Wards': m.wards.length,
            'Wards': m.wards.join(', '),
            [viewMode === 'officer' ? 'Supervisors' : 'Officer (SFI/JE)']: m.secondaryList.join(', ')
        }));
        exportToExcel(dataToExport, `${viewMode === 'officer' ? 'Officer' : 'Supervisor'}_Mapping_Report_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Control Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-600" />
                        {viewMode === 'officer' ? 'Officer Mapping' : 'Supervisor Mapping'}
                    </h2>

                    {/* View Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('officer')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'officer'
                                    ? 'bg-white text-purple-600 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Officer View
                        </button>
                        <button
                            onClick={() => setViewMode('supervisor')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'supervisor'
                                    ? 'bg-white text-purple-600 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Supervisor View
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <ExportMenu
                        onExportJPEG={() => exportToJPEG('mapping-report-content', `${viewMode}_Mapping_Report`)}
                        onExportPDF={() => exportToPDF('mapping-report-content', `${viewMode}_Mapping_Report`)}
                        onExportExcel={handleExportExcel}
                    />
                </div>
            </div>

            {/* Filters - OUTSIDE export */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Search</label>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Zone</label>
                        <select
                            value={filterZone}
                            onChange={(e) => setFilterZone(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        >
                            {zones.map(zone => (
                                <option key={zone} value={zone}>{zone}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Department</label>
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Export Wrapper */}
            <div id="mapping-report-content" className="bg-white p-6 sm:p-8 min-h-screen">
                <ReportHeader
                    title={`${viewMode === 'officer' ? 'Officer' : 'Supervisor'} & Mapping Report`}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <p className="text-blue-600 text-sm font-bold uppercase tracking-wide">Total Officers</p>
                        <p className="text-3xl font-bold text-blue-700 mt-1">{totalOfficers}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <p className="text-green-600 text-sm font-bold uppercase tracking-wide">Total Supervisors</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">{totalSupervisors}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <p className="text-purple-600 text-sm font-bold uppercase tracking-wide">Total Zones</p>
                        <p className="text-3xl font-bold text-purple-700 mt-1">{totalZones}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <p className="text-amber-600 text-sm font-bold uppercase tracking-wide">Total Wards</p>
                        <p className="text-3xl font-bold text-amber-700 mt-1">{totalWards}</p>
                    </div>
                </div>

                {/* Mapping Table */}
                <div className="overflow-hidden border border-slate-300">
                    <div className="px-6 py-4 border-b border-slate-300 bg-slate-50">
                        <h3 className="font-semibold text-slate-800 text-lg uppercase">
                            {viewMode === 'officer' ? 'Officer Wise Assignments' : 'Supervisor Wise Assignments'}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-slate-300 relative">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="border border-slate-300 px-2 py-1 text-center font-semibold text-slate-700 w-16 bg-slate-100">Sr. No</th>
                                    <th className="border border-slate-300 px-2 py-1 text-left font-semibold text-slate-700 bg-slate-100 w-32">Zones</th>
                                    <th className="border border-slate-300 px-2 py-1 text-center font-semibold text-slate-700 w-24 bg-slate-100">Department</th>
                                    <th className="border border-slate-300 px-2 py-1 text-left font-semibold text-slate-700 bg-slate-100 w-48">
                                        {viewMode === 'officer' ? 'Officer (SFI/JE)' : 'Supervisor'}
                                    </th>
                                    <th className="border border-slate-300 px-2 py-1 text-left font-semibold text-slate-700 bg-slate-100">Wards</th>
                                    <th className="border border-slate-300 px-2 py-1 text-center font-semibold text-slate-700 w-24 bg-slate-100">Total Wards</th>
                                    <th className="border border-slate-300 px-2 py-1 text-left font-semibold text-slate-700 bg-slate-100 w-48">
                                        {viewMode === 'officer' ? 'Supervisors' : 'Officer (SFI/JE)'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedMappings.map((mapping, index) => (
                                    <tr key={index} className="hover:bg-blue-50 even:bg-slate-50/50 transition-colors">
                                        <td className="border border-slate-300 px-2 py-1 text-center text-slate-600 align-top">{index + 1}</td>
                                        <td className="border border-slate-300 px-2 py-1 font-medium text-slate-900 align-top">
                                            <div className="flex flex-wrap gap-1">
                                                {mapping.zones.map(z => (
                                                    <span key={z} className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs border border-purple-200">
                                                        {z}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={`border border-slate-300 px-2 py-1 text-center font-medium align-top ${mapping.department === 'Sanitation' ? 'text-blue-700 bg-blue-50' : 'text-green-700 bg-green-50'
                                            }`}>
                                            {mapping.department}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 font-medium text-blue-700 bg-blue-50/50 align-top">{mapping.primaryKey}</td>
                                        <td className="border border-slate-300 px-2 py-1 text-slate-600">
                                            <div className="flex flex-wrap gap-1">
                                                {mapping.wards.map(ward => (
                                                    <span key={ward} className="bg-slate-100 px-1.5 py-0.5 rounded text-xs border border-slate-200 break-words">
                                                        {ward}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-800 bg-slate-50 align-top">
                                            {mapping.wards.length}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-1 text-slate-600 align-top">
                                            <div className="flex flex-wrap gap-1">
                                                {mapping.secondaryList.map(item => (
                                                    <span key={item} className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs border border-green-200">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                    <p>© 2025 A-PAG Portal • Data Mappings Report</p>
                </div>
            </div>
        </div>
    );
};
