import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CustomerModal } from '../components/crm/CustomerModal';
import { CustomerDetailDrawer } from '../components/crm/CustomerDetailDrawer';

export const Customers = () => {
  const { user } = useAuth();
  
  // Data state
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search Toolbar State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal / Drawer Control State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState(null);
  
  const [selectedCustomerIdForDrawer, setSelectedCustomerIdForDrawer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const canMutate = ['Admin', 'Sales'].includes(user?.role);

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      };

      const response = await api.get('/customers', { params });
      const { items, pagination: resPagination } = response.data.data;
      
      setCustomers(items || []);
      setPagination(resPagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch customer directory.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter, fetchCustomers]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCustomers(newPage);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedCustomerForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer, e) => {
    e.stopPropagation();
    setSelectedCustomerForEdit(customer);
    setIsModalOpen(true);
  };

  const handleRowClick = (id) => {
    setSelectedCustomerIdForDrawer(id);
    setIsDrawerOpen(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Lead': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer CRM</h2>
          <p className="text-sm text-gray-500">Manage client accounts, business details, and follow-up history</p>
        </div>
        {canMutate ? (
          <button
            onClick={handleOpenAddModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + Add Customer
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200">
            Read-Only Access ({user?.role})
          </span>
        )}
      </div>

      {/* Toolbar: Search and Filter Controls */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or business name..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
            <option value="Lead">Lead</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-sm text-red-700 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Customer / Business</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading customer directory...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 text-xs">
                    No customer records matched your query filters.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => handleRowClick(cust.id)}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{cust.business_name}</div>
                      <div className="text-xs text-gray-500">{cust.name}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div>{cust.email}</div>
                      <div className="text-gray-500">{cust.mobile}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-700">
                      {cust.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(cust.status)}`}>
                        {cust.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRowClick(cust.id)}
                          className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 transition"
                        >
                          View Profile
                        </button>
                        {canMutate && (
                          <button
                            onClick={(e) => handleOpenEditModal(cust, e)}
                            className="rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-700 font-medium hover:bg-blue-100 transition"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 text-xs text-gray-500 bg-gray-50">
          <div>
            Showing Page <span className="font-semibold text-gray-800">{pagination.page}</span> of{' '}
            <span className="font-semibold text-gray-800">{pagination.totalPages}</span> ({pagination.total} total customers)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded border border-gray-300 bg-white px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded border border-gray-300 bg-white px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={selectedCustomerForEdit}
        onSuccess={() => fetchCustomers(pagination.page)}
      />

      <CustomerDetailDrawer
        customerId={selectedCustomerIdForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCustomerUpdate={() => fetchCustomers(pagination.page)}
      />
    </div>
  );
};