import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const CreateChallanModal = ({ isOpen, onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0, current_stock: 0, product_name: '' }
  ]);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  useEffect(() => {
    if (isOpen) {
      fetchInitialDropdowns();
      setSelectedCustomerId('');
      setItems([{ product_id: '', quantity: 1, unit_price: 0, current_stock: 0, product_name: '' }]);
      setError('');
    }
  }, [isOpen]);

  const fetchInitialDropdowns = async () => {
    setLoadingData(true);
    setError('');
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/products', { params: { limit: 100 } }),
      ]);

      const custData = custRes.data.data?.items || custRes.data.data || [];
      const prodData = prodRes.data.data?.items || prodRes.data.data || [];

      setCustomers(custData);
      setProducts(prodData);
    } catch (err) {
      setError(err.customMessage || 'Failed to load options for customers or products.');
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { product_id: '', quantity: 1, unit_price: 0, current_stock: 0, product_name: '' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, productId) => {
    const prod = products.find((p) => p.id === parseInt(productId, 10));
    setItems((prev) => {
      const updated = [...prev];
      if (prod) {
        updated[index] = {
          product_id: prod.id,
          product_name: prod.name,
          quantity: 1,
          unit_price: parseFloat(prod.unit_price) || 0,
          current_stock: prod.current_stock || 0,
        };
      } else {
        updated[index] = { product_id: '', quantity: 1, unit_price: 0, current_stock: 0, product_name: '' };
      }
      return updated;
    });
  };

  const handleQuantityChange = (index, qtyVal) => {
    const qty = parseInt(qtyVal, 10) || 0;
    setItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = qty;
      return updated;
    });
  };

  const calculateGrandTotals = () => {
    const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
    const grandTotalAmount = items.reduce(
      (sum, item) => sum + (parseInt(item.quantity, 10) || 0) * (parseFloat(item.unit_price) || 0),
      0
    );
    return { totalQty, grandTotalAmount };
  };

  const { totalQty, grandTotalAmount } = calculateGrandTotals();

  const handleSubmit = async (targetStatus) => {
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer for this sales challan.');
      return;
    }

    const validItems = items.filter((item) => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      setError('Please select at least one valid product with quantity > 0.');
      return;
    }

    // Client-side pre-validation warning check for stock
    if (targetStatus === 'Confirmed') {
      const stockViolation = validItems.find((i) => i.quantity > i.current_stock);
      if (stockViolation) {
        setError(
          `Cannot confirm: Requested quantity (${stockViolation.quantity}) for '${stockViolation.product_name}' exceeds available stock (${stockViolation.current_stock}).`
        );
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      status: targetStatus,
      items: validItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
    };

    try {
      await api.post('/challans', payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.customMessage ||
        err.response?.data?.message ||
        'Failed to process sales challan transaction.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl border border-gray-200 my-8">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Create Sales Challan</h3>
            <p className="text-xs text-gray-500">Generate dispatch notes and commit inventory deductions</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 font-medium">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="py-16 text-center text-gray-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-xs">Loading customer directory & product catalog...</p>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-6">
            {/* Customer Picker */}
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
              <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                Select Customer Account *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name} ({c.name}) - {c.mobile}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Line Items Configuration
                </h4>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="rounded bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  + Add Product Line
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const isStockExceeded = item.product_id && item.quantity > item.current_stock;
                  const lineTotal = item.quantity * item.unit_price;

                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm space-y-2"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Product
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) | Stock: {p.current_stock}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="text"
                            disabled
                            value={formatINR(item.unit_price)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 font-semibold"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={`w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none ${
                              isStockExceeded ? 'border-red-500 bg-red-50 text-red-900 font-bold' : 'border-gray-300'
                            }`}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Line Total
                          </label>
                          <div className="py-1.5 text-xs font-bold text-gray-900">
                            {formatINR(lineTotal)}
                          </div>
                        </div>

                        <div className="md:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            disabled={items.length === 1}
                            className="text-red-500 hover:text-red-700 text-lg font-bold disabled:opacity-30"
                          >
                            &times;
                          </button>
                        </div>
                      </div>

                      {/* Stock Warning Banner */}
                      {isStockExceeded && (
                        <div className="rounded bg-red-100 p-2 text-[11px] text-red-800 font-medium flex items-center justify-between border border-red-200">
                          <span>
                            ⚠️ Warning: Requested quantity ({item.quantity}) exceeds available inventory ({item.current_stock} units available).
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grand Total Bar */}
            <div className="rounded-xl bg-gray-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs space-y-1">
                <div>Total Unique Items: <span className="font-bold text-blue-400">{items.length}</span></div>
                <div>Total Product Units: <span className="font-bold text-blue-400">{totalQty} Units</span></div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 uppercase block font-semibold">Grand Total Valuation</span>
                <span className="text-2xl font-extrabold text-emerald-400">{formatINR(grandTotalAmount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('Draft')}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition"
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('Confirmed')}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                {submitting ? 'Confirming...' : 'Confirm & Generate Challan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};