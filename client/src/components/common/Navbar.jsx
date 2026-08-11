// import React from 'react';
// import { useAuth } from '../../context/AuthContext';

// export const Navbar = () => {
//   const { user, logout } = useAuth();

//   const getRoleBadgeColor = (role) => {
//     switch (role?.toLowerCase()) {
//       case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
//       case 'sales': return 'bg-blue-100 text-blue-800 border-blue-200';
//       case 'warehouse': return 'bg-amber-100 text-amber-800 border-amber-200';
//       case 'accounts': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
//       default: return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   return (
//     <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
//       <div className="flex items-center gap-3">
//         <h1 className="text-xl font-bold text-gray-800">ERP/CRM Operations</h1>
//       </div>
//       <div className="flex items-center gap-4">
//         <div className="text-right">
//           <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
//           <p className="text-xs text-gray-500">{user?.email}</p>
//         </div>
//         <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role)}`}>
//           {user?.role?.toUpperCase()}
//         </span>
//         <button
//           onClick={logout}
//           className="ml-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
//         >
//           Logout
//         </button>
//       </div>
//     </header>
//   );
// };

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'sales':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'warehouse':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'accounts':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : 'UB';
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            🏢
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-base">Unified Business Platform</span>
        </div>
        <span className="hidden md:inline-block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Unified Business Platform
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-900 text-slate-100 flex items-center justify-center font-bold text-xs shadow-xs border border-slate-700">
            {getInitials(user?.name, user?.email)}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-900">{user?.name || 'Platform Staff'}</p>
            <p className="text-[11px] text-slate-500 font-mono">{user?.email}</p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getRoleBadgeColor(user?.role)}`}>
          {user?.role}
        </span>

        <button
          onClick={logout}
          className="ml-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
        >
          Logout
        </button>
      </div>
    </header>
  );
};