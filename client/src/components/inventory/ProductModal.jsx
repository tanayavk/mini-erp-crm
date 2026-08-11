import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const ProductModal = ({ isOpen, onClose, productToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unit_price: '',
    current_stock: 0,
    min_stock_alert: 10,
    location: 'Bhiwandi Warehouse - Rack A1',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        category: productToEdit.category || 'Electronics',
        unit_price: productToEdit.unit_price || '',
        current_stock: productToEdit.current_stock ?? 0,
        min_stock_alert: productToEdit.min_stock_alert ?? 10,
        location: productToEdit.location || 'Bhiwandi Warehouse - Rack A1',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Electronics',
        unit_price: '',
        current_stock: 0,
        min_stock_alert: 10,
        location: 'Bhiwandi Warehouse - Rack A1',
      });
    }
    setFieldErrors({});
    setGeneralError('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError('');

    const payload = {
      ...formData,
      unit_price: parseFloat(formData.unit_price),
      current_stock: parseInt(formData.current_stock, 10),
      min_stock_alert: parseInt(formData.min_stock_alert, 10),
    };

    try {
      if (productToEdit) {
        await api.put(`/products/${productToEdit.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const responseData = err.response?.data;
      if (err.response?.status === 400 && Array.isArray(responseData?.error)) {
        const errorsObj = {};
        responseData.error.forEach((item) => {
          if (item.field) errorsObj[item.field] = item.message;
        });
        setFieldErrors(errorsObj);
      } else {
        setGeneralError(responseData?.message || 'Failed to save product details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {productToEdit ? 'Edit Product Item' : 'Add New Inventory Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none"
          >
            &times;
          </button>
        </div>

        {generalError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="e.g. Wireless Ergonomic Mouse"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                SKU / Item Code *
              </label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.sku ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="e.g. MOUSE-ERG-001"
              />
              {fieldErrors.sku && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.sku}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="Electronics">Electronics</option>
                <option value="Hardware">Hardware</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Packaging">Packaging</option>
                <option value="General Merchandise">General Merchandise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Unit Price (₹ INR) *
              </label>
              <input
                type="number"
                step="0.01"
                name="unit_price"
                required
                value={formData.unit_price}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.unit_price ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="e.g. 1499.00"
              />
              {fieldErrors.unit_price && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.unit_price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                {productToEdit ? 'Current Stock' : 'Initial Stock Quantity *'}
              </label>
              <input
                type="number"
                name="current_stock"
                required
                disabled={Boolean(productToEdit)}
                value={formData.current_stock}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  productToEdit ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="0"
              />
              {productToEdit && (
                <p className="mt-1 text-[10px] text-gray-500">
                  Use "Adjust Stock" button on catalog table for stock movements.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Min. Stock Alert Quantity *
              </label>
              <input
                type="number"
                name="min_stock_alert"
                required
                value={formData.min_stock_alert}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  fieldErrors.min_stock_alert ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="10"
              />
              {fieldErrors.min_stock_alert && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.min_stock_alert}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Warehouse Storage Location *
            </label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                fieldErrors.location ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="e.g. Bhiwandi Warehouse - Rack 4, Whitefield Logistics Depot"
            />
            {fieldErrors.location && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Saving...' : productToEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};