import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { ArrowLeft, Shield, Lock, Unlock, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RISK_BADGE = {
  CRITICAL: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/30",
  HIGH: "bg-[#F79B43]/10 text-[#F79B43] border-[#F79B43]/30",
  MEDIUM: "bg-[#BC8CFF]/10 text-[#BC8CFF] border-[#BC8CFF]/30",
  LOW: "bg-[#3DDC97]/10 text-[#3DDC97] border-[#3DDC97]/30",
};

const CAT_COLORS = {
  SENSITIVE_PERSONAL: "#FF6B6B",
  FINANCIAL: "#F79B43",
  CHILDREN: "#F778BA",
  PERSONAL: "#58A6FF",
  OPERATIONAL: "#8B949E",
  UNCLASSIFIED: "#8B949E",
};

function ConfidenceBar({ value }) {
  const color = value >= 90 ? "#3DDC97" : value >= 75 ? "#F79B43" : "#FF6B6B";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#30363D] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [columns, setColumns] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, c, f] = await Promise.all([
          api.get(`/assets/${id}`),
          api.get(`/assets/${id}/columns`),
          api.get("/risk/flags"),
        ]);
        setAsset(a.data);
        setColumns(c.data);
        setFlags(f.data.filter(fl => fl.asset_id === id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;
  if (!asset) return <div className="text-[#8B949E] text-center py-8">Asset not found</div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="asset-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/assets")} className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors" data-testid="back-to-assets">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-mono">{asset.asset_name}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-[#8B949E]">{asset.row_count?.toLocaleString()} rows</span>
            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${RISK_BADGE[asset.risk_tier]}`}>{asset.risk_tier}</span>
            <span className="flex items-center gap-1 text-xs text-[#8B949E]">
              {asset.encryption_status === "ENCRYPTED" ? <Lock size={12} className="text-[#3DDC97]" /> : <Unlock size={12} className="text-[#F79B43]" />}
              {asset.encryption_status}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Type", value: asset.asset_type },
          { label: "Access Level", value: asset.access_level },
          { label: "Retention", value: asset.retention_policy_days ? `${asset.retention_policy_days} days` : "Not set" },
          { label: "Last Scanned", value: asset.last_scanned_at ? new Date(asset.last_scanned_at).toLocaleDateString("en-IN") : "Never" },
        ].map(m => (
          <div key={m.label} className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">{m.label}</p>
            <p className="text-sm text-[#E6EDF3] font-mono">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="columns" className="w-full">
        <TabsList className="bg-[#161B22] border border-[#30363D] p-1">
          <TabsTrigger value="columns" data-testid="tab-columns" className="data-[state=active]:bg-[#1C2333] data-[state=active]:text-[#58A6FF] text-[#8B949E] text-sm">
            Columns ({columns.length})
          </TabsTrigger>
          <TabsTrigger value="risks" data-testid="tab-risks" className="data-[state=active]:bg-[#1C2333] data-[state=active]:text-[#FF6B6B] text-[#8B949E] text-sm">
            Risk Flags ({flags.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="columns" className="mt-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="columns-table">
                <thead>
                  <tr className="border-b border-[#30363D]">
                    {["Column", "Type", "DPDPA Category", "Subcategory", "Confidence", "Risk", "PII"].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase tracking-wider text-[#8B949E] px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {columns.map((col) => (
                    <tr key={col.id} className="border-b border-[#30363D]/50 hover:bg-[#1C2333] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#E6EDF3] font-mono">{col.column_name}</td>
                      <td className="px-4 py-3 text-xs text-[#8B949E] font-mono">{col.data_type}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ color: CAT_COLORS[col.dpdpa_category] || "#8B949E", background: `${CAT_COLORS[col.dpdpa_category] || "#8B949E"}15` }}>
                          {col.dpdpa_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8B949E]">{col.subcategory}</td>
                      <td className="px-4 py-3"><ConfidenceBar value={col.confidence_score} /></td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono border ${RISK_BADGE[col.risk_tier]}`}>{col.risk_tier}</span>
                      </td>
                      <td className="px-4 py-3">
                        {col.is_pii && <Shield size={14} className="text-[#F79B43]" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <div className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-sm text-[#8B949E] text-center py-8">No risk flags for this asset</p>
            ) : (
              flags.map((flag) => (
                <div key={flag.id} className="bg-[#161B22] border border-[#30363D] border-l-4 border-l-[#FF6B6B] rounded-r-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className="text-[#FF6B6B] mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-[#E6EDF3]">{flag.flag_type.replace(/_/g, " ")}</h4>
                        <p className="text-xs text-[#8B949E] mt-1">{flag.description}</p>
                        <p className="text-xs text-[#BC8CFF] mt-2 font-mono">{flag.dpdpa_section}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border shrink-0 ${RISK_BADGE[flag.severity]}`}>{flag.severity}</span>
                  </div>
                  <div className="mt-3 bg-[#0D1117] rounded-md p-3 border border-[#30363D]/50">
                    <p className="text-xs text-[#8B949E]"><span className="text-[#3DDC97]">Remediation:</span> {flag.remediation_advice}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
