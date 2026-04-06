import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { FileText, Plus, Download, Loader2, Clock, FileCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const REPORT_TYPES = [
  { value: "MONTHLY", label: "Monthly Report" },
  { value: "QUARTERLY", label: "Quarterly Report" },
  { value: "ANNUAL", label: "Annual Report" },
  { value: "INCIDENT", label: "Incident Report" },
  { value: "DPIA", label: "DPIA Assessment" },
  { value: "CUSTOM", label: "Custom Report" },
];

const TYPE_COLORS = {
  MONTHLY: "#58A6FF",
  QUARTERLY: "#3DDC97",
  ANNUAL: "#BC8CFF",
  INCIDENT: "#FF6B6B",
  DPIA: "#F79B43",
  CUSTOM: "#8B949E",
};

export default function AuditReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("MONTHLY");
  const [reportTitle, setReportTitle] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const { data } = await api.get("/compliance/reports");
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/compliance/reports", {
        report_type: reportType,
        title: reportTitle || null,
      });
      setDialogOpen(false);
      setReportTitle("");
      setReports(prev => [data, ...prev]);
      setSelectedReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (reportId) => {
    setDownloading(reportId);
    try {
      const response = await api.get(`/compliance/reports/${reportId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `kavach_report_${reportId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="audit-reports-page">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Audit Reports</h1>
        <div className="flex items-center gap-2">
          {selectedReport && (
            <button
              onClick={() => setSelectedReport(null)}
              className="text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
              data-testid="back-to-reports-btn"
            >
              &larr; All Reports
            </button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button data-testid="generate-report-btn" className="bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2">
                <Plus size={16} /> Generate Report
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#161B22] border-[#30363D] text-[#E6EDF3] max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Outfit']">Generate Compliance Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-2 block">Report Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {REPORT_TYPES.map(rt => (
                      <button
                        key={rt.value}
                        onClick={() => setReportType(rt.value)}
                        className={`p-3 rounded-md border text-left transition-colors text-sm ${
                          reportType === rt.value
                            ? "border-[#58A6FF] bg-[#58A6FF]/5 text-[#E6EDF3]"
                            : "border-[#30363D] text-[#8B949E] hover:border-[#8B949E]"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full mb-1.5" style={{ background: TYPE_COLORS[rt.value] }} />
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Custom Title (Optional)</label>
                  <input
                    data-testid="report-title-input"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 focus:border-[#58A6FF] focus:outline-none"
                  />
                </div>
                <div className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                  <p className="text-xs text-[#8B949E]">AI will analyze current compliance data and generate an executive summary with actionable recommendations.</p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  data-testid="confirm-generate-btn"
                  className="w-full bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold py-2.5 rounded-md transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? <><Loader2 size={16} className="animate-spin" /> Generating with AI...</> : <><FileText size={16} /> Generate Report</>}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedReport ? (
        /* Reports List */
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-8 text-center">
              <FileText size={32} className="text-[#8B949E] mx-auto mb-3" />
              <p className="text-sm text-[#8B949E]">No reports generated yet. Click "Generate Report" to create your first compliance report.</p>
            </div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                className="bg-[#161B22] border border-[#30363D] border-l-4 rounded-r-lg p-5 hover:border-[#8B949E] transition-all duration-150 cursor-pointer"
                style={{ borderLeftColor: TYPE_COLORS[report.report_type] || "#8B949E" }}
                data-testid={`report-card-${report.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => setSelectedReport(report)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: TYPE_COLORS[report.report_type], background: `${TYPE_COLORS[report.report_type]}15` }}>
                        {report.report_type}
                      </span>
                      <span className="text-xs text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded">{report.status}</span>
                    </div>
                    <h3 className="text-sm font-medium text-[#E6EDF3] mt-2">{report.title}</h3>
                    <p className="text-xs text-[#8B949E] mt-1 line-clamp-2">{report.ai_summary}</p>
                    <p className="text-xs text-[#8B949E] mt-2 font-mono">Generated: {report.generated_at ? new Date(report.generated_at).toLocaleDateString("en-IN") : "—"}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(report.id); }}
                    disabled={downloading === report.id}
                    data-testid={`download-pdf-${report.id}`}
                    className="ml-4 shrink-0 flex items-center gap-1.5 text-xs bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20 px-3 py-1.5 rounded transition-colors"
                  >
                    {downloading === report.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Report Detail */
        <div className="space-y-4" data-testid="report-detail">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: TYPE_COLORS[selectedReport.report_type], background: `${TYPE_COLORS[selectedReport.report_type]}15` }}>
                    {selectedReport.report_type}
                  </span>
                  <span className="text-xs text-[#8B949E] font-mono">{selectedReport.generated_at ? new Date(selectedReport.generated_at).toLocaleDateString("en-IN") : ""}</span>
                </div>
                <h2 className="text-lg font-medium text-[#E6EDF3] font-['Outfit']">{selectedReport.title}</h2>
              </div>
              <button
                onClick={() => handleDownloadPDF(selectedReport.id)}
                disabled={downloading === selectedReport.id}
                data-testid="download-detail-pdf-btn"
                className="flex items-center gap-2 bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold px-4 py-2 rounded-md transition-colors text-sm"
              >
                {downloading === selectedReport.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Download PDF
              </button>
            </div>

            {/* Score Overview */}
            {selectedReport.report_data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Score</p>
                  <p className="text-xl font-mono font-semibold text-[#58A6FF]">{selectedReport.report_data.score}/100</p>
                </div>
                <div className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Open Flags</p>
                  <p className="text-xl font-mono font-semibold text-[#FF6B6B]">{selectedReport.report_data.open_flags}</p>
                </div>
                <div className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Assets</p>
                  <p className="text-xl font-mono font-semibold text-[#3DDC97]">{selectedReport.report_data.assets_scanned}</p>
                </div>
                <div className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">Vendors</p>
                  <p className="text-xl font-mono font-semibold text-[#F79B43]">{selectedReport.report_data.vendors_total}</p>
                </div>
              </div>
            )}

            {/* Module Scores */}
            {selectedReport.report_data?.module_scores && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#E6EDF3] mb-3">Module Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(selectedReport.report_data.module_scores).map(([key, value]) => (
                    <div key={key} className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-1">{key.replace(/_/g, " ")}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono font-semibold" style={{ color: value >= 70 ? "#3DDC97" : value >= 50 ? "#F79B43" : "#FF6B6B" }}>{value}</p>
                        <div className="flex-1 h-1.5 bg-[#30363D] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${value}%`, background: value >= 70 ? "#3DDC97" : value >= 50 ? "#F79B43" : "#FF6B6B" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {selectedReport.ai_summary && (
              <div>
                <h4 className="text-sm font-semibold text-[#E6EDF3] mb-3">AI Executive Summary</h4>
                <div className="bg-[#0D1117] border border-[#30363D]/50 rounded-md p-4">
                  <p className="text-sm text-[#E6EDF3] leading-relaxed whitespace-pre-wrap">{selectedReport.ai_summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
