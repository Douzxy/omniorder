import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

import Home from "@/pages/Home";
import Order from "@/pages/B2C/Order";
import Cart from "@/pages/B2C/Cart";
import Payment from "@/pages/B2C/Payment";
import Summary from "@/pages/B2C/Summary";

import AdminLogin from "@/pages/Admin/Login";
import AdminHub from "@/pages/Admin/AdminHub";
import UnitsDashboard from "@/pages/Admin/UnitsDashboard";
import OutletsDashboard from "@/pages/Admin/OutletsDashboard";
import OutletWorkspace from "@/pages/Admin/OutletWorkspace";

import CustomerLogin from "@/pages/Customer/Login";
import CustomerRegister from "@/pages/Customer/Register";
import CustomerOrders from "@/pages/Customer/Orders";
import AuthCallback from "@/pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />

          {/* B2C ordering */}
          <Route path="/:brandCode/:outletId/order" element={<Order />} />
          <Route path="/:brandCode/:outletId/view-order" element={<Cart />} />
          <Route path="/:brandCode/:outletId/payment" element={<Payment />} />
          <Route path="/:brandCode/:outletId/order-summary-cash" element={<Summary />} />

          {/* Customer auth */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Admin login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin (protected) */}
          <Route path="/admin" element={<ProtectedRoute><AdminHub /></ProtectedRoute>} />
          <Route path="/admin/units" element={<ProtectedRoute><UnitsDashboard /></ProtectedRoute>} />
          <Route path="/admin/units/:unitId" element={<ProtectedRoute><OutletsDashboard /></ProtectedRoute>} />
          <Route path="/admin/outlets/:outletId" element={<ProtectedRoute><OutletWorkspace /></ProtectedRoute>} />

          {/* Legacy redirect */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}
