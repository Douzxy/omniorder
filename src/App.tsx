import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Order from "@/pages/B2C/Order";
import Cart from "@/pages/B2C/Cart";
import Payment from "@/pages/B2C/Payment";
import Summary from "@/pages/B2C/Summary";
import AdminLogin from "@/pages/Admin/Login";
import AdminDashboard from "@/pages/Admin/Dashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Home Portal */}
          <Route path="/" element={<Home />} />

          {/* Customer ordering routes (public) */}
          <Route path="/:brandCode/:outletId/order" element={<Order />} />
          <Route path="/:brandCode/:outletId/view-order" element={<Cart />} />
          <Route path="/:brandCode/:outletId/payment" element={<Payment />} />
          <Route path="/:brandCode/:outletId/order-summary-cash" element={<Summary />} />

          {/* Admin login (public) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard (protected) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
