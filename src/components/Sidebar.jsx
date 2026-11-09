import React from 'react';
import { LayoutDashboard, Search, Settings, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeModule, onChangeModule }) => {
  const { isStudent, isAdmin } = useAuth();
  
  const navItems = [
    { id: 'issues', label: 'Campus Issues', icon: FileText },
    { id: 'lost-found', label: 'Lost & Found', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: LayoutDashboard, adminOnly: true },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Navigation</h2>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeModule(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
};
