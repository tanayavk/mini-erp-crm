// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../context/AuthContext';

// export const Dashboard = () => {
//   const { user } = useAuth();
//   const [stats, setStats] = useState({
//     customers: 0,
//     products: 0,
//     lowStock: 0,
//     challans: 0,
//   });

//   useEffect(() => {
//     // Mock metric initialiser; can be hooked directly to api.get('/dashboard/stats')
//     setStats({
//       customers: 24,
//       products: 142,
//       lowStock: 5,
//       challans: 88,
//     });
//   }, []);

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name}</h2>
//         <p className="text-sm text-gray-500">Role level active: <span className="font-semibold text-gray-700">{user?.role}</span></p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
//           <p className="text-xs font-semibold text-gray-500 uppercase">Total Customers</p>
//           <p className="text-2xl font-bold text-gray-900 mt-2">{stats.customers}</p>
//         </div>
//         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
//           <p className="text-xs font-semibold text-gray-500 uppercase">Active Products</p>
//           <p className="text-2xl font-bold text-gray-900 mt-2">{stats.products}</p>
//         </div>
//         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-amber-500">
//           <p className="text-xs font-semibold text-amber-600 uppercase">Low Stock Alert</p>
//           <p className="text-2xl font-bold text-amber-700 mt-2">{stats.lowStock}</p>
//         </div>
//         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
//           <p className="text-xs font-semibold text-gray-500 uppercase">Sales Challans</p>
//           <p className="text-2xl font-bold text-gray-900 mt-2">{stats.challans}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    lowStock: 0,
    challans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes, lowStockRes, challanRes] = await Promise.all([
          api.get('/customers', { params: { limit: 1 } }).catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
          api.get('/products', { params: { limit: 1 } }).catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
          api.get('/products', { params: { limit: 1, low_stock: 'true' } }).catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
          api.get('/challans', { params: { limit: 1 } }).catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        ]);

        setStats({
          customers: custRes.data?.data?.pagination?.total ?? 0,
          products: prodRes.data?.data?.pagination?.total ?? 0,
          lowStock: lowStockRes.data?.data?.pagination?.total ?? 0,
          challans: challanRes.data?.data?.pagination?.total ?? 0,
        });
      } catch (err) {
        console.error('Failed to load live dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  const canMutateCustomers = ['Admin', 'Sales'].includes(user?.role);
  const canMutateProducts = ['Admin', 'Warehouse'].includes(user?.role);
  const canMutateChallans = ['Admin', 'Sales'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
            🏢 Unified Business Platform
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name || 'User'}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Active Workspace Role: <span className="text-slate-200 font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <span className="animate-pulse">...</span> : stats.customers}
          </div>
          <p className="text-[11px] text-slate-500">Registered active & lead directory</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Products</span>
            <span className="text-lg">📦</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <span className="animate-pulse">...</span> : stats.products}
          </div>
          <p className="text-[11px] text-slate-500">Active inventory SKUs tracked</p>
        </div>

        <div className={`bg-white p-5 rounded-2xl border shadow-2xs space-y-2 ${stats.lowStock > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alerts</span>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-800">
            {loading ? <span className="animate-pulse">...</span> : stats.lowStock}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">SKUs at or below min alert level</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sales Challans</span>
            <span className="text-lg">📄</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <span className="animate-pulse">...</span> : stats.challans}
          </div>
          <p className="text-[11px] text-slate-500">Draft, confirmed & dispatched logs</p>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/customers')}
            className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
              canMutateCustomers
                ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-900'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div>
              <p className="text-xs font-bold">Manage Customers</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {canMutateCustomers ? 'Add new client or add follow-up' : 'View directory logs (Read-Only)'}
              </p>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate('/products')}
            className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
              canMutateProducts
                ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-900'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div>
              <p className="text-xs font-bold">Inventory & Stock</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {canMutateProducts ? 'Add SKU or adjust IN/OUT stock' : 'View catalog pricing (Read-Only)'}
              </p>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate('/challans')}
            className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
              canMutateChallans
                ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-900'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div>
              <p className="text-xs font-bold">Sales Challans</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {canMutateChallans ? 'Create draft or confirm dispatch' : 'View order snapshots (Read-Only)'}
              </p>
            </div>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};