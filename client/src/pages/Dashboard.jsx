import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    lowStock: 0,
    challans: 0,
  });

  useEffect(() => {
    // Mock metric initialiser; can be hooked directly to api.get('/dashboard/stats')
    setStats({
      customers: 24,
      products: 142,
      lowStock: 5,
      challans: 88,
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name}</h2>
        <p className="text-sm text-gray-500">Role level active: <span className="font-semibold text-gray-700">{user?.role}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.customers}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Active Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.products}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-amber-600 uppercase">Low Stock Alert</p>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats.lowStock}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Sales Challans</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.challans}</p>
        </div>
      </div>
    </div>
  );
};