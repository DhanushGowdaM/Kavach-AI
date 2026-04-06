import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { FileCheck, Plus, Users, Clock, XCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C2333] border border-[#30363D] rounded-md px-3 py-2 shadow-lg">
      <p className="text-xs text-[#8B949E]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-mono" style={{ color: p.color || p.fill }}>{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function ConsentManager() {
  const [dashboard, setDashboard] = useState(null);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ purpose_name: "", purpose_description: "", legal_basis: "CONSENT", retention_days: 365, data_categories_used: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [d, p] = await Promise.all([
        api.get("/consent/dashboard"),
        api.get("/consent/purposes"),
      ]);
      setDashboard(d.data);
      setPurposes(p.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePurpose = async (e) => {
    e.preventDefault();
    try {
      await api.post("/consent/purposes", form);
      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  const stats = dashboard?.stats || {};
  const consentPieData = [
    { name: "Active", value: stats.active || 0, color: "#3DDC97" },
    { name: "Withdrawn", value: stats.withdrawn || 0, color: "#FF6B6B" },
    { name: "Expired", value: stats.expired || 0, color: "#F79B43" },
    { name: "Pending", value: stats.pending || 0, color: "#BC8CFF" },
  ];

  const purposeBarData = purposes.map(p => ({
    name: p.purpose_name.length > 15 ? p.purpose_name.slice(0, 15) + "..." : p.purpose_name,
    retention: p.retention_days,
    categories: p.data_categories_used?.length || 0,
  }));

  const LEGAL_BASIS_COLORS = {
    CONSENT: "#58A6FF", CONTRACT: "#3DDC97", LEGAL_OBLIGATION: "#F79B43",
    LEGITIMATE_INTEREST: "#BC8CFF", VITAL_INTEREST: "#FF6B6B", PUBLIC_TASK: "#F778BA",
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="consent-manager-page">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Consent Manager</h1>
        <div className="flex items-center gap-2">
          {["dashboard", "purposes"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`consent-tab-${t}`}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${tab === t ? "bg-[#58A6FF]/10 text-[#58A6FF]" : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2333]"}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === "dashboard" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Consents", value: stats.total, icon: FileCheck, color: "#58A6FF" },
              { label: "Active", value: stats.active, icon: CheckCircle2, color: "#3DDC97" },
              { label: "Withdrawn", value: stats.withdrawn, icon: XCircle, color: "#FF6B6B" },
              { label: "Expired", value: stats.expired, icon: Clock, color: "#F79B43" },
              { label: "Pending", value: stats.pending, icon: AlertCircle, color: "#BC8CFF" },
            ].map(s => (
              <div key={s.label} className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid={`consent-stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <s.icon size={16} style={{ color: s.color }} />
                  <span className="text-[10px] uppercase tracking-wider text-[#8B949E]">{s.label}</span>
                </div>
                <p className="text-xl font-semibold text-[#E6EDF3] font-mono">{s.value?.toLocaleString() || "0"}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="consent-pie-chart">
              <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Consent Health</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={consentPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                    {consentPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {consentPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-[#8B949E]">{d.name}: {(d.value / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="purpose-bar-chart">
              <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Purpose Retention (Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={purposeBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="name" tick={{ fill: "#8B949E", fontSize: 10 }} axisLine={{ stroke: "#30363D" }} />
                  <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="retention" fill="#58A6FF" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === "purposes" && (
        <>
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button data-testid="add-purpose-btn" className="bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2">
                  <Plus size={16} /> Add Purpose
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#161B22] border-[#30363D] text-[#E6EDF3] max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-['Outfit']">Create Consent Purpose</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePurpose} className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Purpose Name</label>
                    <input data-testid="purpose-name-input" value={form.purpose_name} onChange={(e) => setForm({...form, purpose_name: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Description</label>
                    <textarea data-testid="purpose-desc-input" value={form.purpose_description} onChange={(e) => setForm({...form, purpose_description: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none resize-none h-20" required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Legal Basis</label>
                    <select value={form.legal_basis} onChange={(e) => setForm({...form, legal_basis: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none">
                      {["CONSENT","CONTRACT","LEGAL_OBLIGATION","LEGITIMATE_INTEREST","VITAL_INTEREST","PUBLIC_TASK"].map(b => (
                        <option key={b} value={b}>{b.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Retention (Days)</label>
                    <input type="number" value={form.retention_days} onChange={(e) => setForm({...form, retention_days: parseInt(e.target.value) || 0})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none" />
                  </div>
                  <button data-testid="save-purpose-btn" type="submit" className="w-full bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold py-2 rounded-md transition-colors text-sm">Create Purpose</button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {purposes.map(p => (
              <div key={p.id} className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid={`purpose-card-${p.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[#E6EDF3]">{p.purpose_name}</h3>
                    <p className="text-xs text-[#8B949E] mt-1 line-clamp-2">{p.purpose_description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ color: LEGAL_BASIS_COLORS[p.legal_basis] || "#8B949E", background: `${LEGAL_BASIS_COLORS[p.legal_basis] || "#8B949E"}15` }}>
                        {p.legal_basis?.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[#8B949E]">Retention: {p.retention_days} days</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {p.data_categories_used?.map(cat => (
                      <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2333] text-[#8B949E]">{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
