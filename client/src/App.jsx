import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';

// Layout Wrapper for Authenticated Pages
const MainLayout = () => (
  <div className="flex h-screen bg-gray-50 overflow-hidden">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-y-auto">
      <Navbar />
      <main className="p-6 flex-1">
        <Outlet />
      </main>
    </div>
  </div>
);

// Module Stubs
const CustomersPage = () => <div className="text-xl font-semibold text-gray-700">Customers Module Placeholder</div>;
const ProductsPage = () => <div className="text-xl font-semibold text-gray-700">Products & Inventory Module Placeholder</div>;
const ChallansPage = () => <div className="text-xl font-semibold text-gray-700">Sales Challans Module Placeholder</div>;

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/challans" element={<ChallansPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}