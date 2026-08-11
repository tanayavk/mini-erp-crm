import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerDetailDrawer = ({ customerId, isOpen, onClose, onCustomerUpdate }) => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  const canEdit = ['Admin', 'Sales'].includes(user?.role);

  // Helper for Indian Date Format DD-MM-YYYY
  const formatIndianDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper for Indian Date Time Format DD-MM-YYYY, hh:mm A
  const formatIndianDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day}-${month}-${year}, ${time}`;
  };

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/customers/${customerId}`);
      setCustomer(response.data.data);
    } catch (err) {
      setError(err.customMessage || 'Failed to load customer profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !followUpDate) {
      setNoteError('Both interaction note and follow-up date are required.');
      return;
    }

    setSubmittingNote(true);
    setNoteError('');

    try {
      const response = await api.post(`/customers/${customerId}/notes`, {
        note: noteText,
        follow_up_date: new Date(followUpDate).toISOString(),
      });

      const newNote = response.data.data || {
        id: Date.now(),
        note: noteText,
        follow_up_date: followUpDate,
        created_at: new Date().toISOString(),
        creator_email: user.email,
        creator_role: user.role,
      };

      setCustomer((prev) => ({
        ...prev,
        notes: [newNote, ...(prev.notes || [])],
      }));

      setNoteText('');
      setFollowUpDate('');
      if (onCustomerUpdate) onCustomerUpdate();
    } catch (err) {
      setNoteError(err.customMessage || err.response?.data?.message || 'Failed to post follow-up note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {customer?.business_name || 'Customer Profile'}
              </h2>
              <p className="text-xs text-gray-500">Customer Ref ID: #{customerId}</p>
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
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            ) : customer ? (
              <>
                {/* Profile Data */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Contact Person</span>
                      <span className="font-medium text-gray-800 text-sm">{customer.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Customer Type</span>
                      <span className="font-medium text-gray-800 text-sm">{customer.type}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Mobile</span>
                      <span className="font-medium text-gray-800 text-sm">{customer.mobile}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Email</span>
                      <span className="font-medium text-gray-800 text-sm">{customer.email}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">GSTIN</span>
                      <span className="font-medium text-gray-800 text-sm">{customer.gst_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block">Status</span>
                      <span className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {customer.status}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 text-xs">
                    <span className="font-semibold text-gray-500 uppercase block mb-1">Registered Address</span>
                    <p className="text-gray-700">{customer.address}</p>
                  </div>
                </div>

                {/* Add Note Section */}
                {canEdit ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3">
                      Add Follow-Up Note
                    </h4>
                    {noteError && (
                      <div className="mb-3 rounded bg-red-50 p-2 text-xs text-red-700 border border-red-200">
                        {noteError}
                      </div>
                    )}
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <div>
                        <textarea
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Log meeting outcome, payment reminders, or order requests..."
                          className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Follow-Up Target Date
                          </label>
                          <input
                            type="datetime-local"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingNote}
                          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {submittingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                    <strong>Read-Only Mode:</strong> Your role ({user?.role}) allows viewing notes, but only Admin and Sales can record new follow-up interactions.
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                    Follow-Up Timeline ({customer.notes?.length || 0})
                  </h4>
                  {customer.notes && customer.notes.length > 0 ? (
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                      {customer.notes.map((noteItem) => (
                        <div key={noteItem.id} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600"></div>
                          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span className="font-semibold text-gray-800">
                                {noteItem.creator_email || 'System User'} ({noteItem.creator_role || 'Staff'})
                              </span>
                              <span>{formatIndianDate(noteItem.created_at)}</span>
                            </div>
                            <p className="text-xs text-gray-700 my-2">{noteItem.note}</p>
                            {noteItem.follow_up_date && (
                              <div className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                                Next Follow-up: {formatIndianDateTime(noteItem.follow_up_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic text-center py-4">
                      No interaction logs found for this customer.
                    </p>
                  )}
                </div>
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