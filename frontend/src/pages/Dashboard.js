import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Table2, Columns3, AlertTriangle, Users2,
  FileCheck, ShieldAlert, Building2, Baby,
  TrendingUp, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid
} from "recharts";

const RISK_COLORS = { CRITICAL: "#FF6B6B", HIGH: "#F79B43", MEDIUM: "#BC8CFF", LOW: "#3DDC97" };

function StatCard({ icon: Icon, label, value, color = "#58A6FF", to }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => to && navigate(to)}
      className={`bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex items-start gap-4 transition-all duration-150 hover:border-[#8B949E] ${to ? 'cursor-pointer' : ''}`}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="p-2.5 rounded-md" style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#E6EDF3] font-mono">{value?.toLocaleString() ?? '—'}</p>
        <p className="text-xs text-[#8B949E] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ComplianceGauge({ score }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? "#3DDC97" : score >= 50 ? "#F79B43" : "#FF6B6B";

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#30363D"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
        <text x="100" y="85" textAnchor="middle" className="font-mono" fill={color} fontSize="32" fontWeight="600">
          {score}
        </text>
        <text x="100" y="105" textAnchor="middle" fill="#8B949E" fontSize="11">
          DPDPA Score
        </text>
      </svg>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C2333] border border-[#30363D] rounded-md px-3 py-2 shadow-lg">
      <p className="text-xs text-[#8B949E]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-mono" style={{ color: p.color }}>{p.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [score, setScore] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [slaBreaches, setSlaBreaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sc, rd, rs, sl] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/compliance-score"),
          api.get("/dashboard/risk-distribution"),
          api.get("/dashboard/recent-scans"),
          api.get("/dashboard/sla-breaches"),
        ]);
        setStats(s.data);
        setScore(sc.data);
        setRiskDist(rd.data);
        setRecentScans(rs.data);
        setSlaBreaches(sl.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p>
      </div>
    );
  }

  const riskPieData = riskDist ? [
    { name: "Critical", value: riskDist.critical, color: RISK_COLORS.CRITICAL },
    { name: "High", value: riskDist.high, color: RISK_COLORS.HIGH },
    { name: "Medium", value: riskDist.medium, color: RISK_COLORS.MEDIUM },
    { name: "Low", value: riskDist.low, color: RISK_COLORS.LOW },
  ].filter(d => d.value > 0) : [];

  const consentPieData = stats?.consent_stats ? [
    { name: "Active", value: stats.consent_stats.active, color: "#3DDC97" },
    { name: "Withdrawn", value: stats.consent_stats.withdrawn, color: "#FF6B6B" },
    { name: "Expired", value: stats.consent_stats.expired, color: "#F79B43" },
    { name: "Pending", value: stats.consent_stats.pending, color: "#BC8CFF" },
  ] : [];

  const scoreHistory = score?.score_history || [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Dashboard</h1>

      {/* Compliance Score + Stats Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Score Gauge */}
        <div className="lg:col-span-1 bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex flex-col items-center justify-center" data-testid="compliance-gauge">
          <ComplianceGauge score={score?.overall_score || 0} />
          <p className="text-xs text-[#8B949E] mt-2">{score?.overall_score >= 75 ? 'Compliant' : score?.overall_score >= 50 ? 'Needs Improvement' : 'At Risk'}</p>
        </div>

        {/* Stats Row 1 */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Table2} label="Assets Scanned" value={stats?.assets_scanned} color="#58A6FF" to="/assets" />
          <StatCard icon={Columns3} label="Columns Classified" value={stats?.columns_classified} color="#BC8CFF" />
          <StatCard icon={AlertTriangle} label="Open Risk Flags" value={stats?.open_risk_flags} color="#FF6B6B" to="/risk-flags" />
          <StatCard icon={Users2} label="Rights Pending" value={stats?.rights_pending} color="#F79B43" to="/rights" />
          <StatCard icon={FileCheck} label="Active Consents" value={stats?.active_consents} color="#3DDC97" to="/consent" />
          <StatCard icon={ShieldAlert} label="Breach Events" value={stats?.breach_events} color="#FF6B6B" to="/breach" />
          <StatCard icon={Building2} label="Vendors at Risk" value={stats?.vendors_at_risk} color="#F79B43" to="/vendors" />
          <StatCard icon={Baby} label="Children Data Assets" value={stats?.children_data_assets} color="#F778BA" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="risk-distribution-chart">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {riskPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {riskPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-[#8B949E]">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Trend */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="score-trend-chart">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Compliance Score Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="month" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#58A6FF" strokeWidth={2} dot={{ fill: "#58A6FF", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Consent Status */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="consent-status-chart">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Consent Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={consentPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {consentPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {consentPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-[#8B949E]">{d.name}: {(d.value / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="recent-scans-table">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#E6EDF3]">Recent Scan Jobs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#30363D]">
                  <th className="text-left text-[10px] uppercase tracking-wider text-[#8B949E] pb-2 font-medium">Type</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-[#8B949E] pb-2 font-medium">Status</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-[#8B949E] pb-2 font-medium">Assets</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-[#8B949E] pb-2 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-[#30363D]/50">
                    <td className="py-2.5 text-sm text-[#E6EDF3] font-mono">{scan.job_type}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${scan.status === 'COMPLETED' ? 'bg-[#3DDC97]/10 text-[#3DDC97]' : 'bg-[#F79B43]/10 text-[#F79B43]'}`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-sm text-[#8B949E] font-mono">{scan.assets_scanned}</td>
                    <td className="py-2.5 text-sm text-[#8B949E] font-mono">{scan.risk_flags_created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA Breaches */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="sla-breaches-table">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#E6EDF3]">SLA-Breaching Requests</h3>
          </div>
          {slaBreaches.length === 0 ? (
            <p className="text-sm text-[#8B949E] py-4 text-center">No SLA breaches found</p>
          ) : (
            <div className="space-y-3">
              {slaBreaches.map((req) => (
                <div key={req.id} className="bg-[#FF6B6B]/5 border-l-4 border-[#FF6B6B] rounded-r-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#E6EDF3]">{req.principal_name}</span>
                    <span className="text-xs font-mono bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-0.5 rounded">{req.request_type}</span>
                  </div>
                  <p className="text-xs text-[#8B949E] mt-1 truncate">{req.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {score?.recommendations && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="recommendations-section">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">AI Recommendations</h3>
          <div className="space-y-2">
            {score.recommendations.slice(0, 5).map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#0D1117] rounded-md border border-[#30363D]/50">
                <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ${
                  rec.priority === 'CRITICAL' ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/30' :
                  rec.priority === 'HIGH' ? 'bg-[#F79B43]/10 text-[#F79B43] border border-[#F79B43]/30' :
                  'bg-[#BC8CFF]/10 text-[#BC8CFF] border border-[#BC8CFF]/30'
                }`}>{rec.priority}</span>
                <div>
                  <p className="text-sm text-[#E6EDF3]">{rec.text}</p>
                  <p className="text-xs text-[#8B949E] mt-0.5">{rec.module}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
