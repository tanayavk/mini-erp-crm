import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ChallanDetailModal = ({ challanId, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
    const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day}-${month}-${year}, ${time}`;
  };

  const fetchChallanDetails = async () => {
    if (!challanId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/challans/${challanId}`);
      setChallan(response.data.data);
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch sales challan snapshot details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && challanId) {
      fetchChallanDetails();
    }
  }, [isOpen, challanId]);

  if (!isOpen) return null;

  const handleStatusTransition = async (newStatus) => {
    setUpdatingStatus(true);
    setError('');
    try {
      await api.patch(`/challans/${challanId}/status`, { status: newStatus });
      await fetchChallanDetails();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(
        err.customMessage ||
        err.response?.data?.message ||
        `Failed to transition challan status to ${newStatus}.`
      );
    } finally {
      setUpdatingStatus(false);
    }
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

  const grandTotalValuation = challan?.items?.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = parseFloat(item.unit_price_snapshot) || 0;
    return sum + (item.line_total ? parseFloat(item.line_total) : qty * price);
  }, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">{challan?.challan_number || 'Challan Profile'}</h2>
                {challan?.status && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(challan.status)}`}>
                    {challan.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Created: {formatIndianDateTime(challan?.created_at)} by {challan?.creator_email || 'System User'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 font-medium">
                {error}
              </div>
            ) : challan ? (
              <>
                {/* Customer Information Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Customer Account Overview
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Business Name</span>
                      <span className="font-bold text-gray-900 text-sm">{challan.customer_business_name || challan.customer_name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">GSTIN</span>
                      <span className="font-medium text-gray-800 text-sm">{challan.customer_gst_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Contact Mobile</span>
                      <span className="font-medium text-gray-800">{challan.customer_mobile || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Email Address</span>
                      <span className="font-medium text-gray-800">{challan.customer_email || 'N/A'}</span>
                    </div>
                  </div>
                  {challan.customer_address && (
                    <div className="pt-2 border-t border-gray-200 text-xs">
                      <span className="font-semibold text-gray-500 uppercase block">Delivery Address</span>
                      <p className="text-gray-700 mt-0.5">{challan.customer_address}</p>
                    </div>
                  )}
                </div>

                {/* Items Snapshot Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Frozen Line Item Snapshots
                  </h4>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 font-semibold uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3">Product Name</th>
                          <th className="px-4 py-3">Unit Price Snapshot</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-700">
                        {challan.items?.map((item, idx) => {
                          const price = parseFloat(item.unit_price_snapshot) || 0;
                          const qty = parseInt(item.quantity, 10) || 0;
                          const lineTotal = item.line_total ? parseFloat(item.line_total) : qty * price;

                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {item.product_name_snapshot || `Product #${item.product_id}`}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-600">
                                {formatINR(price)}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-900">
                                {qty}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                {formatINR(lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="rounded-xl bg-gray-900 text-white p-4 flex justify-between items-center">
                  <div className="text-xs">
                    Total Dispatched Quantity: <span className="font-bold text-blue-400">{challan.total_quantity} Units</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Challan Valuation</span>
                    <span className="text-xl font-extrabold text-emerald-400">{formatINR(grandTotalValuation)}</span>
                  </div>
                </div>

                {/* Status Transitions */}
                {challan.status === 'Draft' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <h5 className="text-xs font-bold text-amber-900 uppercase">Status Actions</h5>
                    <p className="text-xs text-amber-800">
                      This sales challan is in <strong>Draft</strong> state. Confirming this challan will permanently commit inventory reductions.
                    </p>
                    {canMutate ? (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleStatusTransition('Confirmed')}
                          disabled={updatingStatus}
                          className="rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          {updatingStatus ? 'Updating...' : 'Confirm Challan'}
                        </button>
                        <button
                          onClick={() => handleStatusTransition('Cancelled')}
                          disabled={updatingStatus}
                          className="rounded bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {updatingStatus ? 'Updating...' : 'Cancel Challan'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 italic">
                        Your role ({user?.role}) permits viewing, but only Admin and Sales personnel can transition status.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};