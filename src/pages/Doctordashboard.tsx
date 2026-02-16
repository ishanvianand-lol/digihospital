import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";
import {
  Activity,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Stethoscope,
  TrendingUp,
  Bell,
  Search,
  ChevronRight,
  User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DoctorProfile {
  full_name: string;
  specialization: string;
  verification_status: "pending" | "verified" | "rejected";
  hospital_name: string;
  experience_years: number;
  consultation_fee: number;
}

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  last_visit: string | null;
  condition: string | null;
  status: "active" | "recovered" | "critical";
  created_at: string;
}

// Mock patients data — replace with real Supabase query from your patients table
const MOCK_PATIENTS: Patient[] = [
  { id: "1", full_name: "Rahul Sharma", email: "rahul@email.com", phone: "+91 98765 43210", age: 34, gender: "male", last_visit: "2025-02-10", condition: "Hypertension", status: "active", created_at: "2025-01-15" },
  { id: "2", full_name: "Priya Singh", email: "priya@email.com", phone: "+91 87654 32109", age: 28, gender: "female", last_visit: "2025-02-12", condition: "Migraine", status: "active", created_at: "2025-01-20" },
  { id: "3", full_name: "Amit Kumar", email: "amit@email.com", phone: "+91 76543 21098", age: 52, gender: "male", last_visit: "2025-01-28", condition: "Type 2 Diabetes", status: "critical", created_at: "2024-12-10" },
  { id: "4", full_name: "Sunita Devi", email: "sunita@email.com", phone: null, age: 45, gender: "female", last_visit: "2025-02-05", condition: "Arthritis", status: "active", created_at: "2025-01-05" },
  { id: "5", full_name: "Vikram Patel", email: "vikram@email.com", phone: "+91 65432 10987", age: 22, gender: "male", last_visit: "2025-01-15", condition: "Viral Fever", status: "recovered", created_at: "2025-01-10" },
  { id: "6", full_name: "Meena Joshi", email: "meena@email.com", phone: "+91 54321 09876", age: 38, gender: "female", last_visit: "2025-02-14", condition: "Asthma", status: "active", created_at: "2025-01-25" },
  { id: "7", full_name: "Deepak Rao", email: "deepak@email.com", phone: "+91 43210 98765", age: 61, gender: "male", last_visit: "2025-02-01", condition: "Coronary Artery Disease", status: "critical", created_at: "2024-11-20" },
  { id: "8", full_name: "Anjali Mehta", email: "anjali@email.com", phone: "+91 32109 87654", age: 29, gender: "female", last_visit: "2025-02-08", condition: "PCOS", status: "active", created_at: "2025-02-01" },
];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  active:    { bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)",  text: "#38bdf8",  label: "Active"    },
  recovered: { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)",  text: "#34d399",  label: "Recovered" },
  critical:  { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", text: "#f87171",  label: "Critical"  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [patients] = useState<Patient[]>(MOCK_PATIENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "recovered" | "critical">("all");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Redirect if not logged in ──────────────────────────────────────────────
  useEffect(() => {
    if (user === null) navigate("/auth");
  }, [user, navigate]);

  // ── Fetch doctor profile ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("doctor_profiles")
        .select("full_name,specialization,verification_status,hospital_name,experience_years,consultation_fee")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        // If no profile exists yet, redirect to onboarding
        navigate("/doctor-onboarding");
        return;
      }
      setProfile(data as DoctorProfile);
      setLoadingProfile(false);
    })();
  }, [user, navigate]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // ── Filtered patients ──────────────────────────────────────────────────────
  const filtered = patients.filter((p) => {
    const matchSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.condition || "").toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: patients.length,
    active: patients.filter((p) => p.status === "active").length,
    critical: patients.filter((p) => p.status === "critical").length,
    recovered: patients.filter((p) => p.status === "recovered").length,
  };

  const glass = (): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
  });

  if (loadingProfile) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#050d11", color:"#e2e8f0", fontFamily:"'Sora', system-ui, sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(56,189,248,0.2)", borderTopColor:"#38bdf8", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14 }}>Loading your dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Sora', system-ui, sans-serif", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .patient-row:hover { background: rgba(255,255,255,0.04) !important; }
        .filter-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .stat-card { animation: fadeUp .4s ease both; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header style={{ position:"sticky", top:0, zIndex:10, borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(5,13,17,0.85)", backdropFilter:"blur(20px)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 32px", height:72, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#38bdf8,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(56,189,248,0.3)" }}>
              <Activity size={20} style={{ color:"#fff" }} />
            </div>
            <div>
              <span style={{ fontSize:17, fontWeight:800, color:"rgba(255,255,255,0.88)", letterSpacing:"-0.01em" }}>Digital Hospital</span>
              <span style={{ marginLeft:10, fontSize:11, fontWeight:600, color:"rgba(56,189,248,0.7)", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:6, padding:"2px 8px" }}>Doctor Panel</span>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {/* Verification badge */}
            {profile?.verification_status === "pending" && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:10, padding:"8px 14px" }}>
                <AlertTriangle size={14} style={{ color:"#fbbf24" }} />
                <span style={{ fontSize:12, fontWeight:600, color:"#fbbf24" }}>Verification Pending</span>
              </div>
            )}
            {profile?.verification_status === "verified" && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(52,211,153,0.07)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, padding:"8px 14px" }}>
                <CheckCircle2 size={14} style={{ color:"#34d399" }} />
                <span style={{ fontSize:12, fontWeight:600, color:"#34d399" }}>Verified Doctor</span>
              </div>
            )}

            {/* Notifications */}
            <button style={{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)" }}>
              <Bell size={16} />
            </button>

            {/* Doctor avatar */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"1px solid rgba(56,189,248,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Stethoscope size={16} style={{ color:"#38bdf8" }} />
              </div>
              <div style={{ lineHeight:1.3 }}>
                <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.82)" }}>{profile?.full_name || "Doctor"}</p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{profile?.specialization || ""}</p>
              </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", borderRadius:10, padding:"8px 14px", cursor:"pointer", color:"#f87171", fontSize:13, fontWeight:600 }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <main style={{ position:"relative", zIndex:1, maxWidth:1280, margin:"0 auto", padding:"36px 32px 80px" }}>

        {/* Welcome banner */}
        <div style={{ ...glass(), padding:"28px 32px", marginBottom:28, display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(135deg,rgba(14,165,233,0.06),rgba(99,102,241,0.04))", borderColor:"rgba(56,189,248,0.12)" }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:800, color:"rgba(255,255,255,0.9)", marginBottom:6, letterSpacing:"-0.02em" }}>
              Welcome back, Dr. {profile?.full_name?.split(" ").slice(-1)[0] || "Doctor"} 👋
            </h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)" }}>
              {profile?.hospital_name} · {profile?.experience_years}+ years experience
            </p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>Today</p>
            <p style={{ fontSize:20, fontWeight:700, color:"rgba(255,255,255,0.75)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"short" })}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
          {[
            { label:"Total Patients",  value:stats.total,     icon:<Users size={20} />,        color:"#38bdf8", delay:"0s" },
            { label:"Active",          value:stats.active,    icon:<Activity size={20} />,      color:"#38bdf8", delay:".06s" },
            { label:"Critical",        value:stats.critical,  icon:<AlertTriangle size={20} />, color:"#f87171", delay:".12s" },
            { label:"Recovered",       value:stats.recovered, icon:<TrendingUp size={20} />,    color:"#34d399", delay:".18s" },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ ...glass(), padding:"22px 24px", animationDelay:s.delay }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</span>
                <div style={{ width:36, height:36, borderRadius:10, background:`rgba(${s.color === "#38bdf8" ? "56,189,248" : s.color === "#f87171" ? "248,113,113" : "52,211,153"},0.12)`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>
                  {s.icon}
                </div>
              </div>
              <p style={{ fontSize:36, fontWeight:800, color:"rgba(255,255,255,0.9)", letterSpacing:"-0.03em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Patients Table ─────────────────────────────────────────────────── */}
        <div style={{ ...glass() }}>
          {/* Table header */}
          <div style={{ padding:"22px 28px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:800, color:"rgba(255,255,255,0.88)", marginBottom:4 }}>My Patients</h2>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>{filtered.length} patient{filtered.length !== 1 ? "s" : ""} {statusFilter !== "all" ? `· ${statusFilter}` : ""}</p>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {/* Search */}
              <div style={{ position:"relative" }}>
                <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patients..."
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"9px 14px 9px 34px", fontSize:13, color:"#e2e8f0", outline:"none", width:220 }}
                />
              </div>

              {/* Status filter */}
              <div style={{ display:"flex", gap:6 }}>
                {(["all","active","critical","recovered"] as const).map((f) => (
                  <button key={f} className="filter-btn" onClick={() => setStatusFilter(f)}
                    style={{
                      background: statusFilter === f ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${statusFilter === f ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600,
                      color: statusFilter === f ? "#38bdf8" : "rgba(255,255,255,0.45)", cursor:"pointer", textTransform:"capitalize", transition:"all .15s"
                    }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1.2fr 1fr 0.7fr", gap:16, padding:"12px 28px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            {["Patient", "Condition", "Age / Gender", "Last Visit", "Status", ""].map((h) => (
              <span key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:".06em" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding:"60px 28px", textAlign:"center" }}>
              <Users size={40} style={{ color:"rgba(255,255,255,0.1)", margin:"0 auto 16px", display:"block" }} />
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>No patients found</p>
            </div>
          ) : (
            filtered.map((p, i) => {
              const st = STATUS_COLORS[p.status];
              return (
                <div key={p.id} className="patient-row" style={{
                  display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1.2fr 1fr 0.7fr", gap:16, padding:"16px 28px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  alignItems:"center", cursor:"pointer", transition:"background .15s", background:"transparent"
                }}>
                  {/* Name + email */}
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <User size={16} style={{ color:"rgba(255,255,255,0.4)" }} />
                    </div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.84)", marginBottom:2 }}>{p.full_name}</p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{p.email}</p>
                    </div>
                  </div>

                  {/* Condition */}
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.6)", fontWeight:500 }}>{p.condition || "—"}</span>

                  {/* Age / Gender */}
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>
                    {p.age ? `${p.age}y` : "—"} · {p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "—"}
                  </span>

                  {/* Last visit */}
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>
                    {p.last_visit ? new Date(p.last_visit).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—"}
                  </span>

                  {/* Status badge */}
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:st.bg, border:`1px solid ${st.border}`, borderRadius:8, padding:"5px 12px", width:"fit-content" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:st.text }} />
                    <span style={{ fontSize:12, fontWeight:700, color:st.text }}>{st.label}</span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={16} style={{ color:"rgba(255,255,255,0.2)", marginLeft:"auto" }} />
                </div>
              );
            })
          )}

          {/* Footer */}
          <div style={{ padding:"14px 28px", borderTop:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>Showing {filtered.length} of {patients.length} patients</span>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(255,255,255,0.35)" }}>
              <Clock size={12} />
              <span>Last updated: {new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}</span>
            </div>
          </div>
        </div>

        {/* Bottom info cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:20 }}>
          {/* Upcoming appointments placeholder */}
          <div style={{ ...glass(), padding:"24px 28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <Calendar size={18} style={{ color:"#38bdf8" }} />
              <h3 style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>Today's Schedule</h3>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { time:"10:00 AM", name:"Rahul Sharma",  type:"Follow-up" },
                { time:"11:30 AM", name:"Priya Singh",   type:"Consultation" },
                { time:"02:00 PM", name:"Anjali Mehta",  type:"Consultation" },
                { time:"04:30 PM", name:"Deepak Rao",    type:"Review" },
              ].map((a) => (
                <div key={a.time} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#38bdf8", minWidth:68 }}>{a.time}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.75)" }}>{a.name}</p>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{a.type}</p>
                  </div>
                  <ChevronRight size={14} style={{ color:"rgba(255,255,255,0.2)" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ ...glass(), padding:"24px 28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <TrendingUp size={18} style={{ color:"#34d399" }} />
              <h3 style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>Practice Overview</h3>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { label:"Consultation Fee",  value:`₹${profile?.consultation_fee || "—"}`, color:"#38bdf8" },
                { label:"Years of Experience", value:`${profile?.experience_years || "—"} Years`, color:"#a78bfa" },
                { label:"Total Patients (All Time)", value:patients.length.toString(), color:"#34d399" },
                { label:"Critical Cases",    value:stats.critical.toString(), color:"#f87171" },
              ].map((item) => (
                <div key={item.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>{item.label}</span>
                  <span style={{ fontSize:15, fontWeight:700, color:item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}