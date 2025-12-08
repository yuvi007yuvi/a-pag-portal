import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Upload, Building, Map } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const navItems = [
        { to: '/', icon: Upload, label: 'Upload Data' },
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/sfi-reports', icon: Users, label: 'SFI Reports' },
        { to: '/department-reports', icon: Building, label: 'Dept Reports' },
        { to: '/officer-mapping', icon: Map, label: 'Officer Mapping' },
        { to: '/complaints', icon: ClipboardList, label: 'All Complaints' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-16">
            <nav className="p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};
