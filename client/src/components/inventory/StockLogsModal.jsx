import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

export const StockLogsModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatIndianDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day}-${month}-${year}, ${time}`;
  };

  const fetchStockLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/products/stock-logs/all', {
        params: { page, limit: pagination.limit }
      });
      const { items, pagination: resPagination } = response.data.data;
      setLogs(items || []);
      setPagination(resPagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch stock audit movement logs.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    if (isOpen) {
      fetchStockLogs(1);
    }
  }, [isOpen, fetchStockLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Stock Movement Audit Logs</h2>
              <p className="text-xs text-gray-500">Real-time trace of inventory IN and OUT operations</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 font-semibold uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Product / SKU</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <p className="mt-2 text-xs">Loading audit records...</p>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        No stock movement logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                          {formatIndianDateTime(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{log.product_name}</div>
                          <div className="text-[10px] text-gray-500">{log.product_sku}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.movement_type === 'IN'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {log.movement_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {log.movement_type === 'IN' ? `+${log.quantity_changed}` : `-${log.quantity_changed}`}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                          {log.reason}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <div>{log.performed_by_email || 'System User'}</div>
                          <div className="text-[10px] uppercase text-gray-400">{log.performed_by_role || 'Staff'}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer / Pagination */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div>
              Page <span className="font-semibold text-gray-800">{pagination.page}</span> of{' '}
              <span className="font-semibold text-gray-800">{pagination.totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchStockLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded border border-gray-300 bg-white px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchStockLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded border border-gray-300 bg-white px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};