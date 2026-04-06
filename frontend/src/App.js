import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DataSources from "@/pages/DataSources";
import Assets from "@/pages/Assets";
import AssetDetail from "@/pages/AssetDetail";
import ConsentManager from "@/pages/ConsentManager";
import RightsHub from "@/pages/RightsHub";
import RiskFlags from "@/pages/RiskFlags";
import BreachSentinel from "@/pages/BreachSentinel";
import VendorTrust from "@/pages/VendorTrust";
import ComplianceScore from "@/pages/ComplianceScore";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <p className="text-[#8B949E] font-mono text-sm animate-pulse">INITIALIZING KAVACH...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sources" element={<DataSources />} />
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="consent" element={<ConsentManager />} />
        <Route path="rights" element={<RightsHub />} />
        <Route path="risk-flags" element={<RiskFlags />} />
        <Route path="breach" element={<BreachSentinel />} />
        <Route path="vendors" element={<VendorTrust />} />
        <Route path="compliance" element={<ComplianceScore />} />
        <Route path="reports" element={<PlaceholderPage title="Audit Reports" />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="space-y-6 animate-fade-in" data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-page`}>
      <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">{title}</h1>
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-8 text-center">
        <p className="text-sm text-[#8B949E]">This module is coming soon.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#161B22', color: '#E6EDF3', border: '1px solid #30363D' },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
