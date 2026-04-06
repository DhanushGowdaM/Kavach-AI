import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, XCircle, Siren, Eye } from "lucide-react";

const SEVERITY_BADGE = {
  CRITICAL: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/30",
  HIGH: "bg-[#F79B43]/10 text-[#F79B43] border-[#F79B43]/30",
  MEDIUM: "bg-[#BC8CFF]/10 text-[#BC8CFF] border-[#BC8CFF]/30",
  LOW: "bg-[#3DDC97]/10 text-[#3DDC97] border-[#3DDC97]/30",
};

const STATUS_STYLES = {
  DETECTED: { color: "#FF6B6B", bg: "bg-[#FF6B6B]/10" },
  INVESTIGATING: { color: "#F79B43", bg: "bg-[#F79B43]/10" },
  CONTAINED: { color: "#BC8CFF", bg: "bg-[#BC8CFF]/10" },
  NOTIFIED: { color: "#58A6FF", bg: "bg-[#58A6FF]/10" },
  RESOLVED: { color: "#3DDC97", bg: "bg-[#3DDC97]/10" },
  CLOSED: { color: "#8B949E", bg: "bg-[#8B949E]/10" },
};

function CountdownClock({ deadline }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const dl = new Date(deadline);
      const diff = dl - now;
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        setIsExpired(true);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      setIsExpired(hours < 6);
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [deadline]);

  return (
    <div className={`font-mono text-sm px-3 py-1.5 rounded ${isExpired ? "bg-[#FF6B6B]/10 text-[#FF6B6B] animate-pulse-glow" : "bg-[#1C2333] text-[#F79B43]"}`} data-testid="countdown-clock">
      <Clock size={14} className="inline mr-1.5" />
      {timeLeft}
    </div>
  );
}

