// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

// export const Sidebar = () => {
//   const { user } = useAuth();

//   const navItems = [
//     { label: 'Dashboard', path: '/', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
//     { label: 'Customers', path: '/customers', roles: ['Admin', 'Sales', 'Accounts'], readOnlyFor: ['Warehouse'] },
//     { label: 'Products & Stock', path: '/products', roles: ['Admin', 'Sales', 'Warehouse'], readOnlyFor: ['Sales','Accounts'] },
//     { label: 'Sales Challans', path: '/challans', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'], readOnlyFor: [] },
//   ];

//   return (
//     <aside className="w-64 border-r border-gray-200 bg-gray-900 text-gray-300 flex flex-col justify-between">
//       <div className="p-4">
//         <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
//           Main Menu
//         </div>
//         <nav className="space-y-1">
//           {navItems.map((item) => {
//             const isReadOnly = item.readOnlyFor?.map(r => r.toLowerCase()).includes(user?.role?.toLowerCase());

//             return (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 className={({ isActive }) =>
//                   `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
//                     isActive
//                       ? 'bg-blue-600 text-white'
//                       : 'hover:bg-gray-800 text-gray-300 hover:text-white'
//                   }`
//                 }
//               >
//                 <span>{item.label}</span>
//                 {isReadOnly && (
//                   <span className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded">
//                     Read-Only
//                   </span>
//                 )}
//               </NavLink>
//             );
//           })}
//         </nav>
//       </div>
//       <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
//         System Status: <span className="text-emerald-400 font-semibold">Online</span>
//       </div>
//     </aside>
//   );
// };

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'], readOnlyFor: [] },
    { label: 'Customers', path: '/customers', roles: ['Admin', 'Sales', 'Accounts'], readOnlyFor: ['Warehouse'] },
    { label: 'Products & Stock', path: '/products', roles: ['Admin', 'Sales', 'Warehouse'], readOnlyFor: ['Sales', 'Accounts'] },
    { label: 'Sales Challans', path: '/challans', roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'], readOnlyFor: [] },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4">
        {/* Brand Identity Header */}
        <div className="flex items-center gap-3 px-3 py-2 mb-6 border-b border-slate-800 pb-5">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-600/30">
            🛡️
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
              Aegis<span className="text-indigo-400">ERP</span>
            </h1>
            <p className="text-[10px] font-medium text-slate-400">Operations Portal v3.0</p>
          </div>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">
          Core Modules
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isReadOnly = item.readOnlyFor?.map((r) => r.toLowerCase()).includes(user?.role?.toLowerCase());

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-100'
                  }`
                }
              >
                <span>{item.label}</span>
                {isReadOnly && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                    Read-Only
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>System Status</span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Online
        </span>
      </div>
    </aside>
  );
};