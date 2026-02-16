import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../supabase/client";
import { Header } from "../components/layout/Header";
import { AiConsultation } from "../components/AIConsultation";
import {
  analyzeHealth, calculateSleepScore, generateAccessKey,
  type HealthAnalysisResult,
} from "../lib/aiHealthEngine";
import { symptoms, sleepQualityOptions, mockDoctors } from "../lib/mockData";
import {
  Activity, Heart, Moon, Brain, AlertTriangle, Shield,
  Clock, Plus, Mic, MicOff, Copy, CheckCircle2, ArrowRight,
  Sparkles, Stethoscope, Zap, ChevronRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../components/ui/dialog";
import { format } from "date-fns";

interface HealthLog {
  id: string; symptoms: string[]; severity: number | null;
  notes: string | null; created_at: string;
}
interface SleepEntry {
  id: string; hours_slept: number; quality_rating: string;
  sleep_score: number | null; logged_date: string;
}
interface AccessKey {
  id: string; access_key: string; doctor_name: string | null;
  hospital_name: string | null; purpose: string | null;
  is_used: boolean | null; expires_at: string; created_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<HealthAnalysisResult | null>(null);
  const [latestSleepScore, setLatestSleepScore] = useState<number>(70);

  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [accessKeyModalOpen, setAccessKeyModalOpen] = useState(false);
  const [aiInsightModalOpen, setAiInsightModalOpen] = useState(false);

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState(5);
  const [symptomNotes, setSymptomNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<"excellent"|"good"|"average"|"poor">("average");

  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("");
  const [generatedKey, setGeneratedKey] = useState<{ key: string; hash: string } | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user && !profileLoading && profile === null) { navigate("/onboarding"); return; }
    if (user && profile && !profile.onboarding_completed) { navigate("/onboarding"); return; }
    if (user) { fetchHealthLogs(); fetchSleepEntries(); fetchAccessKeys(); }
  }, [user, authLoading, profile, profileLoading, navigate]);

  useEffect(() => { if (profile) runAiAnalysis(); }, [profile, healthLogs, sleepEntries]);

  const fetchHealthLogs = async () => {
    const { data, error } = await supabase.from("health_logs").select("*").order("created_at", { ascending: false }).limit(10);
    if (!error && data) setHealthLogs(data);
  };
  const fetchSleepEntries = async () => {
    const { data, error } = await supabase.from("sleep_entries").select("*").order("logged_date", { ascending: false }).limit(7);
    if (!error && data) { setSleepEntries(data); if (data.length > 0 && data[0].sleep_score) setLatestSleepScore(data[0].sleep_score); }
  };
  const fetchAccessKeys = async () => {
    const { data, error } = await supabase.from("doctor_access_keys").select("*").order("created_at", { ascending: false }).limit(5);
    if (!error && data) setAccessKeys(data);
  };

  const runAiAnalysis = () => {
    if (!profile) return;
    const latestLog = healthLogs[0];
    const avgSleep = sleepEntries.length > 0 ? sleepEntries.reduce((a, s) => a + (s.sleep_score || 70), 0) / sleepEntries.length : 70;
    const analysis = analyzeHealth({
      symptoms: latestLog?.symptoms || [], severity: latestLog?.severity || undefined,
      sleepScore: avgSleep, allergies: profile.allergies || [],
      pastDiagnoses: profile.past_diagnoses || [], age: profile.age || undefined,
      smoking: profile.smoking || false, alcohol: profile.alcohol || false,
      activityLevel: (profile.activity_level as any) || undefined,
    });
    setAiAnalysis(analysis);
  };

  const handleSymptomToggle = (id: string) =>
    setSelectedSymptoms(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const handleLogSymptoms = async () => {
    if (!user || selectedSymptoms.length === 0) return;
    const { error } = await supabase.from("health_logs").insert({ user_id: user.id, symptoms: selectedSymptoms, severity: symptomSeverity, notes: symptomNotes || null });
    if (error) toast({ variant: "destructive", title: "Error", description: "Failed to log symptoms" });
    else { toast({ title: "Symptoms logged ✓" }); setSymptomModalOpen(false); setSelectedSymptoms([]); setSymptomSeverity(5); setSymptomNotes(""); fetchHealthLogs(); }
  };

  const handleLogSleep = async () => {
    if (!user) return;
    const score = calculateSleepScore(sleepHours, sleepQuality);
    const { error } = await supabase.from("sleep_entries").insert({ user_id: user.id, hours_slept: sleepHours, quality_rating: sleepQuality, sleep_score: score });
    if (error) {
      toast({ variant: "destructive", title: error.code === "23505" ? "Already logged today" : "Error", description: error.code === "23505" ? "Sleep already logged." : "Failed to log sleep" });
    } else { toast({ title: `Sleep logged · ${score}/100` }); setSleepModalOpen(false); fetchSleepEntries(); }
  };

  const handleGenerateAccessKey = async () => {
    if (!user) return;
    const { accessKey, keyHash } = generateAccessKey();
    const { error } = await supabase.from("doctor_access_keys").insert({ patient_user_id: user.id, access_key: accessKey, key_hash: keyHash, doctor_name: doctorName || null, hospital_name: hospitalName || null, purpose: visitPurpose || null, expires_at: new Date(Date.now() + 86400000).toISOString() });
    if (error) toast({ variant: "destructive", title: "Error", description: "Failed to generate key" });
    else { setGeneratedKey({ key: accessKey, hash: keyHash }); fetchAccessKeys(); }
  };

  const copyAccessKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setKeyCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => { setSymptomNotes(p => p + " Feeling tired and having headaches."); setIsRecording(false); }, 2000);
    }
  };

  const score = aiAnalysis?.healthRiskScore ?? 0;
  const scoreColor = score >= 70 ? "#f87171" : score >= 40 ? "#fbbf24" : "#34d399";
  const urgencyBg = score >= 70 ? "rgba(248,113,113,0.08)" : score >= 40 ? "rgba(251,191,36,0.08)" : "rgba(52,211,153,0.08)";

  if (authLoading || profileLoading) return (
    <div style={{ minHeight: "100vh", background: "#07090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(56,189,248,0.2)", borderTopColor: "#38bdf8", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#475569", fontSize: 13, fontFamily: "system-ui" }}>Loading your health data...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#07090f", color: "#e2e8f0", fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Global Styles & Font ──────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes wavePulse { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
        .du-btn { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
        .du-btn:hover { transform: translateY(-2px); }
        .du-card { transition: border-color 0.2s, transform 0.2s; }
        .du-card:hover { border-color: rgba(56,189,248,0.25) !important; transform: translateY(-1px); }
        .du-quick:hover { transform: translateY(-3px) !important; filter: brightness(1.08); }
        .du-quick { transition: all 0.22s !important; }
        /* Organic blob bg */
        .du-blob {
          position: fixed; border-radius: 50%; filter: blur(80px);
          pointer-events: none; z-index: 0; animation: pulseGlow 8s ease-in-out infinite;
        }
        main { position: relative; z-index: 1; }
      `}</style>

      {/* Ambient blobs */}
      <div className="du-blob" style={{ width: 500, height: 500, top: -100, left: -150, background: "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)" }} />
      <div className="du-blob" style={{ width: 400, height: 400, top: 200, right: -100, background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", animationDelay: "3s" }} />
      <div className="du-blob" style={{ width: 300, height: 300, bottom: 100, left: "30%", background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)", animationDelay: "5s" }} />

      <Header />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Hero Welcome ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, animation: "fadeUp 0.5s ease both" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.18)", borderRadius: 999, padding: "5px 14px", marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399", animation: "pulseGlow 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Health Dashboard · Active</span>
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              <span style={{ color: "#f8fafc" }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},</span>
              <br />
              <span style={{ background: "linear-gradient(90deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {profile?.full_name?.split(" ")[0] || "User"} 👋
              </span>
            </h1>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "#475569", fontWeight: 400 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Health ID */}
          <div style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.08))", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 18, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.15))", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(56,189,248,0.2)" }}>
              <Shield size={18} style={{ color: "#38bdf8" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Decentralized Health ID</p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#38bdf8", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                {profile?.decentralized_health_id?.slice(0, 20) || "Generating..."}
              </p>
            </div>
            <CheckCircle2 size={18} style={{ color: "#34d399" }} />
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28, animation: "fadeUp 0.5s 0.07s ease both", opacity: 0, animationFillMode: "forwards" }}>
          {[
            {
              label: "I Feel Uneasy", sub: "Log symptoms now",
              icon: <Heart size={24} />, action: () => setSymptomModalOpen(true),
              bg: "linear-gradient(135deg, #1a0a0a, #2a0f0f)",
              border: "rgba(248,113,113,0.25)", accent: "#f87171",
              glow: "rgba(248,113,113,0.2)",
            },
            {
              label: "Log Sleep", sub: "Track rest quality",
              icon: <Moon size={24} />, action: () => setSleepModalOpen(true),
              bg: "linear-gradient(135deg, #0a0a1a, #0f1030)",
              border: "rgba(129,140,248,0.25)", accent: "#818cf8",
              glow: "rgba(129,140,248,0.15)",
            },
            {
              label: "Doctor Access", sub: "Share health data",
              icon: <Shield size={24} />, action: () => setAccessKeyModalOpen(true),
              bg: "linear-gradient(135deg, #0d1208, #131c0a)",
              border: "rgba(52,211,153,0.25)", accent: "#34d399",
              glow: "rgba(52,211,153,0.15)",
            },
            {
              label: "Emergency SOS", sub: "Call for help instantly",
              icon: <Zap size={24} />, action: () => navigate("/emergency"),
              bg: "linear-gradient(135deg, #dc2626, #991b1b)",
              border: "rgba(248,113,113,0.5)", accent: "#fff",
              glow: "rgba(220,38,38,0.4)", emergency: true,
            },
          ].map(({ label, sub, icon, action, bg, border, accent, glow, emergency }) => (
            <button key={label} className="du-quick" onClick={action} style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 18,
              padding: "20px 18px", display: "flex", flexDirection: "column",
              alignItems: "flex-start", gap: 12, cursor: "pointer",
              boxShadow: emergency ? `0 8px 32px ${glow}` : `0 4px 20px rgba(0,0,0,0.3)`,
              position: "relative", overflow: "hidden",
            }}>
              {/* Subtle corner glow */}
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ color: accent }}>{icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: emergency ? "#fff" : accent, letterSpacing: "-0.01em" }}>{label}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: emergency ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)", fontWeight: 400 }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Main 3-col Grid ───────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.05fr", gap: 20, marginBottom: 20 }}>

          {/* AI Health Score ─────────────────────────── */}
          <div style={{ background: "linear-gradient(160deg, #0d1117 0%, #0a0f1a 100%)", border: `1px solid rgba(56,189,248,0.15)`, borderRadius: 22, padding: "24px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", animation: "fadeUp 0.5s 0.14s ease both", opacity: 0, animationFillMode: "forwards" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Health Score</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#334155" }}>Powered by health analysis engine</p>
              </div>
              <button onClick={() => setAiInsightModalOpen(true)} className="du-btn" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#38bdf8", fontWeight: 600, cursor: "pointer" }}>
                <Sparkles size={11} /> View Insights
              </button>
            </div>

            {/* SVG Arc score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 20px" }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {/* Track */}
                  <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                  {/* Glow ring */}
                  <circle cx="70" cy="70" r="58" fill="none" stroke={scoreColor} strokeWidth="10"
                    strokeDasharray={`${(score / 100) * 364.4} 364.4`}
                    strokeLinecap="round" transform="rotate(-90 70 70)"
                    style={{ filter: `drop-shadow(0 0 8px ${scoreColor})`, transition: "stroke-dasharray 1s ease" }}
                  />
                  {/* Inner decorative ring */}
                  <circle cx="70" cy="70" r="44" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor, lineHeight: 1, letterSpacing: "-0.03em" }}>{score}</span>
                  <span style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>/ 100</span>
                </div>
              </div>

              {/* Urgency status */}
              <div style={{ marginTop: 14, background: urgencyBg, border: `1px solid ${scoreColor}22`, borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: scoreColor, fontWeight: 600 }}>
                  {score >= 70 ? "⚠️ Immediate attention needed" : score >= 40 ? "📋 Schedule a checkup soon" : "✓ Health looks stable"}
                </p>
              </div>
            </div>

            {/* Doctor rec */}
            {aiAnalysis && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <Stethoscope size={15} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: "#334155", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommended</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{aiAnalysis.recommendedDoctorType}</p>
                </div>
              </div>
            )}

            {/* Risk factors grid */}
            {aiAnalysis && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Symptoms", val: aiAnalysis.detailedAnalysis.symptomImpact },
                  { label: "Sleep", val: aiAnalysis.detailedAnalysis.sleepImpact },
                  { label: "Lifestyle", val: aiAnalysis.detailedAnalysis.lifestyleImpact },
                  { label: "History", val: aiAnalysis.detailedAnalysis.medicalHistoryImpact },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.02em" }}>{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sleep + Symptoms col ─────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeUp 0.5s 0.21s ease both", opacity: 0, animationFillMode: "forwards" }}>

            {/* Sleep Score */}
            <div className="du-card" style={{ background: "linear-gradient(160deg, #0d0b1a, #0a0812)", border: "1px solid rgba(129,140,248,0.15)", borderRadius: 22, padding: "22px", flex: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Moon size={16} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Sleep Score</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>Last 7 nights</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: "#818cf8", letterSpacing: "-0.03em" }}>{latestSleepScore}</span>
                  <span style={{ fontSize: 13, color: "#334155" }}>/100</span>
                </div>
              </div>

              {/* Bar chart */}
              {sleepEntries.length > 0 ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
                  {sleepEntries.slice(0, 7).reverse().map((entry, idx) => {
                    const pct = (entry.sleep_score || 0) / 100;
                    return (
                      <div key={idx} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", height: `${Math.max(pct * 100, 10)}%`, borderRadius: 6, background: `linear-gradient(to top, rgba(129,140,248,${0.25 + pct * 0.6}), rgba(99,102,241,${0.1 + pct * 0.3}))`, transition: "height 0.6s ease", boxShadow: pct > 0.7 ? "0 0 8px rgba(129,140,248,0.3)" : "none" }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 12, color: "#334155" }}>No sleep data yet</p>
                </div>
              )}

              {sleepEntries.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: "#1e293b" }}>7 days ago</span>
                  <span style={{ fontSize: 10, color: "#1e293b" }}>Today · {sleepEntries[0]?.hours_slept}h</span>
                </div>
              )}
            </div>

            {/* Recent Symptoms */}
            <div className="du-card" style={{ background: "linear-gradient(160deg, #0d0a0a, #130b0b)", border: "1px solid rgba(248,113,113,0.12)", borderRadius: 22, padding: "22px", flex: 1, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={16} style={{ color: "#f87171" }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Recent Symptoms</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>Your health log</p>
                  </div>
                </div>
                <button onClick={() => setSymptomModalOpen(true)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}>
                  <Plus size={14} />
                </button>
              </div>

              {healthLogs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {healthLogs.slice(0, 3).map((log) => {
                    const sev = log.severity || 0;
                    const sevColor = sev >= 7 ? "#f87171" : sev >= 4 ? "#fbbf24" : "#34d399";
                    return (
                      <div key={log.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 13px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {log.symptoms.slice(0, 2).map(s => (
                              <span key={s} style={{ fontSize: 10, fontWeight: 600, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 999, padding: "2px 8px" }}>
                                {symptoms.find(sym => sym.id === s)?.label || s}
                              </span>
                            ))}
                            {log.symptoms.length > 2 && <span style={{ fontSize: 10, color: "#334155" }}>+{log.symptoms.length - 2}</span>}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: sevColor }}>{sev}/10</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: "#1e293b" }}>{format(new Date(log.created_at), "MMM d · h:mm a")}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                  <Heart size={26} style={{ color: "#1e293b", marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#334155" }}>No symptoms logged yet</p>
                  <button onClick={() => setSymptomModalOpen(true)} style={{ marginTop: 8, background: "none", border: "none", color: "#f87171", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Log first symptom</button>
                </div>
              )}
            </div>
          </div>

          {/* AI Consultation ─────────────────────────── */}
          <div style={{ animation: "fadeUp 0.5s 0.28s ease both", opacity: 0, animationFillMode: "forwards" }}>
            <AiConsultation
              healthContext={{
                recentSymptoms: healthLogs.slice(0, 3),
                sleepScore: latestSleepScore,
                healthRiskScore: aiAnalysis?.healthRiskScore ?? 0,
                pastDiagnoses: profile?.past_diagnoses || [],
                allergies: profile?.allergies || [],
                age: profile?.age ?? undefined,
              }}
            />
          </div>
        </div>

        {/* ── Bottom Row ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, animation: "fadeUp 0.5s 0.35s ease both", opacity: 0, animationFillMode: "forwards" }}>

          {/* Doctor Recommendations */}
          <div className="du-card" style={{ background: "linear-gradient(160deg, #0a0d12, #080c10)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22, padding: "24px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Stethoscope size={16} style={{ color: "#fbbf24" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Recommended Doctors</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>Based on your health profile</p>
                </div>
              </div>
              <button style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ChevronRight size={12} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mockDoctors.slice(0, 3).map((doctor) => (
                <div key={doctor.id} className="du-card" style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}>
                  <img src={doctor.image} alt={doctor.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.08)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doctor.name}</p>
                    <p style={{ margin: "2px 0", fontSize: 11, color: "#475569" }}>{doctor.specialty}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#334155" }}>{doctor.distance}</span>
                      <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 600 }}>★ {doctor.rating}</span>
                    </div>
                  </div>
                  <button className="du-btn" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#38bdf8", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Book
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Access Keys */}
          <div className="du-card" style={{ background: "linear-gradient(160deg, #0a0d12, #080c10)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22, padding: "24px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={16} style={{ color: "#34d399" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Access Keys</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>Secure doctor data sharing</p>
                </div>
              </div>
              <button onClick={() => setAccessKeyModalOpen(true)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}>
                <Plus size={14} />
              </button>
            </div>

            {accessKeys.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {accessKeys.slice(0, 3).map((key) => {
                  const expired = new Date(key.expires_at) < new Date();
                  const status = key.is_used ? "Used" : expired ? "Expired" : "Active";
                  const statusColor = key.is_used ? "#334155" : expired ? "#f87171" : "#34d399";
                  return (
                    <div key={key.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#38bdf8", fontWeight: 500 }}>{key.access_key}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}33`, borderRadius: 999, padding: "2px 8px" }}>{status}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "#334155" }}>{key.doctor_name || "Any doctor"} · {key.hospital_name || "Any hospital"}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Shield size={24} style={{ color: "#1e293b" }} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>No access keys yet</p>
                <button onClick={() => setAccessKeyModalOpen(true)} style={{ marginTop: 8, background: "none", border: "none", color: "#34d399", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Generate first key</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Disclaimer ───────────────────────────────────── */}
        <div style={{ marginTop: 24, background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12, animation: "fadeUp 0.5s 0.42s ease both", opacity: 0, animationFillMode: "forwards" }}>
          <AlertTriangle size={15} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            <strong style={{ color: "#fbbf24" }}>Medical Disclaimer · </strong>
            This system does not provide medical diagnosis. AI assists with symptom tracking and risk awareness only. Always consult a qualified healthcare professional for medical advice. Emergency: Call <strong style={{ color: "#f87171" }}>112</strong> or <strong style={{ color: "#f87171" }}>108</strong>.
          </p>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════ */}

      {/* Symptom Modal */}
      <Dialog open={symptomModalOpen} onOpenChange={setSymptomModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" style={{ background: "#0d1117", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 22 }}>
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8, color: "#f1f5f9", fontSize: 17, fontWeight: 700 }}>
              <Heart size={18} style={{ color: "#f87171" }} /> Log Symptoms
            </DialogTitle>
            <DialogDescription style={{ color: "#475569", fontSize: 13 }}>Select what you're experiencing and rate severity</DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "8px 0" }}>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Select Symptoms</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {symptoms.map(s => {
                  const sel = selectedSymptoms.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => handleSymptomToggle(s.id)} style={{ display: "flex", alignItems: "center", gap: 9, borderRadius: 12, border: `1px solid ${sel ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.06)"}`, background: sel ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.02)", padding: "10px 12px", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sel ? "#f87171" : "#475569" }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Severity: {symptomSeverity}/10</p>
              <Slider value={[symptomSeverity]} onValueChange={([v]) => setSymptomSeverity(v)} min={1} max={10} step={1} className="mt-2" />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#334155" }}>Mild</span><span style={{ fontSize: 10, color: "#334155" }}>Severe</span>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</p>
                <button onClick={toggleRecording} style={{ background: isRecording ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${isRecording ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: isRecording ? "#f87171" : "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  {isRecording ? <><MicOff size={11} /> Stop</> : <><Mic size={11} /> Voice</>}
                </button>
              </div>
              <Textarea value={symptomNotes} onChange={e => setSymptomNotes(e.target.value)} placeholder="Describe how you're feeling..." rows={3} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "#e2e8f0", fontSize: 13 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setSymptomModalOpen(false)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px", fontSize: 13, color: "#475569", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            <button onClick={handleLogSymptoms} disabled={!selectedSymptoms.length} style={{ flex: 1, background: selectedSymptoms.length ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 12, padding: "13px", fontSize: 13, color: selectedSymptoms.length ? "#fff" : "#334155", cursor: selectedSymptoms.length ? "pointer" : "not-allowed", fontWeight: 700, boxShadow: selectedSymptoms.length ? "0 4px 20px rgba(220,38,38,0.3)" : "none" }}>
              Log Symptoms
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sleep Modal */}
      <Dialog open={sleepModalOpen} onOpenChange={setSleepModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: "#0d1117", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 22 }}>
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8, color: "#f1f5f9", fontSize: 17, fontWeight: 700 }}>
              <Moon size={18} style={{ color: "#818cf8" }} /> Log Sleep
            </DialogTitle>
            <DialogDescription style={{ color: "#475569", fontSize: 13 }}>How was your rest last night?</DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "8px 0" }}>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Hours Slept: {sleepHours}h</p>
              <Slider value={[sleepHours]} onValueChange={([v]) => setSleepHours(v)} min={1} max={14} step={0.5} className="mt-2" />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#334155" }}>1h</span><span style={{ fontSize: 10, color: "#334155" }}>14h</span>
              </div>
            </div>
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sleep Quality</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {sleepQualityOptions.map(opt => {
                  const sel = sleepQuality === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setSleepQuality(opt.value as any)} style={{ borderRadius: 12, border: `1px solid ${sel ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.06)"}`, background: sel ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.02)", padding: "14px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}>
                      <span style={{ fontSize: 26 }}>{opt.emoji}</span>
                      <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: sel ? "#818cf8" : "#475569" }}>{opt.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setSleepModalOpen(false)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px", fontSize: 13, color: "#475569", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            <button onClick={handleLogSleep} style={{ flex: 1, background: "linear-gradient(135deg,#4f46e5,#6d28d9)", border: "none", borderRadius: 12, padding: "13px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }}>
              Log Sleep
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Key Modal */}
      <Dialog open={accessKeyModalOpen} onOpenChange={setAccessKeyModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: "#0d1117", border: "1px solid rgba(52,211,153,0.18)", borderRadius: 22 }}>
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8, color: "#f1f5f9", fontSize: 17, fontWeight: 700 }}>
              <Shield size={18} style={{ color: "#34d399" }} /> Doctor Access Key
            </DialogTitle>
            <DialogDescription style={{ color: "#475569", fontSize: 13 }}>Create a secure one-time key for your doctor</DialogDescription>
          </DialogHeader>
          {!generatedKey ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
                {[
                  { id: "dn", label: "Doctor's Name", val: doctorName, set: setDoctorName, ph: "Dr. Sharma" },
                  { id: "hn", label: "Hospital / Clinic", val: hospitalName, set: setHospitalName, ph: "Apollo Hospital" },
                  { id: "vp", label: "Visit Purpose", val: visitPurpose, set: setVisitPurpose, ph: "General checkup" },
                ].map(({ id, label, val, set, ph }) => (
                  <div key={id}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                    <Input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#e2e8f0", fontSize: 13 }} />
                  </div>
                ))}
                <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={14} style={{ color: "#34d399" }} />
                  <span style={{ fontSize: 12, color: "#34d399" }}>Key expires automatically in 24 hours</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setAccessKeyModalOpen(false)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px", fontSize: 13, color: "#475569", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleGenerateAccessKey} style={{ flex: 1, background: "linear-gradient(135deg,#059669,#047857)", border: "none", borderRadius: 12, padding: "13px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 20px rgba(5,150,105,0.3)" }}>
                  Generate Key
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: "8px 0" }}>
              <div style={{ textAlign: "center", background: "rgba(52,211,153,0.05)", border: "2px dashed rgba(52,211,153,0.25)", borderRadius: 16, padding: "30px 20px" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Shield size={24} style={{ color: "#34d399" }} />
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Secure Access Key</p>
                <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#34d399", letterSpacing: "0.04em" }}>{generatedKey.key}</p>
                <button onClick={() => copyAccessKey(generatedKey.key)} style={{ marginTop: 16, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 10, padding: "8px 20px", fontSize: 12, color: "#38bdf8", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {keyCopied ? <><CheckCircle2 size={13} style={{ color: "#34d399" }} /> Copied!</> : <><Copy size={13} /> Copy Key</>}
                </button>
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {["One-time use only", "Expires in 24 hours", "Cryptographically secured"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={14} style={{ color: "#34d399" }} /><span style={{ fontSize: 12, color: "#475569" }}>{t}</span></div>
                ))}
              </div>
              <button onClick={() => { setGeneratedKey(null); setDoctorName(""); setHospitalName(""); setVisitPurpose(""); setAccessKeyModalOpen(false); }}
                style={{ marginTop: 20, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px", fontSize: 13, color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}>
                Done
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Insights Modal */}
      <Dialog open={aiInsightModalOpen} onOpenChange={setAiInsightModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" style={{ background: "#0d1117", border: "1px solid rgba(56,189,248,0.18)", borderRadius: 22 }}>
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8, color: "#f1f5f9", fontSize: 17, fontWeight: 700 }}>
              <Brain size={18} style={{ color: "#38bdf8" }} /> AI Health Insights
            </DialogTitle>
            <DialogDescription style={{ color: "#475569", fontSize: 13 }}>Detailed analysis based on your health patterns</DialogDescription>
          </DialogHeader>
          {aiAnalysis && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
              <div style={{ background: urgencyBg, border: `1px solid ${scoreColor}22`, borderRadius: 14, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Urgency Level</p>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: scoreColor, textTransform: "capitalize", letterSpacing: "-0.02em" }}>{aiAnalysis.urgencyLevel}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 12px", fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Analysis Reasoning</p>
                {aiAnalysis.reasoning.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <ArrowRight size={13} style={{ color: "#38bdf8", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{r}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 14, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: 10, color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Executive Summary</p>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{aiAnalysis.summary}</p>
              </div>
              <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={13} style={{ color: "#fbbf24" }} />
                <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>AI assists with risk awareness only — not a medical diagnosis.</p>
              </div>
            </div>
          )}
          <button onClick={() => setAiInsightModalOpen(false)} style={{ width: "100%", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", border: "none", borderRadius: 12, padding: "13px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 20px rgba(14,165,233,0.3)", marginTop: 8 }}>
            Got it
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}