import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Scale, TrendingUp, AlertTriangle, MessageSquare, Send } from "lucide-react";
import { ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

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

function ScoreCard({ label, score, color }) {
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-wider text-[#8B949E] mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold font-mono" style={{ color }}>{score}</span>
        <span className="text-xs text-[#8B949E] mb-1">/100</span>
      </div>
      <div className="w-full h-1.5 bg-[#30363D] rounded-full mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ComplianceScore() {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/compliance/score");
        setScore(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const { data } = await api.post("/compliance/dpo-copilot", { message: userMsg });
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Failed to get response. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#8B949E] font-mono text-sm animate-pulse">LOADING...</p></div>;

  const getColor = (s) => s >= 75 ? "#3DDC97" : s >= 50 ? "#F79B43" : "#FF6B6B";

  const modules = [
    { label: "Data Discovery", score: score?.data_discovery_score || 0 },
    { label: "Consent Management", score: score?.consent_score || 0 },
    { label: "Rights Management", score: score?.rights_score || 0 },
    { label: "Breach Readiness", score: score?.breach_readiness_score || 0 },
    { label: "Vendor Management", score: score?.vendor_score || 0 },
    { label: "Children Protection", score: score?.children_protection_score || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="compliance-score-page">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#E6EDF3] font-['Outfit']">Compliance Intelligence</h1>
        <button
          onClick={() => setShowChat(!showChat)}
          data-testid="toggle-copilot-btn"
          className="bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20 px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors"
        >
          <MessageSquare size={16} /> DPO Copilot
        </button>
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 flex flex-col items-center justify-center" data-testid="overall-score-card">
          <p className="text-xs text-[#8B949E] uppercase tracking-wider mb-4">Overall DPDPA Score</p>
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="65" fill="none" stroke="#30363D" strokeWidth="10" />
              <circle cx="80" cy="80" r="65" fill="none" stroke={getColor(score?.overall_score || 0)} strokeWidth="10"
                strokeDasharray={`${(score?.overall_score || 0) / 100 * 408.4} 408.4`}
                strokeLinecap="round" transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dasharray 1s ease-out' }}
              />
              <text x="80" y="75" textAnchor="middle" fill={getColor(score?.overall_score || 0)} fontSize="36" fontWeight="600" className="font-mono">
                {score?.overall_score || 0}
              </text>
              <text x="80" y="95" textAnchor="middle" fill="#8B949E" fontSize="11">of 100</text>
            </svg>
          </div>
          <p className="text-sm mt-2" style={{ color: getColor(score?.overall_score || 0) }}>
            {score?.overall_score >= 75 ? "Compliant" : score?.overall_score >= 50 ? "Needs Improvement" : "At Risk"}
          </p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          {modules.map(m => (
            <ScoreCard key={m.label} label={m.label} score={m.score} color={getColor(m.score)} />
          ))}
        </div>
      </div>

      {/* Score Trend */}
      {score?.score_history && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="score-trend">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={score.score_history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="month" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#58A6FF" strokeWidth={2} dot={{ fill: "#58A6FF", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommendations */}
      {score?.recommendations && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5" data-testid="recommendations">
          <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">What's Dragging Your Score Down</h3>
          <div className="space-y-2">
            {score.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#0D1117] rounded-md border border-[#30363D]/50">
                <AlertTriangle size={14} className={rec.priority === "CRITICAL" ? "text-[#FF6B6B]" : rec.priority === "HIGH" ? "text-[#F79B43]" : "text-[#BC8CFF]"} />
                <div>
                  <p className="text-sm text-[#E6EDF3]">{rec.text}</p>
                  <p className="text-xs text-[#8B949E] mt-0.5">{rec.module} &middot; {rec.priority}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DPO Copilot Chat */}
      {showChat && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden" data-testid="dpo-copilot-chat">
          <div className="p-4 border-b border-[#30363D] flex items-center gap-2">
            <MessageSquare size={16} className="text-[#58A6FF]" />
            <h3 className="text-sm font-semibold text-[#E6EDF3]">DPO Copilot</h3>
            <span className="text-xs text-[#8B949E] ml-auto">Powered by AI</span>
          </div>
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[#8B949E]">Ask me anything about DPDPA 2023 compliance</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {["What sections apply to children's data?", "What's our biggest compliance gap?", "How to handle erasure requests?"].map(q => (
                    <button key={q} onClick={() => { setChatInput(q); }} className="text-xs bg-[#1C2333] text-[#8B949E] hover:text-[#E6EDF3] px-3 py-1.5 rounded-md transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.role === "user" ? "bg-[#58A6FF]/10 text-[#E6EDF3]" : "bg-[#1C2333] text-[#E6EDF3]"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1C2333] rounded-lg px-4 py-2.5 text-sm text-[#8B949E] animate-pulse">Thinking...</div>
              </div>
            )}
          </div>
          <form onSubmit={handleChat} className="p-4 border-t border-[#30363D] flex gap-2">
            <input
              data-testid="copilot-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about DPDPA compliance..."
              className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-md px-4 py-2 text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 focus:border-[#58A6FF] focus:outline-none"
            />
            <button data-testid="copilot-send-btn" type="submit" disabled={chatLoading} className="bg-[#58A6FF] hover:bg-[#408BE0] text-[#0D1117] px-4 py-2 rounded-md transition-colors disabled:opacity-50">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
