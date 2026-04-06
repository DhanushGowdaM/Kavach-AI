import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Baby, ShieldCheck, ShieldAlert, Clock, XCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const VERIFICATION_BADGE = {
  VERIFIED: { color: "#3DDC97", bg: "bg-[#3DDC97]/10", icon: CheckCircle2, label: "Verified" },
  PENDING: { color: "#F79B43", bg: "bg-[#F79B43]/10", icon: Clock, label: "Pending" },
  FAILED: { color: "#FF6B6B", bg: "bg-[#FF6B6B]/10", icon: XCircle, label: "Failed" },
  EXPIRED: { color: "#8B949E", bg: "bg-[#8B949E]/10", icon: Clock, label: "Expired" },
};

export default function ChildrenShield() {
  const [dashboard, setDashboard] = useState(null);
  const [records, setRecords] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [verifyDialog, setVerifyDialog] = useState(null);
  const [verifyMethod, setVerifyMethod] = useState("DIGILOCKER");
  const [verifying, setVerifying] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [d, r, v] = await Promise.all([
        api.get("/children/dashboard"),
        api.get("/children/records"),
        api.get("/children/verifications"),
      ]);
      setDashboard(d.data);
      setRecords(r.data);
      setVerifications(v.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyDialog) return;
    setVerifying(true);
    try {
      await api.post("/children/verify-digilocker", {
        child_record_id: verifyDialog.id,
        verification_method: verifyMethod,
      });
      setVerifyDialog(null);
      // Poll for result
      setTimeout(() => loadData(), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  const filteredRecords = filter ? records.filter(r => r.verification_status === filter) : records;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="children-shield-page">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Children's Data Shield</h1>
        <div className="flex items-center gap-2">
          {["dashboard", "records", "verifications"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`children-tab-${t}`}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${tab === t ? "bg-[#F778BA]/10 text-[#F778BA]" : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2333]"}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* DPDPA Section 9 Notice */}
      <div className="bg-[#F778BA]/5 border border-[#F778BA]/20 rounded-lg p-4 flex items-start gap-3" data-testid="section9-notice">
        <Baby size={20} className="text-[#F778BA] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[#E6EDF3] font-medium">DPDPA 2023 - Section 9: Processing of Children's Data</p>
          <p className="text-xs text-[#8B949E] mt-1">Verifiable parental consent required before processing any personal data of children under 18. Data must be blocked until guardian verification is complete.</p>
        </div>
      </div>

      {tab === "dashboard" && dashboard && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Minors", value: dashboard.total_minors, color: "#F778BA", icon: Baby },
              { label: "Verified", value: dashboard.verified, color: "#3DDC97", icon: CheckCircle2 },
              { label: "Pending", value: dashboard.pending, color: "#F79B43", icon: Clock },
              { label: "Failed", value: dashboard.failed, color: "#FF6B6B", icon: XCircle },
              { label: "Expired", value: dashboard.expired, color: "#8B949E", icon: Clock },
              { label: "Data Blocked", value: dashboard.data_blocked, color: "#FF6B6B", icon: ShieldAlert },
            ].map(s => (
              <div key={s.label} className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid={`child-stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <s.icon size={14} style={{ color: s.color }} />
                  <span className="text-[10px] uppercase tracking-wider text-[#8B949E]">{s.label}</span>
                </div>
                <p className="text-xl font-semibold font-mono" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Verification Progress */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="verification-progress">
            <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Consent Verification Progress</h3>
            <div className="w-full h-3 bg-[#30363D] rounded-full overflow-hidden">
              {dashboard.total_minors > 0 && (
                <div className="h-full bg-[#3DDC97] rounded-full transition-all duration-500"
                  style={{ width: `${(dashboard.verified / dashboard.total_minors) * 100}%` }} />
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#8B949E]">{dashboard.verified} of {dashboard.total_minors} verified</span>
              <span className="text-xs font-mono text-[#3DDC97]">{dashboard.total_minors > 0 ? Math.round((dashboard.verified / dashboard.total_minors) * 100) : 0}%</span>
            </div>
          </div>

          {/* Unverified requiring action */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Requiring Immediate Action</h3>
            <div className="space-y-2">
              {records.filter(r => r.verification_status !== "VERIFIED").map(r => (
                <div key={r.id} className="flex items-center justify-between bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <Baby size={14} className="text-[#F778BA]" />
                    <div>
                      <p className="text-sm text-[#E6EDF3]">{r.principal_name}</p>
                      <p className="text-xs text-[#8B949E]">Age: {r.age} | Guardian: {r.guardian_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.data_blocked && <span className="text-[10px] bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-0.5 rounded">BLOCKED</span>}
                    <button
                      onClick={() => { setVerifyDialog(r); setTab("records"); }}
                      className="text-xs text-[#F778BA] hover:underline"
                      data-testid={`verify-action-${r.id}`}
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "records" && (
        <>
          <div className="flex items-center gap-3">
            <select
              data-testid="child-status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredRecords.map(record => {
              const vBadge = VERIFICATION_BADGE[record.verification_status] || VERIFICATION_BADGE.PENDING;
              const VIcon = vBadge.icon;
              return (
                <div key={record.id} className={`bg-[#161B22] border border-[#30363D] border-l-4 rounded-r-lg p-5 ${
                  record.data_blocked ? "border-l-[#FF6B6B]" : "border-l-[#3DDC97]"
                }`} data-testid={`child-record-${record.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Baby size={18} className="text-[#F778BA] mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-[#E6EDF3]">{record.principal_name}</h4>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <span className="text-xs text-[#8B949E]">Age: {record.age}</span>
                          <span className="text-xs text-[#8B949E]">DOB: {record.date_of_birth}</span>
                          <span className="text-xs text-[#8B949E]">Account: {record.account_number}</span>
                          <span className="text-xs text-[#8B949E]">Type: {record.account_type}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-[#8B949E]">Guardian: {record.guardian_name}</span>
                          <span className="text-xs text-[#8B949E]">{record.guardian_email}</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {record.data_sources?.map(ds => (
                            <span key={ds} className="text-[10px] bg-[#1C2333] text-[#8B949E] px-1.5 py-0.5 rounded font-mono">{ds}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${vBadge.bg}`}>
                        <VIcon size={14} style={{ color: vBadge.color }} />
                        <span className="text-xs font-mono" style={{ color: vBadge.color }}>{vBadge.label}</span>
                      </div>
                      {record.data_blocked && (
                        <span className="text-[10px] bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-0.5 rounded border border-[#FF6B6B]/30">DATA BLOCKED</span>
                      )}
                      {record.verification_status !== "VERIFIED" && (
                        <button
                          onClick={() => setVerifyDialog(record)}
                          className="text-xs bg-[#F778BA]/10 text-[#F778BA] hover:bg-[#F778BA]/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                          data-testid={`initiate-verify-${record.id}`}
                        >
                          <Send size={12} /> Verify Guardian
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verify Dialog */}
          <Dialog open={!!verifyDialog} onOpenChange={() => setVerifyDialog(null)}>
            <DialogContent className="bg-[#161B22] border-[#30363D] text-[#E6EDF3] max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Outfit'] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#F778BA]" /> Initiate Guardian Verification
                </DialogTitle>
              </DialogHeader>
              {verifyDialog && (
                <div className="space-y-4 mt-4">
                  <div className="bg-[#0D1117] rounded-md p-3 border border-[#30363D]/50">
                    <p className="text-sm text-[#E6EDF3]">Child: <span className="font-mono">{verifyDialog.principal_name}</span> (Age: {verifyDialog.age})</p>
                    <p className="text-sm text-[#8B949E] mt-1">Guardian: {verifyDialog.guardian_name}</p>
                    <p className="text-xs text-[#8B949E] mt-1">{verifyDialog.guardian_email} | {verifyDialog.guardian_phone}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-2 block">Verification Method</label>
                    <div className="space-y-2">
                      {[
                        { value: "DIGILOCKER", label: "DigiLocker", desc: "Verify via DigiLocker age verification API" },
                        { value: "AADHAAR_OTP", label: "Aadhaar OTP", desc: "Send OTP to guardian's Aadhaar-linked mobile" },
                        { value: "MANUAL", label: "Manual Verification", desc: "Upload guardian's ID proof for manual review" },
                      ].map(m => (
                        <label key={m.value} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          verifyMethod === m.value ? "border-[#F778BA] bg-[#F778BA]/5" : "border-[#30363D] hover:border-[#8B949E]"
                        }`}>
                          <input
                            type="radio"
                            name="verifyMethod"
                            value={m.value}
                            checked={verifyMethod === m.value}
                            onChange={() => setVerifyMethod(m.value)}
                            className="mt-0.5 accent-[#F778BA]"
                          />
                          <div>
                            <p className="text-sm text-[#E6EDF3]">{m.label}</p>
                            <p className="text-xs text-[#8B949E]">{m.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    data-testid="confirm-verify-btn"
                    className="w-full bg-[#F778BA] hover:bg-[#e065a5] text-[#0D1117] font-semibold py-2.5 rounded-md transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifying ? <><Loader2 size={16} className="animate-spin" /> Initiating...</> : <><ShieldCheck size={16} /> Start Verification</>}
                  </button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      {tab === "verifications" && (
        <div className="space-y-3" data-testid="verifications-list">
          {verifications.length === 0 ? (
            <p className="text-sm text-[#8B949E] text-center py-8">No verifications yet</p>
          ) : (
            verifications.map(v => {
              const vBadge = VERIFICATION_BADGE[v.status] || VERIFICATION_BADGE.PENDING;
              const VIcon = vBadge.icon;
              return (
                <div key={v.id} className="bg-[#161B22] border border-[#30363D] rounded-lg p-4" data-testid={`verification-${v.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm text-[#E6EDF3]">{v.child_name}</h4>
                        <span className="text-xs text-[#8B949E]">via {v.verification_method}</span>
                      </div>
                      <p className="text-xs text-[#8B949E] mt-1">Guardian: {v.guardian_name}</p>
                      {v.failure_reason && <p className="text-xs text-[#FF6B6B] mt-1">{v.failure_reason}</p>}
                      <p className="text-xs text-[#8B949E] mt-1 font-mono">Initiated: {v.initiated_at ? new Date(v.initiated_at).toLocaleString("en-IN") : "—"}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${vBadge.bg}`}>
                      <VIcon size={14} style={{ color: vBadge.color }} />
                      <span className="text-xs font-mono" style={{ color: vBadge.color }}>{v.status}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