export default function BreachSentinel() {
  const [events, setEvents] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("events");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [e, a] = await Promise.all([
          api.get("/breach/events"),
          api.get("/breach/anomalies"),
        ]);
        setEvents(e.data);
        setAnomalies(a.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  const activeBreaches = events.filter(e => !["RESOLVED", "CLOSED"].includes(e.status));
  const hasCritical = activeBreaches.some(e => e.severity === "CRITICAL");

  return (
    <div className="space-y-6 animate-fade-in" data-testid="breach-sentinel-page">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Breach Sentinel</h1>
        <div className="flex items-center gap-2">
          {["events", "anomalies"].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedEvent(null); }}
              data-testid={`breach-tab-${t}`}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${tab === t ? "bg-[#58A6FF]/10 text-[#58A6FF]" : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2333]"}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Banner */}
      {hasCritical && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg p-4 flex items-center gap-3 animate-pulse-glow" data-testid="critical-alert-banner">
          <Siren size={20} className="text-[#FF6B6B]" />
          <div>
            <p className="text-sm font-medium text-[#FF6B6B]">Active Critical Breach</p>
            <p className="text-xs text-[#8B949E]">{activeBreaches.filter(e => e.severity === "CRITICAL").length} critical breach(es) require immediate attention</p>
          </div>
        </div>
      )}

      {tab === "events" && !selectedEvent && (
        <div className="space-y-3">
          {events.map(event => {
            const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.DETECTED;
            const needsNotification = event.dpbi_notification_deadline && !event.dpbi_notified_at;
            return (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`bg-[#161B22] border border-[#30363D] border-l-4 rounded-r-lg p-5 hover:border-[#8B949E] transition-all duration-150 cursor-pointer ${
                  event.severity === "CRITICAL" ? "border-l-[#FF6B6B]" : event.severity === "HIGH" ? "border-l-[#F79B43]" : "border-l-[#BC8CFF]"
                }`}
                data-testid={`breach-event-${event.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <ShieldAlert size={16} style={{ color: event.severity === "CRITICAL" ? "#FF6B6B" : "#F79B43" }} />
                      <h3 className="text-sm font-medium text-[#E6EDF3]">{event.title}</h3>
                    </div>
                    <p className="text-xs text-[#8B949E] ml-7 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-3 mt-3 ml-7">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${SEVERITY_BADGE[event.severity]}`}>{event.severity}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${statusStyle.bg}`} style={{ color: statusStyle.color }}>{event.status}</span>
                      <span className="text-xs text-[#8B949E]">{event.breach_type?.replace(/_/g, " ")}</span>
                      {event.affected_principals_count > 0 && (
                        <span className="text-xs text-[#8B949E]">{event.affected_principals_count.toLocaleString()} affected</span>
                      )}
                    </div>
                  </div>
                  {needsNotification && (
                    <CountdownClock deadline={event.dpbi_notification_deadline} />
                  )}
                  {event.dpbi_notified_at && (
                    <div className="bg-[#3DDC97]/10 text-[#3DDC97] px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> DPBI Notified
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "events" && selectedEvent && (
        <div className="space-y-4" data-testid="breach-event-detail">
          <button onClick={() => setSelectedEvent(null)} className="text-[#8B949E] hover:text-[#E6EDF3] text-sm transition-colors" data-testid="back-to-events">
            &larr; Back to events
          </button>

          <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-[#E6EDF3] font-['Outfit']">{selectedEvent.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${SEVERITY_BADGE[selectedEvent.severity]}`}>{selectedEvent.severity}</span>
                  <span className="text-xs text-[#8B949E]">{selectedEvent.breach_type?.replace(/_/g, " ")}</span>
                </div>
              </div>
              {selectedEvent.dpbi_notification_deadline && !selectedEvent.dpbi_notified_at && (
                <div>
                  <p className="text-[10px] text-[#8B949E] uppercase tracking-wider mb-1">72hr DPBI Deadline</p>
                  <CountdownClock deadline={selectedEvent.dpbi_notification_deadline} />
                </div>
              )}
            </div>

            <p className="text-sm text-[#8B949E] mb-6">{selectedEvent.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Status", value: selectedEvent.status },
                { label: "Affected Principals", value: selectedEvent.affected_principals_count?.toLocaleString() || "0" },
                { label: "Detected", value: selectedEvent.detected_at ? new Date(selectedEvent.detected_at).toLocaleDateString("en-IN") : "—" },
                { label: "DPBI Ref", value: selectedEvent.dpbi_reference_number || "Pending" },
              ].map(m => (
                <div key={m.label} className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">{m.label}</p>
                  <p className="text-sm text-[#E6EDF3] font-mono">{m.value}</p>
                </div>
              ))}
            </div>

            {selectedEvent.data_categories_affected?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-2">Data Categories Affected</p>
                <div className="flex gap-2">
                  {selectedEvent.data_categories_affected.map(cat => (
                    <span key={cat} className="text-xs bg-[#1C2333] text-[#E6EDF3] px-2 py-1 rounded">{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "anomalies" && (
        <div className="space-y-3" data-testid="anomalies-list">
          {anomalies.length === 0 ? (
            <p className="text-sm text-[#8B949E] text-center py-8">No anomalies detected</p>
          ) : (
            anomalies.map(a => (
              <div key={a.id} className={`bg-[#161B22] border border-[#30363D] border-l-4 rounded-r-lg p-4 ${
                a.severity === "CRITICAL" ? "border-l-[#FF6B6B]" : a.severity === "HIGH" ? "border-l-[#F79B43]" : "border-l-[#BC8CFF]"
              }`} data-testid={`anomaly-${a.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} style={{ color: a.severity === "CRITICAL" ? "#FF6B6B" : a.severity === "HIGH" ? "#F79B43" : "#BC8CFF" }} className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-[#E6EDF3]">{a.anomaly_type?.replace(/_/g, " ")}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono border ${SEVERITY_BADGE[a.severity]}`}>{a.severity}</span>
                      </div>
                      <p className="text-xs text-[#8B949E] mt-1">{a.description}</p>
                      <p className="text-xs text-[#8B949E] mt-2 font-mono">
                        {a.detected_at ? new Date(a.detected_at).toLocaleString("en-IN") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.escalated_to_breach && (
                      <span className="text-xs bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-0.5 rounded">Escalated</span>
                    )}
                    {a.is_false_positive && (
                      <span className="text-xs bg-[#8B949E]/10 text-[#8B949E] px-2 py-0.5 rounded">False Positive</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
