import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.customMessage || err.response?.data?.message || 'Invalid login credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Mini ERP + CRM</h1>
          <p className="text-sm text-gray-600 mt-1">Sign in to access your operations workspace</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="user@erp.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
            Quick Test Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button type="button" onClick={() => handleQuickLogin('admin@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
              <strong>Admin:</strong> admin@erp.com
            </button>
            <button type="button" onClick={() => handleQuickLogin('sales@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
              <strong>Sales:</strong> sales@erp.com
            </button>
            <button type="button" onClick={() => handleQuickLogin('warehouse@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
              <strong>Warehouse:</strong> warehouse@erp.com
            </button>
            <button type="button" onClick={() => handleQuickLogin('accounts@erp.com')} className="p-2 border rounded bg-gray-50 hover:bg-gray-100 text-left">
              <strong>Accounts:</strong> accounts@erp.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};