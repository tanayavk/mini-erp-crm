import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const StockAdjustmentModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [movementType, setMovementType] = useState('IN');
  const [quantityChanged, setQuantityChanged] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMovementType('IN');
    setQuantityChanged('');
    setReason('');
    setError('');
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantityChanged, 10);
    if (!qty || qty <= 0) {
      setError('Quantity changed must be greater than 0.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this stock adjustment.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/products/${product.id}/stock`, {
        movement_type: movementType,
        quantity_changed: qty,
        reason: reason.trim(),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.customMessage ||
        err.response?.data?.message ||
        'Failed to adjust stock quantity.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Manual Stock Adjustment</h3>
            <p className="text-xs text-gray-500">{product.name} ({product.sku})</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs border border-gray-200 flex justify-between items-center">
          <div>
            <span className="text-gray-500 uppercase block font-semibold">Location</span>
            <span className="text-gray-800 font-medium">{product.location}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 uppercase block font-semibold">Available Stock</span>
            <span className="text-sm font-bold text-gray-900">{product.current_stock} Units</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Movement Direction *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMovementType('IN')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  movementType === 'IN'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                + STOCK IN (Addition)
              </button>
              <button
                type="button"
                onClick={() => setMovementType('OUT')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  movementType === 'OUT'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                - STOCK OUT (Reduction)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Quantity Changed *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantityChanged}
              onChange={(e) => setQuantityChanged(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Enter quantity count"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Reason / Audit Note *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Received shipment from vendor, Damaged stock scrapped, Inventory audit correction"
            />
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
              className={`rounded-lg px-5 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
                movementType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Processing...' : `Confirm Stock ${movementType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};