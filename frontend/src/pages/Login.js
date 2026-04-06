import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <Shield size={36} className="text-[#58A6FF]" />
          <span className="text-3xl font-semibold text-[#E6EDF3] font-['Outfit']">Kavach</span>
        </div>

        {/* Card */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-8 animate-fade-in">
          <h2 className="text-xl font-medium text-[#E6EDF3] mb-1 font-['Outfit']">Welcome back</h2>
          <p className="text-sm text-[#8B949E] mb-6">Sign in to your DPDPA compliance platform</p>

          {error && (
            <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-sm rounded-md px-4 py-3 mb-4" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-4 py-2.5 text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30 transition-colors"
                placeholder="admin@bharatiyabank.example.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  data-testid="login-password-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-4 py-2.5 text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 focus:border-[#58A6FF] focus:outline-none focus:ring-1 focus:ring-[#58A6FF]/30 transition-colors pr-10"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#30363D]">
            <p className="text-xs text-[#8B949E] text-center">Demo credentials:</p>
            <p className="text-xs text-[#8B949E] text-center mt-1 font-mono">admin@bharatiyabank.example.com / Kavach@2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
