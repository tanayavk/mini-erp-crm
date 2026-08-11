import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreateChallanModal } from '../components/challan/CreateChallanModal';
import { ChallanDetailModal } from '../components/challan/ChallanDetailModal';

export const Challans = () => {
  const { user } = useAuth();

  // Directory state
  const [challans, setChallans] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallanIdForDetail, setSelectedChallanIdForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const canMutate = ['Admin', 'Sales'].includes(user?.role);

  const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const formatIndianDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchChallans = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      };

      const response = await api.get('/challans', { params });
      const { items, pagination: resPagination } = response.data.data;

      setChallans(items || []);
      setPagination(resPagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch sales challan records.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChallans(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchChallans]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchChallans(newPage);
    }
  };

  const handleRowClick = (id) => {
    setSelectedChallanIdForDetail(id);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Draft':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Challans</h2>
          <p className="text-sm text-gray-500">Dispatch notes, item snapshot registers, and stock allocation status</p>
        </div>
        {canMutate ? (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + Create New Challan
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200">
            Read-Only Access ({user?.role})
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by challan number or customer name..."
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
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-sm text-red-700 border-b border-red-200 font-medium">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Challan #</th>
                <th className="px-6 py-3">Customer Account</th>
                <th className="px-6 py-3">Total Qty</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading sales challans...</p>
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 text-xs">
                    No sales challans matched your query parameters.
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr
                    key={ch.id}
                    onClick={() => handleRowClick(ch.id)}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono">
                      {ch.challan_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{ch.customer_business_name || ch.customer_name}</div>
                      <div className="text-xs text-gray-500">{ch.creator_email || 'Staff'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-800">
                      {ch.total_quantity} Units
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(ch.status)}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatIndianDateTime(ch.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(ch.id)}
                        className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                      >
                        View Snapshot
                      </button>
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
            <span className="font-semibold text-gray-800">{pagination.totalPages}</span> ({pagination.total} total challans)
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

      {/* Modals */}
      <CreateChallanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchChallans(pagination.page)}
      />

      <ChallanDetailModal
        challanId={selectedChallanIdForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSuccess={() => fetchChallans(pagination.page)}
      />
    </div>
  );
};