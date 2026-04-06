import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Building2, Globe, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

const RISK_BADGE = {
  CRITICAL: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/30",
  HIGH: "bg-[#F79B43]/10 text-[#F79B43] border-[#F79B43]/30",
  MEDIUM: "bg-[#BC8CFF]/10 text-[#BC8CFF] border-[#BC8CFF]/30",
  LOW: "bg-[#3DDC97]/10 text-[#3DDC97] border-[#3DDC97]/30",
};

const CONTRACT_STATUS = {
  ACTIVE: { color: "#3DDC97", bg: "bg-[#3DDC97]/10" },
  EXPIRED: { color: "#FF6B6B", bg: "bg-[#FF6B6B]/10" },
  PENDING: { color: "#F79B43", bg: "bg-[#F79B43]/10" },
  TERMINATED: { color: "#8B949E", bg: "bg-[#8B949E]/10" },
};

export default function VendorTrust() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/vendors");
        setVendors(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  const crossBorder = vendors.filter(v => v.is_cross_border);
  const expired = vendors.filter(v => v.contract_status === "EXPIRED");
  const highRisk = vendors.filter(v => ["HIGH", "CRITICAL"].includes(v.risk_tier));

  return (
    <div className="space-y-6 animate-fade-in" data-testid="vendor-trust-page">
      <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Vendor Trust</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Total Vendors</p>
          <p className="text-2xl font-semibold text-[#E6EDF3] font-mono">{vendors.length}</p>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Cross-Border</p>
          <p className="text-2xl font-semibold text-[#F79B43] font-mono">{crossBorder.length}</p>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Expired Contracts</p>
          <p className="text-2xl font-semibold text-[#FF6B6B] font-mono">{expired.length}</p>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">High Risk</p>
          <p className="text-2xl font-semibold text-[#FF6B6B] font-mono">{highRisk.length}</p>
        </div>
      </div>

      {/* Vendors */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
        <table className="w-full" data-testid="vendors-table">
          <thead>
            <tr className="border-b border-[#30363D]">
              {["Vendor", "Type", "Country", "Risk Score", "Contract", "Actions"].map(h => (
                <th key={h} className="text-left text-[10px] uppercase tracking-wider text-[#8B949E] px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendors.map(vendor => {
              const contractStyle = CONTRACT_STATUS[vendor.contract_status] || CONTRACT_STATUS.PENDING;
              return (
                <tr key={vendor.id} className="border-b border-[#30363D]/50 hover:bg-[#1C2333] transition-colors" data-testid={`vendor-row-${vendor.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-[#58A6FF]" />
                      <div>
                        <p className="text-sm text-[#E6EDF3]">{vendor.vendor_name}</p>
                        {vendor.is_cross_border && (
                          <span className="text-[10px] text-[#F79B43] flex items-center gap-1 mt-0.5">
                            <Globe size={10} /> Cross-border
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8B949E]">{vendor.vendor_type}</td>
                  <td className="px-4 py-3 text-xs text-[#8B949E]">{vendor.country}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#30363D] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${vendor.risk_score}%`,
                          background: vendor.risk_score >= 70 ? "#FF6B6B" : vendor.risk_score >= 40 ? "#F79B43" : "#3DDC97"
                        }} />
                      </div>
                      <span className="text-xs font-mono text-[#8B949E]">{vendor.risk_score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${contractStyle.bg}`} style={{ color: contractStyle.color }}>
                      {vendor.contract_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${RISK_BADGE[vendor.risk_tier]}`}>
                      {vendor.risk_tier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
