import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { AlertTriangle, CheckCircle2, Filter } from "lucide-react";

const SEVERITY_BADGE = {
  CRITICAL: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/30",
  HIGH: "bg-[#F79B43]/10 text-[#F79B43] border-[#F79B43]/30",
  MEDIUM: "bg-[#BC8CFF]/10 text-[#BC8CFF] border-[#BC8CFF]/30",
};

export default function RiskFlags() {
  const [flags, setFlags] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [resolving, setResolving] = useState(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const params = filter ? { severity: filter } : {};
      const [f, s] = await Promise.all([
        api.get("/risk/flags", { params }),
        api.get("/risk/summary"),
      ]);
      setFlags(f.data);
      setSummary(s.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (flagId) => {
    setResolving(flagId);
    try {
      await api.patch(`/risk/flags/${flagId}/resolve`, { resolution_notes: "Resolved via Kavach dashboard" });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="risk-flags-page">
      <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Risk Flags</h1>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Open", value: summary.total, color: "#58A6FF" },
            { label: "Critical", value: summary.critical, color: "#FF6B6B" },
            { label: "High", value: summary.high, color: "#F79B43" },
            { label: "Medium", value: summary.medium, color: "#BC8CFF" },
          ].map(s => (
            <div key={s.label} className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid={`risk-stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">{s.label}</p>
              <p className="text-2xl font-semibold font-mono" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-[#8B949E]" />
        <select
          data-testid="severity-filter"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setLoading(true); }}
          className="bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
        </select>
      </div>

      {/* Flags */}
      <div className="space-y-3">
        {flags.filter(f => !f.resolved_at).map(flag => (
          <div key={flag.id} className={`bg-[#161B22] border border-[#30363D] border-l-4 rounded-r-lg p-5 ${
            flag.severity === "CRITICAL" ? "border-l-[#FF6B6B]" : flag.severity === "HIGH" ? "border-l-[#F79B43]" : "border-l-[#BC8CFF]"
          }`} data-testid={`risk-flag-${flag.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle size={16} style={{ color: flag.severity === "CRITICAL" ? "#FF6B6B" : flag.severity === "HIGH" ? "#F79B43" : "#BC8CFF" }} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium text-[#E6EDF3]">{flag.flag_type?.replace(/_/g, " ")}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${SEVERITY_BADGE[flag.severity]}`}>{flag.severity}</span>
                  </div>
                  <p className="text-xs text-[#8B949E] mt-1">{flag.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-[#BC8CFF] font-mono">{flag.dpdpa_section}</span>
                    <span className="text-xs text-[#8B949E]">Asset: {flag.asset_name}</span>
                  </div>
                  <div className="mt-3 bg-[#0D1117] rounded-md p-3 border border-[#30363D]/50">
                    <p className="text-xs text-[#8B949E]"><span className="text-[#3DDC97]">Remediation:</span> {flag.remediation_advice}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleResolve(flag.id); }}
                disabled={resolving === flag.id}
                data-testid={`resolve-flag-${flag.id}`}
                className="ml-4 shrink-0 flex items-center gap-1.5 text-xs bg-[#3DDC97]/10 text-[#3DDC97] hover:bg-[#3DDC97]/20 px-3 py-1.5 rounded transition-colors"
              >
                <CheckCircle2 size={14} />
                {resolving === flag.id ? "Resolving..." : "Resolve"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
