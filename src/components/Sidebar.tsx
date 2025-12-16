import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, ClipboardList, Upload, Building, Map, FileText, TrendingUp, Activity, Trash2 } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const navItems = [
        { to: '/', icon: Upload, label: 'Upload Data' },
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/sfi-reports', icon: Users, label: 'SFI Reports' },
        { to: '/supervisor-reports', icon: UserCheck, label: 'Supervisor Reports' },
        { to: '/department-reports', icon: Building, label: 'Dept Reports' },
        { to: '/officer-mapping', icon: Map, label: 'Officer Mapping' },
        { to: '/officer-reports', icon: FileText, label: 'Officer Reports' },
        { to: '/complaints', icon: ClipboardList, label: 'All Complaints' },
        { to: '/complainant-trends', icon: TrendingUp, label: 'Complainant Trends' },
        { to: '/subtype-trends', icon: Activity, label: 'Subtype Trends' },
        { to: '/cnd-reports', icon: Trash2, label: 'C&D Reports' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-16 z-0 shadow-sm">
            <nav className="p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 translate-x-1'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:translate-x-1'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-500'}`} />
                                <span className="font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};
