// import React, { useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const from = location.state?.from?.pathname || '/';

//   const handleLogin = async (e) => {
//     if (e) e.preventDefault();
//     setError('');
//     setSubmitting(true);

//     try {
//       await login(email, password);
//       navigate(from, { replace: true });
//     } catch (err) {
//       setError(err.customMessage || err.response?.data?.message || 'Invalid login credentials.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleQuickLogin = (roleEmail) => {
//     setEmail(roleEmail);
//     setPassword('Password123!');
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
//       <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-200">
//         <div className="mb-6 text-center">
//           <h1 className="text-2xl font-bold text-gray-900">Mini ERP + CRM</h1>
//           <p className="text-sm text-gray-600 mt-1">Sign in to access your operations workspace</p>
//         </div>

//         {error && (
//           <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleLogin} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
//             <input
//               type="email"
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
//               placeholder="user@erp.com"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
//             <input
//               type="password"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
//               placeholder="••••••••"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={submitting}
//             className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
//           >
//             {submitting ? 'Authenticating...' : 'Sign In'}
//           </button>
//         </form>

//         <div className="mt-6 border-t border-gray-200 pt-4">
//           <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
//             Quick Test Accounts
//           </p>
//           <div className="grid grid-cols-2 gap-2 text-xs">
//             <button type="button" onClick={() => handleQuickLogin('admin@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
//               <strong>Admin:</strong> admin@erp.com
//             </button>
//             <button type="button" onClick={() => handleQuickLogin('sales@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
//               <strong>Sales:</strong> sales@erp.com
//             </button>
//             <button type="button" onClick={() => handleQuickLogin('warehouse@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
//               <strong>Warehouse:</strong> warehouse@erp.com
//             </button>
//             <button type="button" onClick={() => handleQuickLogin('accounts@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
//               <strong>Accounts:</strong> accounts@erp.com
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.customMessage || 'Invalid email or password credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 text-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-indigo-600/30">
            🛡️
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Unified Business Platform</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Mini ERP + CRM Portal</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@erp.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {submitting ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* 1-Click Quick Fill Demo Buttons */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
            One-Click Reviewer Logins
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin('admin@erp.com')}
              className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('sales@erp.com')}
              className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('warehouse@erp.com')}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
            >
              Warehouse
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('accounts@erp.com')}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              Accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};