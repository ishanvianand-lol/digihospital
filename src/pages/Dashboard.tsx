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

  // ── backend logic untouched ──────────────────────────────────────────
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
    if (!isRecording) setTimeout(() => { setSymptomNotes(p => p + " Feeling tired and having headaches."); setIsRecording(false); }, 2000);
  };
  // ────────────────────────────────────────────────────────────────────

  const score = aiAnalysis?.healthRiskScore ?? 0;
  const scoreColor = score >= 70 ? "#f87171" : score >= 40 ? "#fbbf24" : "#34d399";
  const urgencyBg = score >= 70 ? "rgba(248,113,113,0.08)" : score >= 40 ? "rgba(251,191,36,0.08)" : "rgba(52,211,153,0.08)";
  const R = 56, CIRC = 2 * Math.PI * R;
  const glass = (accent = "rgba(255,255,255,0.06)"): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${accent}`,
    borderRadius: 22,
    boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
  });

  if (authLoading || profileLoading) return (
    <div style={{ minHeight:"100vh", background:"#050d11", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"2px solid rgba(56,189,248,0.15)", borderTopColor:"#38bdf8", animation:"_spin .8s linear infinite" }} />
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Sora', system-ui, sans-serif", position:"relative", overflowX:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes _spin  { to { transform: rotate(360deg); } }
        @keyframes _up    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes _blob1 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(50px,-40px)scale(1.1)} 70%{transform:translate(-30px,25px)scale(.94)} }
        @keyframes _blob2 { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(-40px,30px)scale(1.07)} 70%{transform:translate(25px,-20px)scale(.97)} }
        @keyframes _blob3 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(35px,35px)scale(1.09)} }
        @keyframes _wave1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-50px)} }
        @keyframes _wave2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(50px)} }
        @keyframes _dot   { 0%,100%{opacity:1} 50%{opacity:.45} }

        .db-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
        .db-card { transition: border-color .22s ease, transform .22s ease !important; }
        .db-card:hover { border-color: rgba(56,189,248,0.3) !important; transform: translateY(-2px) !important; }
        .db-quick { transition: transform .22s cubic-bezier(.4,0,.2,1), filter .22s, box-shadow .22s !important; cursor:pointer; }
        .db-quick:hover { transform: translateY(-4px) !important; filter: brightness(1.12) !important; }
        .db-btn { transition: all .18s !important; }
        .db-btn:hover { transform: translateY(-1px) !important; opacity: .85; }

        [role="dialog"] > div {
          background: rgba(6,12,18,0.97) !important;
          backdrop-filter: blur(32px) !important;
          -webkit-backdrop-filter: blur(32px) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 22px !important;
          box-shadow: 0 40px 100px rgba(0,0,0,.75) !important;
        }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.18); border-radius:4px; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div className="db-blob" style={{ width:700,height:700,top:-200,left:-200, background:"radial-gradient(ellipse,rgba(14,165,233,0.1) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="db-blob" style={{ width:550,height:550,top:"20%",right:-180, background:"radial-gradient(ellipse,rgba(99,102,241,0.07) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />
      <div className="db-blob" style={{ width:400,height:400,bottom:"5%",left:"28%", background:"radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 65%)", animation:"_blob3 28s ease-in-out infinite", animationDelay:"-14s" }} />

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      {/* SVG Waves */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,height:240,zIndex:0,pointerEvents:"none",overflow:"hidden" }}>
        <svg viewBox="0 0 1440 240" preserveAspectRatio="none" style={{ position:"absolute",bottom:0,width:"100%",height:"100%" }}>
          <defs>
            <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.1"/>
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.07"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.06"/>
            </linearGradient>
            <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.08"/>
            </linearGradient>
          </defs>
          <path d="M0,120 C360,195 720,55 1080,120 C1260,155 1380,95 1440,115 L1440,240 L0,240 Z"
            fill="url(#wg1)" style={{animation:"_wave1 12s ease-in-out infinite"}} />
          <path d="M0,155 C300,90 600,195 900,140 C1100,100 1320,165 1440,150 L1440,240 L0,240 Z"
            fill="url(#wg2)" style={{animation:"_wave2 16s ease-in-out infinite",opacity:.7}} />
        </svg>
      </div>

      <Header />

      <main style={{ position:"relative", zIndex:1, maxWidth:1340, margin:"0 auto", padding:"44px 24px 120px" }}>

        {/* HERO */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:20, marginBottom:48, animation:"_up .6s ease both" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(14,165,233,0.07)", border:"1px solid rgba(14,165,233,0.18)", borderRadius:999, padding:"6px 16px", marginBottom:20 }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 8px #34d399",display:"inline-block",animation:"_dot 2.4s ease-in-out infinite" }} />
              <span style={{ fontSize:11,color:"#38bdf8",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>Health Dashboard · Live</span>
            </div>
            <h1 style={{ lineHeight:1.03, letterSpacing:"-0.04em", fontWeight:800 }}>
              <span style={{ display:"block", fontSize:"clamp(30px,4vw,52px)", color:"rgba(255,255,255,0.85)", marginBottom:4 }}>
                Good {new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"},
              </span>
              <span style={{ display:"block", fontSize:"clamp(36px,5vw,64px)",
                background:"linear-gradient(100deg,#38bdf8 0%,#34d399 40%,#818cf8 85%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                {profile?.full_name?.split(" ")[0] || "User"}.
              </span>
            </h1>
            <p style={{ marginTop:14, fontSize:14, color:"rgba(255,255,255,0.28)", lineHeight:1.65, maxWidth:420 }}>
              Your AI-powered health assistant is active and monitoring.
            </p>
          </div>

          {/* Health ID */}
          <div style={{ ...glass("rgba(56,189,248,0.18)"), padding:"16px 22px", display:"flex", alignItems:"center", gap:16, alignSelf:"flex-start" }}>
            <div style={{ width:44,height:44,borderRadius:14, background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"1px solid rgba(56,189,248,0.3)", display:"flex",alignItems:"center",justifyContent:"center", boxShadow:"0 0 24px rgba(56,189,248,0.2)" }}>
              <Shield size={19} style={{ color:"#38bdf8" }} />
            </div>
            <div>
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Decentralized Health ID</p>
              <p style={{ marginTop:4, fontSize:13, color:"#38bdf8", fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>
                {profile?.decentralized_health_id?.slice(0,20)||"Generating..."}
              </p>
            </div>
            <CheckCircle2 size={18} style={{ color:"#34d399" }} />
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28, animation:"_up .6s .08s ease both", opacity:0, animationFillMode:"forwards" }}>
          {[
            { label:"I Feel Uneasy", sub:"Log symptoms now",   icon:<Heart size={22}/>,  fn:()=>setSymptomModalOpen(true),  bg:"linear-gradient(140deg,#140909,#200e0e)", border:"rgba(248,113,113,0.22)", col:"#f87171", glow:"rgba(248,113,113,0.2)" },
            { label:"Log Sleep",     sub:"Track rest quality", icon:<Moon size={22}/>,   fn:()=>setSleepModalOpen(true),    bg:"linear-gradient(140deg,#090918,#0e0f2a)", border:"rgba(129,140,248,0.22)", col:"#818cf8", glow:"rgba(129,140,248,0.15)" },
            { label:"Doctor Access", sub:"Share health data",  icon:<Shield size={22}/>, fn:()=>setAccessKeyModalOpen(true),bg:"linear-gradient(140deg,#0b120a,#121e0c)", border:"rgba(52,211,153,0.22)",  col:"#34d399", glow:"rgba(52,211,153,0.15)" },
            { label:"Emergency SOS", sub:"Call for help now",  icon:<Zap size={22}/>,    fn:()=>navigate("/emergency"),     bg:"linear-gradient(140deg,#c91c1c,#8f1212)", border:"rgba(248,113,113,0.5)",  col:"#fff",    glow:"rgba(220,38,38,0.5)", hot:true },
          ].map(({label,sub,icon,fn,bg,border,col,glow,hot}:any) => (
            <button key={label} className="db-quick" onClick={fn} style={{
              background:bg, border:`1px solid ${border}`, borderRadius:20,
              padding:"22px 18px", display:"flex", flexDirection:"column",
              alignItems:"flex-start", gap:14, textAlign:"left",
              boxShadow:hot?`0 12px 40px ${glow}`:`0 4px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)`,
              position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute",top:-28,right:-28,width:110,height:110,borderRadius:"50%",background:`radial-gradient(circle,${glow} 0%,transparent 70%)`,pointerEvents:"none" }} />
              <div style={{ width:42,height:42,borderRadius:14,background:hot?"rgba(255,255,255,0.12)":`${col}18`,display:"flex",alignItems:"center",justifyContent:"center",color:col }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize:13,fontWeight:700,color:hot?"#fff":col,letterSpacing:"-0.01em" }}>{label}</p>
                <p style={{ marginTop:3,fontSize:11,color:hot?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.28)" }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* MAIN 3-COL GRID */}
        <div style={{ display:"grid", gridTemplateColumns:"310px 1fr 1.05fr", gap:20, marginBottom:20 }}>

          {/* AI SCORE */}
          <div style={{ ...glass("rgba(56,189,248,0.13)"), padding:"26px 22px", display:"flex", flexDirection:"column", animation:"_up .6s .16s ease both", opacity:0, animationFillMode:"forwards" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div>
                <p style={{ fontSize:10, color:"#38bdf8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em" }}>AI Health Score</p>
                <p style={{ marginTop:3, fontSize:11, color:"rgba(255,255,255,0.2)" }}>Real-time analysis</p>
              </div>
              <button onClick={()=>setAiInsightModalOpen(true)} className="db-btn" style={{ background:"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.18)",borderRadius:10,padding:"6px 13px",display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#38bdf8",fontWeight:700,cursor:"pointer" }}>
                <Sparkles size={11}/> Insights
              </button>
            </div>

            {/* Score ring */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <div style={{ position:"relative", width:160, height:160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="76" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 7"/>
                  <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14"/>
                  <circle cx="80" cy="80" r={R} fill="none" stroke={scoreColor} strokeWidth="14"
                    strokeDasharray={`${(score/100)*CIRC} ${CIRC}`} strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ filter:"blur(9px)", opacity:.38, transition:"stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1)" }}/>
                  <circle cx="80" cy="80" r={R} fill="none" stroke={scoreColor} strokeWidth="9"
                    strokeDasharray={`${(score/100)*CIRC} ${CIRC}`} strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ filter:`drop-shadow(0 0 12px ${scoreColor})`, transition:"stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1)" }}/>
                  <circle cx="80" cy="80" r="44" fill="rgba(0,0,0,0.3)"/>
                </svg>
                <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                  <span style={{ fontSize:36,fontWeight:800,color:scoreColor,lineHeight:1,letterSpacing:"-0.04em" }}>{score}</span>
                  <span style={{ fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:2 }}>/100</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ display:"inline-flex",alignItems:"center",gap:7,background:urgencyBg,border:`1px solid ${scoreColor}28`,borderRadius:999,padding:"7px 18px" }}>
                <span style={{ width:6,height:6,borderRadius:"50%",background:scoreColor,boxShadow:`0 0 6px ${scoreColor}`,display:"inline-block" }} />
                <span style={{ fontSize:12,color:scoreColor,fontWeight:600 }}>
                  {score>=70?"Needs attention":score>=40?"Schedule a checkup":"Looking good"}
                </span>
              </div>
            </div>

            {aiAnalysis&&(
              <div style={{ background:"rgba(255,255,255,0.028)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:13,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10 }}>
                <Stethoscope size={15} style={{ color:"#38bdf8",flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:9,color:"rgba(255,255,255,0.22)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>See a</p>
                  <p style={{ marginTop:3,fontSize:13,color:"rgba(255,255,255,0.78)",fontWeight:600 }}>{aiAnalysis.recommendedDoctorType}</p>
                </div>
              </div>
            )}

            {aiAnalysis&&(
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {[
                  {label:"Symptoms",val:aiAnalysis.detailedAnalysis.symptomImpact},
                  {label:"Sleep",val:aiAnalysis.detailedAnalysis.sleepImpact},
                  {label:"Lifestyle",val:aiAnalysis.detailedAnalysis.lifestyleImpact},
                  {label:"History",val:aiAnalysis.detailedAnalysis.medicalHistoryImpact},
                ].map(({label,val})=>(
                  <div key={label} style={{ background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:11,padding:"10px 12px" }}>
                    <p style={{ fontSize:9,color:"rgba(255,255,255,0.22)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em" }}>{label}</p>
                    <p style={{ marginTop:4,fontSize:17,fontWeight:800,color:"rgba(255,255,255,0.82)",letterSpacing:"-0.02em" }}>{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SLEEP + SYMPTOMS */}
          <div style={{ display:"flex",flexDirection:"column",gap:18, animation:"_up .6s .24s ease both",opacity:0,animationFillMode:"forwards" }}>

            <div className="db-card" style={{ ...glass("rgba(129,140,248,0.13)"), padding:"22px" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:36,height:36,borderRadius:11,background:"rgba(129,140,248,0.1)",border:"1px solid rgba(129,140,248,0.18)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Moon size={17} style={{ color:"#818cf8" }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.82)" }}>Sleep Score</p>
                    <p style={{ fontSize:10,color:"rgba(255,255,255,0.22)" }}>Last 7 nights</p>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize:38,fontWeight:800,color:"#818cf8",letterSpacing:"-0.04em" }}>{latestSleepScore}</span>
                  <span style={{ fontSize:14,color:"rgba(255,255,255,0.22)" }}>/100</span>
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"flex-end",gap:5,height:52,marginBottom:8 }}>
                {(sleepEntries.length>0?sleepEntries.slice(0,7).reverse():Array(7).fill({sleep_score:0})).map((e:any,i:number)=>{
                  const pct=Math.max((e.sleep_score||0)/100,.07);
                  return (
                    <div key={i} style={{ flex:1,height:"100%",display:"flex",alignItems:"flex-end" }}>
                      <div style={{ width:"100%",borderRadius:"6px 6px 3px 3px",height:`${pct*100}%`,background:`linear-gradient(to top,rgba(129,140,248,${.28+pct*.55}),rgba(99,102,241,${.1+pct*.2}))`,boxShadow:pct>.7?"0 0 10px rgba(129,140,248,0.3)":"none",transition:"height .7s ease" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.15)" }}>7d ago</span>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.15)" }}>{sleepEntries[0]?`Last night · ${sleepEntries[0].hours_slept}h`:"No data yet"}</span>
              </div>
            </div>

            <div className="db-card" style={{ ...glass("rgba(248,113,113,0.11)"), padding:"22px", flex:1 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:36,height:36,borderRadius:11,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.16)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Activity size={17} style={{ color:"#f87171" }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.82)" }}>Recent Symptoms</p>
                    <p style={{ fontSize:10,color:"rgba(255,255,255,0.22)" }}>Your health log</p>
                  </div>
                </div>
                <button onClick={()=>setSymptomModalOpen(true)} style={{ width:30,height:30,borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.35)" }}>
                  <Plus size={14}/>
                </button>
              </div>
              {healthLogs.length>0?(
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {healthLogs.slice(0,3).map(log=>{
                    const sev=log.severity||0;
                    const sc=sev>=7?"#f87171":sev>=4?"#fbbf24":"#34d399";
                    return (
                      <div key={log.id} style={{ background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:13,padding:"11px 13px" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                          <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                            {log.symptoms.slice(0,2).map(s=>(
                              <span key={s} style={{ fontSize:10,fontWeight:600,color:"#f87171",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.16)",borderRadius:999,padding:"2px 8px" }}>
                                {symptoms.find(x=>x.id===s)?.label||s}
                              </span>
                            ))}
                            {log.symptoms.length>2&&<span style={{ fontSize:10,color:"rgba(255,255,255,0.22)" }}>+{log.symptoms.length-2}</span>}
                          </div>
                          <span style={{ fontSize:13,fontWeight:800,color:sc }}>{sev}/10</span>
                        </div>
                        <p style={{ fontSize:10,color:"rgba(255,255,255,0.2)" }}>{format(new Date(log.created_at),"MMM d · h:mm a")}</p>
                      </div>
                    );
                  })}
                </div>
              ):(
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 0",textAlign:"center" }}>
                  <Heart size={26} style={{ color:"rgba(255,255,255,0.08)",marginBottom:10 }}/>
                  <p style={{ fontSize:12,color:"rgba(255,255,255,0.22)" }}>No symptoms logged yet</p>
                  <button onClick={()=>setSymptomModalOpen(true)} style={{ marginTop:8,background:"none",border:"none",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer" }}>+ Log first symptom</button>
                </div>
              )}
            </div>
          </div>

          {/* AI CONSULTATION */}
          <div style={{ animation:"_up .6s .32s ease both",opacity:0,animationFillMode:"forwards" }}>
            <AiConsultation
              healthContext={{
                recentSymptoms:healthLogs.slice(0,3),
                sleepScore:latestSleepScore,
                healthRiskScore:aiAnalysis?.healthRiskScore??0,
                pastDiagnoses:profile?.past_diagnoses||[],
                allergies:profile?.allergies||[],
                age:profile?.age??undefined,
              }}
            />
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20, animation:"_up .6s .40s ease both",opacity:0,animationFillMode:"forwards" }}>

          <div className="db-card" style={{ ...glass(), padding:"24px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.16)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Stethoscope size={17} style={{ color:"#fbbf24" }}/>
                </div>
                <div>
                  <p style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.82)" }}>Recommended Doctors</p>
                  <p style={{ fontSize:10,color:"rgba(255,255,255,0.22)" }}>Based on your health profile</p>
                </div>
              </div>
              <button className="db-btn" style={{ fontSize:12,color:"#38bdf8",fontWeight:600,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3 }}>
                View all <ChevronRight size={13}/>
              </button>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {mockDoctors.slice(0,3).map(doc=>(
                <div key={doc.id} className="db-card" style={{ display:"flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:15,padding:"12px 14px",cursor:"pointer" }}>
                  <img src={doc.image} alt={doc.name} style={{ width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"1px solid rgba(255,255,255,0.09)",flexShrink:0 }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.82)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{doc.name}</p>
                    <p style={{ marginTop:2,fontSize:11,color:"rgba(255,255,255,0.32)" }}>{doc.specialty}</p>
                    <div style={{ display:"flex",gap:8,marginTop:3 }}>
                      <span style={{ fontSize:10,color:"rgba(255,255,255,0.2)" }}>{doc.distance}</span>
                      <span style={{ fontSize:10,color:"#fbbf24",fontWeight:600 }}>★ {doc.rating}</span>
                    </div>
                  </div>
                  <button className="db-btn" style={{ background:"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.18)",borderRadius:9,padding:"7px 16px",fontSize:12,color:"#38bdf8",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>Book</button>
                </div>
              ))}
            </div>
          </div>

          <div className="db-card" style={{ ...glass(), padding:"24px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.16)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Shield size={17} style={{ color:"#34d399" }}/>
                </div>
                <div>
                  <p style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.82)" }}>Access Keys</p>
                  <p style={{ fontSize:10,color:"rgba(255,255,255,0.22)" }}>Secure doctor data sharing</p>
                </div>
              </div>
              <button onClick={()=>setAccessKeyModalOpen(true)} style={{ width:30,height:30,borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.35)" }}>
                <Plus size={14}/>
              </button>
            </div>
            {accessKeys.length>0?(
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {accessKeys.slice(0,3).map(key=>{
                  const expired=new Date(key.expires_at)<new Date();
                  const status=key.is_used?"Used":expired?"Expired":"Active";
                  const sc=key.is_used?"rgba(255,255,255,0.2)":expired?"#f87171":"#34d399";
                  return (
                    <div key={key.id} style={{ background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"12px 14px" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#38bdf8" }}>{key.access_key}</span>
                        <span style={{ fontSize:10,fontWeight:700,color:sc,background:`${sc}14`,border:`1px solid ${sc}28`,borderRadius:999,padding:"2px 8px" }}>{status}</span>
                      </div>
                      <p style={{ fontSize:11,color:"rgba(255,255,255,0.22)" }}>{key.doctor_name||"Any doctor"} · {key.hospital_name||"Any hospital"}</p>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 0",textAlign:"center" }}>
                <div style={{ width:52,height:52,borderRadius:16,background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}>
                  <Shield size={22} style={{ color:"rgba(255,255,255,0.1)" }}/>
                </div>
                <p style={{ fontSize:12,color:"rgba(255,255,255,0.22)" }}>No access keys yet</p>
                <button onClick={()=>setAccessKeyModalOpen(true)} style={{ marginTop:8,background:"none",border:"none",color:"#34d399",fontSize:12,fontWeight:600,cursor:"pointer" }}>+ Generate first key</button>
              </div>
            )}
          </div>
        </div>

        {/* DISCLAIMER */}
        <div style={{ marginTop:24,background:"rgba(251,191,36,0.04)",border:"1px solid rgba(251,191,36,0.11)",borderRadius:15,padding:"14px 20px",display:"flex",alignItems:"flex-start",gap:12, animation:"_up .6s .48s ease both",opacity:0,animationFillMode:"forwards" }}>
          <AlertTriangle size={14} style={{ color:"#fbbf24",flexShrink:0,marginTop:1 }}/>
          <p style={{ fontSize:12,color:"rgba(255,255,255,0.25)",lineHeight:1.65 }}>
            <strong style={{ color:"rgba(251,191,36,0.65)" }}>Medical Disclaimer · </strong>
            This system does not provide medical diagnosis. AI assists with symptom tracking and risk awareness only. Always consult a qualified healthcare professional. Emergency: <strong style={{ color:"#f87171" }}>112</strong> or <strong style={{ color:"#f87171" }}>108</strong>.
          </p>
        </div>
      </main>

      {/* MODALS */}

      <Dialog open={symptomModalOpen} onOpenChange={setSymptomModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" style={{ background:"rgba(6,12,18,0.97)",backdropFilter:"blur(32px)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:22 }}>
          <DialogHeader>
            <DialogTitle style={{ display:"flex",alignItems:"center",gap:8,color:"#f1f5f9",fontSize:17,fontWeight:700 }}>
              <Heart size={17} style={{ color:"#f87171" }}/> Log Symptoms
            </DialogTitle>
            <DialogDescription style={{ color:"rgba(255,255,255,0.3)",fontSize:13 }}>What are you experiencing right now?</DialogDescription>
          </DialogHeader>
          <div style={{ display:"flex",flexDirection:"column",gap:20,padding:"8px 0" }}>
            <div>
              <p style={{ marginBottom:10,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Select Symptoms</p>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {symptoms.map(s=>{
                  const sel=selectedSymptoms.includes(s.id);
                  return (
                    <button key={s.id} onClick={()=>handleSymptomToggle(s.id)} style={{ display:"flex",alignItems:"center",gap:9,borderRadius:12,border:`1px solid ${sel?"rgba(248,113,113,0.38)":"rgba(255,255,255,0.07)"}`,background:sel?"rgba(248,113,113,0.08)":"rgba(255,255,255,0.025)",padding:"10px 12px",cursor:"pointer",transition:"all .15s",textAlign:"left" }}>
                      <span style={{ fontSize:18 }}>{s.icon}</span>
                      <span style={{ fontSize:12,fontWeight:600,color:sel?"#f87171":"rgba(255,255,255,0.42)" }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p style={{ marginBottom:10,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Severity: {symptomSeverity}/10</p>
              <Slider value={[symptomSeverity]} onValueChange={([v])=>setSymptomSeverity(v)} min={1} max={10} step={1} className="mt-2"/>
              <div style={{ display:"flex",justifyContent:"space-between",marginTop:6 }}>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.2)" }}>Mild</span>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.2)" }}>Severe</span>
              </div>
            </div>
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <p style={{ fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Notes</p>
                <button onClick={toggleRecording} style={{ background:isRecording?"rgba(248,113,113,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${isRecording?"rgba(248,113,113,0.28)":"rgba(255,255,255,0.08)"}`,borderRadius:8,padding:"4px 10px",fontSize:11,color:isRecording?"#f87171":"rgba(255,255,255,0.38)",cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
                  {isRecording?<><MicOff size={11}/>Stop</>:<><Mic size={11}/>Voice</>}
                </button>
              </div>
              <Textarea value={symptomNotes} onChange={e=>setSymptomNotes(e.target.value)} placeholder="Describe how you're feeling..." rows={3} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#e2e8f0",fontSize:13 }}/>
            </div>
          </div>
          <div style={{ display:"flex",gap:10,marginTop:8 }}>
            <button onClick={()=>setSymptomModalOpen(false)} style={{ flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px",fontSize:13,color:"rgba(255,255,255,0.45)",cursor:"pointer",fontWeight:600 }}>Cancel</button>
            <button onClick={handleLogSymptoms} disabled={!selectedSymptoms.length} style={{ flex:1,background:selectedSymptoms.length?"linear-gradient(135deg,#dc2626,#b91c1c)":"rgba(255,255,255,0.04)",border:"none",borderRadius:12,padding:"13px",fontSize:13,color:selectedSymptoms.length?"#fff":"rgba(255,255,255,0.2)",cursor:selectedSymptoms.length?"pointer":"not-allowed",fontWeight:700,boxShadow:selectedSymptoms.length?"0 4px 20px rgba(220,38,38,0.3)":"none" }}>
              Log Symptoms
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sleepModalOpen} onOpenChange={setSleepModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ background:"rgba(6,12,18,0.97)",backdropFilter:"blur(32px)",border:"1px solid rgba(129,140,248,0.18)",borderRadius:22 }}>
          <DialogHeader>
            <DialogTitle style={{ display:"flex",alignItems:"center",gap:8,color:"#f1f5f9",fontSize:17,fontWeight:700 }}>
              <Moon size={17} style={{ color:"#818cf8" }}/> Log Sleep
            </DialogTitle>
            <DialogDescription style={{ color:"rgba(255,255,255,0.3)",fontSize:13 }}>How was your rest last night?</DialogDescription>
          </DialogHeader>
          <div style={{ display:"flex",flexDirection:"column",gap:20,padding:"8px 0" }}>
            <div>
              <p style={{ marginBottom:10,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Hours Slept: {sleepHours}h</p>
              <Slider value={[sleepHours]} onValueChange={([v])=>setSleepHours(v)} min={1} max={14} step={0.5} className="mt-2"/>
              <div style={{ display:"flex",justifyContent:"space-between",marginTop:6 }}>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.2)" }}>1h</span>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.2)" }}>14h</span>
              </div>
            </div>
            <div>
              <p style={{ marginBottom:10,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Sleep Quality</p>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {sleepQualityOptions.map(opt=>{
                  const sel=sleepQuality===opt.value;
                  return (
                    <button key={opt.value} onClick={()=>setSleepQuality(opt.value as any)} style={{ borderRadius:13,border:`1px solid ${sel?"rgba(129,140,248,0.38)":"rgba(255,255,255,0.07)"}`,background:sel?"rgba(129,140,248,0.1)":"rgba(255,255,255,0.025)",padding:"14px",textAlign:"center",cursor:"pointer",transition:"all .15s" }}>
                      <div style={{ fontSize:26 }}>{opt.emoji}</div>
                      <p style={{ marginTop:6,fontSize:12,fontWeight:700,color:sel?"#818cf8":"rgba(255,255,255,0.35)" }}>{opt.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display:"flex",gap:10,marginTop:8 }}>
            <button onClick={()=>setSleepModalOpen(false)} style={{ flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px",fontSize:13,color:"rgba(255,255,255,0.45)",cursor:"pointer",fontWeight:600 }}>Cancel</button>
            <button onClick={handleLogSleep} style={{ flex:1,background:"linear-gradient(135deg,#4f46e5,#6d28d9)",border:"none",borderRadius:12,padding:"13px",fontSize:13,color:"#fff",cursor:"pointer",fontWeight:700,boxShadow:"0 4px 20px rgba(109,40,217,0.35)" }}>Log Sleep</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={accessKeyModalOpen} onOpenChange={setAccessKeyModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ background:"rgba(6,12,18,0.97)",backdropFilter:"blur(32px)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:22 }}>
          <DialogHeader>
            <DialogTitle style={{ display:"flex",alignItems:"center",gap:8,color:"#f1f5f9",fontSize:17,fontWeight:700 }}>
              <Shield size={17} style={{ color:"#34d399" }}/> Doctor Access Key
            </DialogTitle>
            <DialogDescription style={{ color:"rgba(255,255,255,0.3)",fontSize:13 }}>Secure one-time key for your doctor</DialogDescription>
          </DialogHeader>
          {!generatedKey?(
            <>
              <div style={{ display:"flex",flexDirection:"column",gap:14,padding:"8px 0" }}>
                {[
                  {id:"dn",label:"Doctor's Name",val:doctorName,set:setDoctorName,ph:"Dr. Sharma"},
                  {id:"hn",label:"Hospital / Clinic",val:hospitalName,set:setHospitalName,ph:"Apollo Hospital"},
                  {id:"vp",label:"Visit Purpose",val:visitPurpose,set:setVisitPurpose,ph:"General checkup"},
                ].map(({id,label,val,set,ph})=>(
                  <div key={id}>
                    <p style={{ marginBottom:6,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>{label}</p>
                    <Input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#e2e8f0",fontSize:13 }}/>
                  </div>
                ))}
                <div style={{ background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.14)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8 }}>
                  <Clock size={13} style={{ color:"#34d399" }}/>
                  <span style={{ fontSize:12,color:"#34d399" }}>Expires automatically in 24 hours</span>
                </div>
              </div>
              <div style={{ display:"flex",gap:10,marginTop:8 }}>
                <button onClick={()=>setAccessKeyModalOpen(false)} style={{ flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px",fontSize:13,color:"rgba(255,255,255,0.45)",cursor:"pointer",fontWeight:600 }}>Cancel</button>
                <button onClick={handleGenerateAccessKey} style={{ flex:1,background:"linear-gradient(135deg,#059669,#047857)",border:"none",borderRadius:12,padding:"13px",fontSize:13,color:"#fff",cursor:"pointer",fontWeight:700,boxShadow:"0 4px 20px rgba(5,150,105,0.3)" }}>Generate Key</button>
              </div>
            </>
          ):(
            <div style={{ padding:"8px 0" }}>
              <div style={{ textAlign:"center",background:"rgba(52,211,153,0.04)",border:"2px dashed rgba(52,211,153,0.22)",borderRadius:18,padding:"30px 20px",marginBottom:16 }}>
                <div style={{ width:52,height:52,borderRadius:16,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.18)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                  <Shield size={24} style={{ color:"#34d399" }}/>
                </div>
                <p style={{ marginBottom:8,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em" }}>Your Secure Access Key</p>
                <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:"#34d399",letterSpacing:"0.04em" }}>{generatedKey.key}</p>
                <button onClick={()=>copyAccessKey(generatedKey.key)} className="db-btn" style={{ marginTop:14,background:"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.18)",borderRadius:10,padding:"8px 20px",fontSize:12,color:"#38bdf8",fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6 }}>
                  {keyCopied?<><CheckCircle2 size={12} style={{ color:"#34d399" }}/>Copied!</>:<><Copy size={12}/>Copy Key</>}
                </button>
              </div>
              {["One-time use only","Expires in 24 hours","Cryptographically secured"].map(t=>(
                <div key={t} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                  <CheckCircle2 size={13} style={{ color:"#34d399" }}/>
                  <span style={{ fontSize:12,color:"rgba(255,255,255,0.35)" }}>{t}</span>
                </div>
              ))}
              <button onClick={()=>{setGeneratedKey(null);setDoctorName("");setHospitalName("");setVisitPurpose("");setAccessKeyModalOpen(false);}} style={{ marginTop:16,width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px",fontSize:13,color:"#e2e8f0",cursor:"pointer",fontWeight:600 }}>Done</button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={aiInsightModalOpen} onOpenChange={setAiInsightModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" style={{ background:"rgba(6,12,18,0.97)",backdropFilter:"blur(32px)",border:"1px solid rgba(56,189,248,0.18)",borderRadius:22 }}>
          <DialogHeader>
            <DialogTitle style={{ display:"flex",alignItems:"center",gap:8,color:"#f1f5f9",fontSize:17,fontWeight:700 }}>
              <Brain size={17} style={{ color:"#38bdf8" }}/> AI Health Insights
            </DialogTitle>
            <DialogDescription style={{ color:"rgba(255,255,255,0.3)",fontSize:13 }}>Detailed analysis based on your health patterns</DialogDescription>
          </DialogHeader>
          {aiAnalysis&&(
            <div style={{ display:"flex",flexDirection:"column",gap:14,padding:"8px 0" }}>
              <div style={{ background:urgencyBg,border:`1px solid ${scoreColor}22`,borderRadius:14,padding:"14px 16px" }}>
                <p style={{ marginBottom:4,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Urgency Level</p>
                <p style={{ fontSize:18,fontWeight:800,color:scoreColor,textTransform:"capitalize",letterSpacing:"-0.02em" }}>{aiAnalysis.urgencyLevel}</p>
              </div>
              <div style={{ background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 16px" }}>
                <p style={{ marginBottom:12,fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Analysis Reasoning</p>
                {aiAnalysis.reasoning.map((r,i)=>(
                  <div key={i} style={{ display:"flex",gap:8,marginBottom:10 }}>
                    <ArrowRight size={13} style={{ color:"#38bdf8",flexShrink:0,marginTop:2 }}/>
                    <span style={{ fontSize:13,color:"rgba(255,255,255,0.42)",lineHeight:1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.14)",borderRadius:14,padding:"14px 16px" }}>
                <p style={{ marginBottom:6,fontSize:10,color:"#38bdf8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em" }}>Executive Summary</p>
                <p style={{ fontSize:13,color:"rgba(255,255,255,0.42)",lineHeight:1.65 }}>{aiAnalysis.summary}</p>
              </div>
              <div style={{ background:"rgba(251,191,36,0.04)",border:"1px solid rgba(251,191,36,0.12)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:8 }}>
                <AlertTriangle size={13} style={{ color:"#fbbf24" }}/>
                <p style={{ fontSize:11,color:"rgba(255,255,255,0.28)" }}>AI assists with risk awareness only — not a medical diagnosis.</p>
              </div>
            </div>
          )}
          <button onClick={()=>setAiInsightModalOpen(false)} style={{ width:"100%",background:"linear-gradient(135deg,#0ea5e9,#0284c7)",border:"none",borderRadius:12,padding:"13px",fontSize:13,color:"#fff",cursor:"pointer",fontWeight:700,boxShadow:"0 4px 20px rgba(14,165,233,0.3)",marginTop:8 }}>
            Got it
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}