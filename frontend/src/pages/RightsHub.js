import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Users2, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

const STATUS_COLORS = {
  SUBMITTED: { color: "#58A6FF", bg: "bg-[#58A6FF]/10" },
  ACKNOWLEDGED: { color: "#BC8CFF", bg: "bg-[#BC8CFF]/10" },
  IN_PROGRESS: { color: "#F79B43", bg: "bg-[#F79B43]/10" },
  COMPLETED: { color: "#3DDC97", bg: "bg-[#3DDC97]/10" },
  REJECTED: { color: "#FF6B6B", bg: "bg-[#FF6B6B]/10" },
  ESCALATED: { color: "#FF6B6B", bg: "bg-[#FF6B6B]/10" },
};

const TYPE_COLORS = {
  ACCESS: "#58A6FF", CORRECTION: "#BC8CFF", ERASURE: "#FF6B6B",
  NOMINATION: "#3DDC97", GRIEVANCE: "#F79B43", PORTABILITY: "#F778BA",
};

function getDaysRemaining(due) {
  if (!due) return null;
  const diff = new Date(due) - new Date();
  return Math.ceil(diff / 86400000);
}

export default function RightsHub() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await api.get("/rights/requests", { params });
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/rights/requests/${id}`, { status: newStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  const overdue = requests.filter(r => r.sla_breached);
  const pending = requests.filter(r => ["SUBMITTED", "IN_PROGRESS"].includes(r.status));

  return (
    <div className="space-y-6 animate-fade-in" data-testid="rights-hub-page">
      <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Rights Hub</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid="stat-total-requests">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Total Requests</p>
          <p className="text-2xl font-semibold text-[#E6EDF3] font-mono">{requests.length}</p>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid="stat-pending">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Pending</p>
          <p className="text-2xl font-semibold text-[#F79B43] font-mono">{pending.length}</p>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid="stat-overdue">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">SLA Breached</p>
          <p className="text-2xl font-semibold text-[#FF6B6B] font-mono">{overdue.length}</p>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid="stat-completed">
          <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Completed</p>
          <p className="text-2xl font-semibold text-[#3DDC97] font-mono">{requests.filter(r => r.status === "COMPLETED").length}</p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg p-4 flex items-center gap-3" data-testid="overdue-alert">
          <AlertTriangle size={20} className="text-[#FF6B6B]" />
          <p className="text-sm text-[#FF6B6B]">{overdue.length} request(s) have breached SLA. Immediate action required.</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          data-testid="rights-status-filter"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setLoading(true); }}
          className="bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
        >
          <option value="">All Statuses</option>
          {["SUBMITTED","IN_PROGRESS","COMPLETED","ESCALATED","REJECTED"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {requests.map(req => {
          const statusStyle = STATUS_COLORS[req.status] || STATUS_COLORS.SUBMITTED;
          const daysLeft = getDaysRemaining(req.due_date);
          const isOverdue = daysLeft !== null && daysLeft < 0;
          const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft < 7;

          return (
            <div key={req.id} className={`bg-[#161B22] border border-[#30363D] rounded-lg p-5 ${req.sla_breached ? "border-l-4 border-l-[#FF6B6B]" : ""}`} data-testid={`rights-request-${req.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: TYPE_COLORS[req.request_type], background: `${TYPE_COLORS[req.request_type]}15` }}>
                      {req.request_type}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${statusStyle.bg}`} style={{ color: statusStyle.color }}>
                      {req.status?.replace(/_/g, " ")}
                    </span>
                    {req.sla_breached && (
                      <span className="text-xs bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-0.5 rounded font-mono">SLA BREACHED</span>
                    )}
                  </div>
                  <h4 className="text-sm text-[#E6EDF3] mt-2">{req.principal_name}</h4>
                  <p className="text-xs text-[#8B949E] mt-1">{req.description}</p>
                </div>
                <div className="text-right ml-4">
                  {daysLeft !== null && (
                    <div className={`text-xs font-mono px-2 py-1 rounded ${
                      isOverdue ? "bg-[#FF6B6B]/10 text-[#FF6B6B]" : isUrgent ? "bg-[#F79B43]/10 text-[#F79B43]" : "bg-[#3DDC97]/10 text-[#3DDC97]"
                    }`}>
                      <Clock size={12} className="inline mr-1" />
                      {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </div>
                  )}
                  {req.status === "SUBMITTED" && (
                    <button
                      onClick={() => handleStatusUpdate(req.id, "IN_PROGRESS")}
                      className="mt-2 text-xs text-[#58A6FF] hover:underline flex items-center gap-1"
                      data-testid={`start-request-${req.id}`}
                    >
                      Start Processing <ArrowRight size={12} />
                    </button>
                  )}
                  {req.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusUpdate(req.id, "COMPLETED")}
                      className="mt-2 text-xs text-[#3DDC97] hover:underline flex items-center gap-1"
                      data-testid={`complete-request-${req.id}`}
                    >
                      Mark Complete <CheckCircle2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
