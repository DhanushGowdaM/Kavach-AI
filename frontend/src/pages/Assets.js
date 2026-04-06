import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Search, Filter, Table2, FileBox, Cloud, HardDrive } from "lucide-react";

const RISK_BADGE = {
  CRITICAL: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/30",
  HIGH: "bg-[#F79B43]/10 text-[#F79B43] border-[#F79B43]/30",
  MEDIUM: "bg-[#BC8CFF]/10 text-[#BC8CFF] border-[#BC8CFF]/30",
  LOW: "bg-[#3DDC97]/10 text-[#3DDC97] border-[#3DDC97]/30",
  UNSCANNED: "bg-[#8B949E]/10 text-[#8B949E] border-[#8B949E]/30",
};

const RISK_BORDER = {
  CRITICAL: "border-l-[#FF6B6B]",
  HIGH: "border-l-[#F79B43]",
  MEDIUM: "border-l-[#BC8CFF]",
  LOW: "border-l-[#3DDC97]",
  UNSCANNED: "border-l-[#8B949E]",
};

const ASSET_ICONS = {
  TABLE: Table2, FILE: HardDrive, OBJECT_STORE: Cloud, API: FileBox,
};

function formatBytes(bytes) {
  if (!bytes) return "—";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadAssets();
  }, [riskFilter]);

  const loadAssets = async () => {
    try {
      const params = {};
      if (riskFilter) params.risk_tier = riskFilter;
      const { data } = await api.get("/assets", { params });
      setAssets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assets.filter(a =>
    !search || a.asset_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="assets-page">
      <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Data Assets</h1>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
          <input
            data-testid="asset-search-input"
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1117] border border-[#30363D] rounded-md pl-10 pr-4 py-2 text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 focus:border-[#58A6FF] focus:outline-none"
          />
        </div>
        <select
          data-testid="risk-filter-select"
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setLoading(true); }}
          className="bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
        >
          <option value="">All Risk Tiers</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Asset Cards */}
      <div className="space-y-3">
        {filtered.map((asset) => {
          const Icon = ASSET_ICONS[asset.asset_type] || Table2;
          return (
            <div
              key={asset.id}
              onClick={() => navigate(`/assets/${asset.id}`)}
              className={`bg-[#161B22] border border-[#30363D] border-l-4 ${RISK_BORDER[asset.risk_tier] || RISK_BORDER.UNSCANNED} rounded-lg p-5 hover:border-[#8B949E] transition-all duration-150 cursor-pointer`}
              data-testid={`asset-row-${asset.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#1C2333] rounded-md">
                    <Icon size={18} className="text-[#58A6FF]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#E6EDF3] font-mono">{asset.asset_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#8B949E]">{asset.row_count?.toLocaleString()} rows</span>
                      <span className="text-xs text-[#8B949E]">{formatBytes(asset.size_bytes)}</span>
                      <span className="text-xs text-[#8B949E]">{asset.asset_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {asset.has_sensitive_data && <span className="text-xs bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-0.5 rounded">Sensitive</span>}
                  {asset.has_financial_data && <span className="text-xs bg-[#F79B43]/10 text-[#F79B43] px-2 py-0.5 rounded">Financial</span>}
                  {asset.has_children_data && <span className="text-xs bg-[#F778BA]/10 text-[#F778BA] px-2 py-0.5 rounded">Children</span>}
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${RISK_BADGE[asset.risk_tier]}`}>
                    {asset.risk_tier}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
