import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProductModal } from '../components/inventory/ProductModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { StockLogsModal } from '../components/inventory/StockLogsModal';

export const Products = () => {
  const { user } = useAuth();

  // Catalog Data State
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal / Drawer Controls
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);

  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  const canMutate = ['Admin', 'Warehouse'].includes(user?.role);

  const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(lowStockOnly && { low_stock: 'true' }),
      };

      const response = await api.get('/products', { params });
      const { items, pagination: resPagination } = response.data.data;

      setProducts(items || []);
      setPagination(resPagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch inventory product catalog.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, lowStockOnly, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockOnly, fetchProducts]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProducts(newPage);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedProductForEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setSelectedProductForEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenAdjustModal = (prod) => {
    setSelectedProductForAdjust(prod);
    setIsAdjustModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products & Inventory</h2>
          <p className="text-sm text-gray-500">Track current stock levels, warehouse locations, and stock alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLogsModalOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            Audit Logs
          </button>
          {canMutate ? (
            <button
              onClick={handleOpenAddModal}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              + Add Product
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200">
              Read-Only Access ({user?.role})
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="md:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU code..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Hardware">Hardware</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Packaging">Packaging</option>
            <option value="General Merchandise">General Merchandise</option>
          </select>
        </div>

        <div className="flex items-center justify-end">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
            />
            <span>Low Stock Items Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
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
                <th className="px-6 py-3">Product Name & SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Unit Price</th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3">Warehouse Location</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading product catalog...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 text-xs">
                    No products matched your catalog search parameters.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isLowStock = prod.current_stock <= prod.min_stock_alert;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{prod.name}</div>
                        <div className="text-xs font-mono text-gray-500">{prod.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-700">
                        {prod.category}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-900">
                        {formatINR(prod.unit_price)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {prod.current_stock}
                          </span>
                          <span className="text-[10px] text-gray-400">(Min: {prod.min_stock_alert})</span>
                          {isLowStock && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                              LOW STOCK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {prod.location}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canMutate ? (
                            <>
                              <button
                                onClick={() => handleOpenAdjustModal(prod)}
                                className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-800 font-semibold hover:bg-emerald-100 transition"
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(prod)}
                                className="rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-700 font-semibold hover:bg-blue-100 transition"
                              >
                                Edit
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Read-Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 text-xs text-gray-500 bg-gray-50">
          <div>
            Showing Page <span className="font-semibold text-gray-800">{pagination.page}</span> of{' '}
            <span className="font-semibold text-gray-800">{pagination.totalPages}</span> ({pagination.total} total products)
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
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={selectedProductForEdit}
        onSuccess={() => fetchProducts(pagination.page)}
      />

      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        product={selectedProductForAdjust}
        onSuccess={() => fetchProducts(pagination.page)}
      />

      <StockLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </div>
  );
};