import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Database, Server, HardDrive, Cloud, Plus, RefreshCw, CheckCircle2, XCircle, MinusCircle, Scan, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SOURCE_ICONS = {
  ORACLE: Server, POSTGRESQL: Database, MSSQL: Server, MYSQL: Database,
  S3: Cloud, MAINFRAME: HardDrive, CSV_UPLOAD: HardDrive, SAP: Server,
  SHAREPOINT: Cloud, DEFAULT: Database,
};

const STATUS_STYLES = {
  CONNECTED: { icon: CheckCircle2, color: "#3DDC97", bg: "bg-[#3DDC97]/10" },
  FAILED: { icon: XCircle, color: "#FF6B6B", bg: "bg-[#FF6B6B]/10" },
  UNTESTED: { icon: MinusCircle, color: "#8B949E", bg: "bg-[#8B949E]/10" },
};

export default function DataSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testing, setTesting] = useState(null);
  const [scanning, setScanning] = useState(null);
  const [scanJob, setScanJob] = useState(null);
  const [form, setForm] = useState({ name: "", source_type: "POSTGRESQL", host: "", port: 5432, database_name: "", username: "" });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const { data } = await api.get("/sources");
      setSources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/sources", form);
      setDialogOpen(false);
      setForm({ name: "", source_type: "POSTGRESQL", host: "", port: 5432, database_name: "", username: "" });
      loadSources();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTest = async (id) => {
    setTesting(id);
    try {
      await api.post(`/sources/${id}/test`);
      loadSources();
    } catch (err) {
      console.error(err);
    } finally {
      setTesting(null);
    }
  };

  const handleScan = async (id) => {
    setScanning(id);
    try {
      const { data } = await api.post("/scan/start", { source_id: id, job_type: "FULL" });
      setScanJob(data);
      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const { data: job } = await api.get(`/scan/jobs/${data.id}`);
          setScanJob(job);
          if (job.status === "COMPLETED" || job.status === "FAILED") {
            clearInterval(pollInterval);
            setScanning(null);
            loadSources();
          }
        } catch {
          clearInterval(pollInterval);
          setScanning(null);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setScanning(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="data-sources-page">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Data Sources</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button data-testid="add-source-btn" className="bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2">
              <Plus size={16} /> Add Source
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#161B22] border-[#30363D] text-[#E6EDF3] max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">Add Data Source</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Source Name</label>
                <input data-testid="source-name-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none" required />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Type</label>
                <select data-testid="source-type-select" value={form.source_type} onChange={(e) => setForm({...form, source_type: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none">
                  {["POSTGRESQL","MYSQL","MSSQL","ORACLE","CSV_UPLOAD","S3","SAP","SHAREPOINT","MAINFRAME"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Host</label>
                  <input value={form.host} onChange={(e) => setForm({...form, host: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Port</label>
                  <input type="number" value={form.port} onChange={(e) => setForm({...form, port: parseInt(e.target.value) || 0})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wider mb-1.5 block">Database Name</label>
                <input value={form.database_name} onChange={(e) => setForm({...form, database_name: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-[#E6EDF3] focus:border-[#58A6FF] focus:outline-none" />
              </div>
              <button data-testid="save-source-btn" type="submit" className="w-full bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] font-semibold py-2 rounded-md transition-colors text-sm">
                Save & Add
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sources.map((src) => {
          const Icon = SOURCE_ICONS[src.source_type] || SOURCE_ICONS.DEFAULT;
          const status = STATUS_STYLES[src.connection_status] || STATUS_STYLES.UNTESTED;
          const StatusIcon = status.icon;
          return (
            <div key={src.id} className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 hover:border-[#8B949E] transition-all duration-150" data-testid={`source-row-${src.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-[#1C2333] rounded-md">
                    <Icon size={20} className="text-[#58A6FF]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#E6EDF3]">{src.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#8B949E] font-mono">{src.source_type}</span>
                      {src.host && <span className="text-xs text-[#8B949E]">{src.host}</span>}
                      {src.database_name && <span className="text-xs text-[#8B949E]">{src.database_name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#8B949E]">{src.asset_count || 0} assets</span>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${status.bg}`}>
                    <StatusIcon size={14} style={{ color: status.color }} />
                    <span className="text-xs font-mono" style={{ color: status.color }}>{src.connection_status}</span>
                  </div>
                  <button
                    onClick={() => handleScan(src.id)}
                    disabled={scanning === src.id}
                    data-testid={`scan-source-${src.id}`}
                    className="flex items-center gap-1.5 text-xs bg-[#3DDC97]/10 text-[#3DDC97] hover:bg-[#3DDC97]/20 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    {scanning === src.id ? <Loader2 size={14} className="animate-spin" /> : <Scan size={14} />}
                    {scanning === src.id ? "Scanning..." : "AI Scan"}
                  </button>
                  <button
                    onClick={() => handleTest(src.id)}
                    disabled={testing === src.id}
                    data-testid={`test-source-${src.id}`}
                    className="text-[#8B949E] hover:text-[#58A6FF] transition-colors p-1.5"
                  >
                    <RefreshCw size={16} className={testing === src.id ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scan Progress Banner */}
      {scanJob && (scanJob.status === "QUEUED" || scanJob.status === "RUNNING") && (
        <div className="bg-[#161B22] border border-[#58A6FF]/30 rounded-lg p-4" data-testid="scan-progress-banner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-[#58A6FF] animate-spin" />
              <span className="text-sm text-[#E6EDF3]">AI Scan in Progress</span>
            </div>
            <span className="text-xs font-mono text-[#58A6FF]">{scanJob.progress_percent}%</span>
          </div>
          <div className="w-full h-2 bg-[#30363D] rounded-full overflow-hidden">
            <div className="h-full bg-[#58A6FF] rounded-full transition-all duration-300" style={{ width: `${scanJob.progress_percent}%` }} />
          </div>
          {scanJob.current_asset && (
            <p className="text-xs text-[#8B949E] mt-2 font-mono">Processing: {scanJob.current_asset}</p>
          )}
          <p className="text-xs text-[#8B949E] mt-1">
            Assets: {scanJob.assets_scanned} | Columns: {scanJob.columns_classified} | Flags: {scanJob.risk_flags_created}
          </p>
        </div>
      )}
      {scanJob && scanJob.status === "COMPLETED" && (
        <div className="bg-[#3DDC97]/5 border border-[#3DDC97]/30 rounded-lg p-4" data-testid="scan-complete-banner">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#3DDC97]" />
            <span className="text-sm text-[#3DDC97]">Scan Complete</span>
          </div>
          <p className="text-xs text-[#8B949E] mt-1">
            Scanned {scanJob.assets_scanned} assets, classified {scanJob.columns_classified} columns, found {scanJob.risk_flags_created} new risk flags
          </p>
        </div>
      )}
    </div>
  );
}
