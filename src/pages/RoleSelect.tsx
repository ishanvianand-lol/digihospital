import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Stethoscope, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "../supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";

export default function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Agar user already role choose kar chuka hai toh redirect karo
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const role = user.user_metadata?.role;
    if (role === "doctor") navigate("/doctor-onboarding");
    else if (role === "patient") navigate("/onboarding");
  }, [user, navigate]);

  const handleContinue = async () => {
    if (!selectedRole || !user) return;
    setLoading(true);

    try {
      // Role ko Supabase user metadata mein save karo
      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole },
      });
      if (error) throw error;

      if (selectedRole === "doctor") {
        navigate("/doctor-onboarding");
      } else {
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Sora', system-ui, sans-serif", position:"relative", overflowX:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes _spin  { to { transform: rotate(360deg); } }
        @keyframes _up    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes _blob1 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(50px,-40px)scale(1.1)} 70%{transform:translate(-30px,25px)scale(.94)} }
        @keyframes _blob2 { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(-40px,30px)scale(1.07)} 70%{transform:translate(25px,-20px)scale(.97)} }

        .role-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
        .role-card { transition: all .25s cubic-bezier(.4,0,.2,1) !important; }
        .role-card:hover { transform: translateY(-4px) !important; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div className="role-blob" style={{ width:600,height:600,top:-150,left:-150, background:"radial-gradient(ellipse,rgba(14,165,233,0.12) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="role-blob" style={{ width:500,height:500,bottom:-150,right:-150, background:"radial-gradient(ellipse,rgba(99,102,241,0.08) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      {/* Header */}
      <header style={{ position:"relative", zIndex:1, borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(6,12,18,0.8)", backdropFilter:"blur(20px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 40px", height:72, display:"flex", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#38bdf8,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(56,189,248,0.3)" }}>
              <Activity size={20} style={{ color:"#fff" }} />
            </div>
            <span style={{ fontSize:18, fontWeight:800, color:"rgba(255,255,255,0.88)", letterSpacing:"-0.01em" }}>TrustHeal</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 72px)", padding:"60px 24px" }}>
        <div style={{ width:"100%", maxWidth:900, animation:"_up .7s ease both" }}>
          
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <h1 style={{ fontSize:"clamp(32px,4vw,44px)", fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:14, letterSpacing:"-0.03em" }}>
              Who are you joining as?
            </h1>
            <p style={{ fontSize:16, color:"rgba(255,255,255,0.32)", lineHeight:1.6 }}>
              Select your role to get a personalized experience
            </p>
          </div>

          {/* Role Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))", gap:24, marginBottom:48 }}>
            
            {/* Patient */}
            <div
              onClick={() => setSelectedRole("patient")}
              className="role-card"
              style={{
                position:"relative",
                cursor:"pointer",
                borderRadius:20,
                border:`2px solid ${selectedRole === "patient" ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                background:selectedRole === "patient" ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.03)",
                padding:"36px 32px",
                boxShadow:selectedRole === "patient" ? "0 12px 40px rgba(56,189,248,0.2)" : "0 4px 20px rgba(0,0,0,0.3)"
              }}
            >
              {selectedRole === "patient" && (
                <div style={{ position:"absolute", top:20, right:20 }}>
                  <CheckCircle2 size={28} style={{ color:"#38bdf8" }} />
                </div>
              )}
              <div
                style={{
                  width:72,
                  height:72,
                  marginBottom:24,
                  borderRadius:18,
                  background:selectedRole === "patient" ? "linear-gradient(135deg,#38bdf8,#0284c7)" : "rgba(255,255,255,0.05)",
                  display:"inline-flex",
                  alignItems:"center",
                  justifyContent:"center",
                  boxShadow:selectedRole === "patient" ? "0 8px 24px rgba(56,189,248,0.3)" : "none",
                  transition:"all .3s"
                }}
              >
                <User size={36} style={{ color:selectedRole === "patient" ? "#fff" : "rgba(255,255,255,0.35)" }} />
              </div>
              <h2 style={{ fontSize:24, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:12, letterSpacing:"-0.02em" }}>Patient</h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.7, marginBottom:24 }}>
                Track your health, consult doctors, manage your medical records, and get AI-powered health insights.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  "Health dashboard & tracking",
                  "Book doctor consultations",
                  "AI symptom checker",
                  "Medical records storage",
                ].map((f) => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div
                      style={{
                        width:6,
                        height:6,
                        borderRadius:"50%",
                        background:selectedRole === "patient" ? "#38bdf8" : "rgba(255,255,255,0.25)",
                        flexShrink:0
                      }}
                    />
                    <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)", fontWeight:500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor */}
            <div
              onClick={() => setSelectedRole("doctor")}
              className="role-card"
              style={{
                position:"relative",
                cursor:"pointer",
                borderRadius:20,
                border:`2px solid ${selectedRole === "doctor" ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                background:selectedRole === "doctor" ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                padding:"36px 32px",
                boxShadow:selectedRole === "doctor" ? "0 12px 40px rgba(52,211,153,0.2)" : "0 4px 20px rgba(0,0,0,0.3)"
              }}
            >
              {selectedRole === "doctor" && (
                <div style={{ position:"absolute", top:20, right:20 }}>
                  <CheckCircle2 size={28} style={{ color:"#34d399" }} />
                </div>
              )}
              <div
                style={{
                  width:72,
                  height:72,
                  marginBottom:24,
                  borderRadius:18,
                  background:selectedRole === "doctor" ? "linear-gradient(135deg,#34d399,#10b981)" : "rgba(255,255,255,0.05)",
                  display:"inline-flex",
                  alignItems:"center",
                  justifyContent:"center",
                  boxShadow:selectedRole === "doctor" ? "0 8px 24px rgba(52,211,153,0.3)" : "none",
                  transition:"all .3s"
                }}
              >
                <Stethoscope size={36} style={{ color:selectedRole === "doctor" ? "#fff" : "rgba(255,255,255,0.35)" }} />
              </div>
              <h2 style={{ fontSize:24, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:12, letterSpacing:"-0.02em" }}>Doctor</h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.7, marginBottom:24 }}>
                Manage your patients, conduct virtual consultations, and access professional medical tools.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  "Patient management panel",
                  "Virtual consultations",
                  "Prescription management",
                  "Verified doctor badge",
                ].map((f) => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div
                      style={{
                        width:6,
                        height:6,
                        borderRadius:"50%",
                        background:selectedRole === "doctor" ? "#34d399" : "rgba(255,255,255,0.25)",
                        flexShrink:0
                      }}
                    />
                    <span style={{ fontSize:13, color:"rgba(255,255,255,0.45)", fontWeight:500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div style={{ textAlign:"center" }}>
            <button
              onClick={handleContinue}
              disabled={!selectedRole || loading}
              style={{
                display:"inline-flex",
                alignItems:"center",
                gap:12,
                background:!selectedRole || loading ? "rgba(56,189,248,0.2)" : "linear-gradient(135deg,#0ea5e9,#0284c7)",
                border:"none",
                borderRadius:14,
                padding:"16px 44px",
                fontSize:16,
                color:"#fff",
                fontWeight:700,
                cursor:!selectedRole || loading ? "not-allowed" : "pointer",
                boxShadow:!selectedRole || loading ? "none" : "0 8px 32px rgba(14,165,233,0.35)",
                transition:"all .2s",
                opacity:!selectedRole || loading ? 0.5 : 1
              }}
            >
              {loading ? (
                <>
                  <div style={{ width:20, height:20, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"_spin .6s linear infinite" }} />
                  Loading...
                </>
              ) : (
                <>
                  Continue as{" "}
                  {selectedRole === "doctor"
                    ? "Doctor"
                    : selectedRole === "patient"
                    ? "Patient"
                    : "..."}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            <p style={{ marginTop:24, fontSize:12, color:"rgba(255,255,255,0.22)" }}>
              You cannot change your role later. Choose carefully.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}