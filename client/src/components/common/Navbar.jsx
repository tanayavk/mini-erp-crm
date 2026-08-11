import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sales': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warehouse': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accounts': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800">ERP/CRM Operations</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role)}`}>
          {user?.role?.toUpperCase()}
        </span>
        <button
          onClick={logout}
          className="ml-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};