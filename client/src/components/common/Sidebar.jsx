import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { label: 'Customers', path: '/customers', roles: ['Admin', 'Sales', 'Accounts'], readOnlyFor: ['Warehouse'] },
    { label: 'Products & Stock', path: '/products', roles: ['Admin', 'Sales', 'Warehouse'], readOnlyFor: ['Accounts'] },
    { label: 'Sales Challans', path: '/challans', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'], readOnlyFor: [] },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-900 text-gray-300 flex flex-col justify-between">
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
          Main Menu
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isReadOnly = item.readOnlyFor?.map(r => r.toLowerCase()).includes(user?.role?.toLowerCase());

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                  }`
                }
              >
                <span>{item.label}</span>
                {isReadOnly && (
                  <span className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded">
                    Read-Only
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        System Status: <span className="text-emerald-400 font-semibold">Online</span>
      </div>
    </aside>
  );
};