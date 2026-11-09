import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenReportModal }) => {
  const { user, logout, isStudent } = useAuth();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Zone 1: Breadcrumbs (simplified) */}
      <nav className="text-sm text-slate-500 font-medium whitespace-nowrap shrink-0">
        CampusFix <span className="text-slate-300">/</span> Dashboard
      </nav>

      {/* Zone 2: Empty for now (per contract) */}
      <div className="flex-1" />

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-4 shrink-0">
        {user && isStudent && onOpenReportModal && (
          <button 
            onClick={onOpenReportModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Report Issue
          </button>
        )}
        {user && (
          <button 
            onClick={logout}
            className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
};
