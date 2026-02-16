import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Activity,
  Shield,
  Brain,
  Heart,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Header } from "../components/layout/Header";
import { useEffect } from "react";

const features = [
  {
    icon: Brain,
    title: "AI Health Intelligence",
    description:
      "Advanced symptom analysis with personalized health risk scoring and actionable insights.",
  },
  {
    icon: Lock,
    title: "Blockchain Security",
    description:
      "Your medical data is encrypted with blockchain-inspired access control and unique DIDs.",
  },
  {
    icon: Heart,
    title: "Preventive Care",
    description:
      "Track symptoms, sleep patterns, and lifestyle factors to prevent health issues early.",
  },
  {
    icon: Shield,
    title: "Doctor Access Control",
    description:
      "Generate one-time cryptographic keys for secure, time-limited doctor consultations.",
  },
];

const steps = [
  "Complete your health profile",
  "Log daily symptoms and sleep",
  "Get AI-powered health insights",
  "Connect securely with doctors",
];

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const glass = (accent = "rgba(255,255,255,0.06)"): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${accent}`,
    borderRadius: 22,
    boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
  });

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#050d11", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:40, height:40, borderRadius:"50%", border:"2px solid rgba(56,189,248,0.15)", borderTopColor:"#38bdf8", animation:"_spin .8s linear infinite" }} />
        <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

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
        @keyframes _float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes _pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.05)} }
        @keyframes _shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .land-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
        .land-card { transition: border-color .22s ease, transform .22s ease !important; }
        .land-card:hover { border-color: rgba(56,189,248,0.3) !important; transform: translateY(-4px) !important; }
        .land-btn { transition: all .18s !important; }
        .land-btn:hover { transform: translateY(-2px) !important; filter: brightness(1.1) !important; }
        .land-feat { transition: transform .22s cubic-bezier(.4,0,.2,1) !important; }
        .land-feat:hover { transform: translateY(-6px) !important; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.18); border-radius:4px; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div className="land-blob" style={{ width:700,height:700,top:-200,left:-200, background:"radial-gradient(ellipse,rgba(14,165,233,0.1) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="land-blob" style={{ width:550,height:550,top:"20%",right:-180, background:"radial-gradient(ellipse,rgba(99,102,241,0.07) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />
      <div className="land-blob" style={{ width:400,height:400,bottom:"5%",left:"28%", background:"radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 65%)", animation:"_blob3 28s ease-in-out infinite", animationDelay:"-14s" }} />

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      <Header />

      <main style={{ position:"relative", zIndex:1 }}>

        {/* HERO SECTION */}
        <section style={{ padding:"120px 24px 80px", position:"relative" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", textAlign:"center", animation:"_up .8s ease both" }}>
            
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(14,165,233,0.07)", border:"1px solid rgba(14,165,233,0.18)", borderRadius:999, padding:"6px 18px", marginBottom:28 }}>
              <Sparkles size={14} style={{ color:"#38bdf8" }} />
              <span style={{ fontSize:11, color:"#38bdf8", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>AI-Powered Preventive Healthcare</span>
            </div>

            <h1 style={{ lineHeight:1.08, letterSpacing:"-0.04em", fontWeight:800, marginBottom:24 }}>
              <span style={{ display:"block", fontSize:"clamp(40px,6vw,72px)", color:"rgba(255,255,255,0.88)" }}>
                Your Health,{" "}
              </span>
              <span style={{ display:"block", fontSize:"clamp(44px,6.5vw,80px)",
                background:"linear-gradient(100deg,#38bdf8 0%,#34d399 40%,#818cf8 85%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Secured & Intelligent
              </span>
            </h1>

            <p style={{ maxWidth:680, margin:"0 auto 44px", fontSize:17, color:"rgba(255,255,255,0.32)", lineHeight:1.7 }}>
              Experience the future of healthcare with AI-assisted health monitoring, blockchain-secured medical records, and seamless doctor consultations.
            </p>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
              <Link to="/auth?mode=signup">
                <button className="land-btn" style={{
                  background:"linear-gradient(135deg,#0ea5e9,#0284c7)",
                  border:"none",
                  borderRadius:14,
                  padding:"16px 36px",
                  fontSize:16,
                  color:"#fff",
                  fontWeight:700,
                  cursor:"pointer",
                  display:"flex",
                  alignItems:"center",
                  gap:10,
                  boxShadow:"0 8px 32px rgba(14,165,233,0.3)"
                }}>
                  Get Started Free
                  <ArrowRight size={18} />
                </button>
              </Link>
              <Link to="/about">
                <button className="land-btn" style={{
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.12)",
                  borderRadius:14,
                  padding:"16px 36px",
                  fontSize:16,
                  color:"rgba(255,255,255,0.85)",
                  fontWeight:600,
                  cursor:"pointer"
                }}>
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section style={{ padding:"60px 24px", position:"relative" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            
            <div style={{ textAlign:"center", marginBottom:52, animation:"_up .8s .1s ease both", opacity:0, animationFillMode:"forwards" }}>
              <h2 style={{ fontSize:"clamp(32px,4vw,44px)", fontWeight:800, color:"rgba(255,255,255,0.88)", marginBottom:14, letterSpacing:"-0.03em" }}>
                Powered by Advanced Technology
              </h2>
              <p style={{ maxWidth:620, margin:"0 auto", fontSize:16, color:"rgba(255,255,255,0.28)", lineHeight:1.65 }}>
                TrustHeal combines cutting-edge AI with blockchain-inspired security to revolutionize your healthcare experience.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:18, animation:"_up .8s .2s ease both", opacity:0, animationFillMode:"forwards" }}>
              {features.map((feature, index) => (
                <div key={index} className="land-feat land-card" style={{
                  ...glass("rgba(56,189,248,0.11)"),
                  padding:"28px 24px",
                  display:"flex",
                  flexDirection:"column",
                  gap:16
                }}>
                  <div style={{
                    width:52,
                    height:52,
                    borderRadius:15,
                    background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))",
                    border:"1px solid rgba(56,189,248,0.25)",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    boxShadow:"0 4px 20px rgba(56,189,248,0.15)"
                  }}>
                    <feature.icon size={24} style={{ color:"#38bdf8" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:8, letterSpacing:"-0.01em" }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.32)", lineHeight:1.65 }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding:"60px 24px", position:"relative", background:"rgba(255,255,255,0.01)" }}>
          <div style={{ maxWidth:1000, margin:"0 auto" }}>
            
            <div style={{ textAlign:"center", marginBottom:48, animation:"_up .8s .3s ease both", opacity:0, animationFillMode:"forwards" }}>
              <h2 style={{ fontSize:"clamp(32px,4vw,44px)", fontWeight:800, color:"rgba(255,255,255,0.88)", marginBottom:14, letterSpacing:"-0.03em" }}>
                How It Works
              </h2>
              <p style={{ maxWidth:540, margin:"0 auto", fontSize:16, color:"rgba(255,255,255,0.28)" }}>
                Get started in minutes with our simple onboarding process.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, animation:"_up .8s .4s ease both", opacity:0, animationFillMode:"forwards" }}>
              {steps.map((step, index) => (
                <div key={index} style={{
                  ...glass("rgba(52,211,153,0.11)"),
                  padding:"22px 24px",
                  display:"flex",
                  alignItems:"center",
                  gap:18
                }}>
                  <div style={{
                    width:44,
                    height:44,
                    borderRadius:"50%",
                    background:"linear-gradient(135deg,#34d399,#10b981)",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    fontSize:18,
                    fontWeight:800,
                    color:"#fff",
                    flexShrink:0,
                    boxShadow:"0 4px 16px rgba(52,211,153,0.3)"
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.78)", lineHeight:1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section style={{ padding:"80px 24px", position:"relative" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div style={{ ...glass("rgba(56,189,248,0.08)"), padding:"48px 40px", borderRadius:28, animation:"_up .8s .5s ease both", opacity:0, animationFillMode:"forwards" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
                
                <div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:999, padding:"6px 14px", marginBottom:20 }}>
                    <Lock size={13} style={{ color:"#38bdf8" }} />
                    <span style={{ fontSize:11, color:"#38bdf8", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Blockchain Security</span>
                  </div>
                  
                  <h3 style={{ fontSize:"clamp(28px,3.5vw,38px)", fontWeight:800, color:"rgba(255,255,255,0.88)", marginBottom:18, letterSpacing:"-0.02em" }}>
                    Your Data, Your Control
                  </h3>
                  
                  <p style={{ fontSize:15, color:"rgba(255,255,255,0.32)", lineHeight:1.7, marginBottom:28 }}>
                    Every piece of your medical data is encrypted with a unique Decentralized Health ID (DID). Doctors can only access your records with your explicit permission through time-limited, one-time cryptographic keys.
                  </p>
                  
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {[
                      "End-to-end encryption",
                      "One-time access keys",
                      "Complete audit trail",
                      "User-controlled permissions",
                    ].map((item, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <CheckCircle2 size={18} style={{ color:"#34d399", flexShrink:0 }} />
                        <span style={{ fontSize:14, color:"rgba(255,255,255,0.65)", fontWeight:500 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex", justifyContent:"center", alignItems:"center" }}>
                  <div style={{ position:"relative" }}>
                    <div style={{
                      position:"absolute",
                      inset:-20,
                      borderRadius:"50%",
                      background:"radial-gradient(circle,rgba(56,189,248,0.2) 0%,transparent 70%)",
                      animation:"_pulse 4s ease-in-out infinite"
                    }} />
                    <div style={{
                      width:200,
                      height:200,
                      borderRadius:"50%",
                      background:"linear-gradient(135deg,rgba(56,189,248,0.15),rgba(99,102,241,0.1))",
                      border:"2px solid rgba(56,189,248,0.3)",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      boxShadow:"0 20px 60px rgba(56,189,248,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
                      animation:"_float 6s ease-in-out infinite"
                    }}>
                      <Shield size={80} style={{ color:"#38bdf8" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section style={{ padding:"80px 24px 100px", position:"relative" }}>
          <div style={{ maxWidth:900, margin:"0 auto", textAlign:"center", ...glass("rgba(56,189,248,0.08)"), padding:"56px 40px", borderRadius:28, animation:"_up .8s .6s ease both", opacity:0, animationFillMode:"forwards" }}>
            
            <h2 style={{ fontSize:"clamp(32px,4vw,44px)", fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:16, letterSpacing:"-0.03em" }}>
              Ready to Take Control of Your Health?
            </h2>
            
            <p style={{ maxWidth:580, margin:"0 auto 36px", fontSize:16, color:"rgba(255,255,255,0.35)", lineHeight:1.7 }}>
              Join thousands of users who are already experiencing smarter, more secure healthcare.
            </p>
            
            <Link to="/auth?mode=signup">
              <button className="land-btn" style={{
                background:"linear-gradient(135deg,#34d399,#10b981)",
                border:"none",
                borderRadius:14,
                padding:"16px 40px",
                fontSize:16,
                color:"#fff",
                fontWeight:700,
                cursor:"pointer",
                display:"inline-flex",
                alignItems:"center",
                gap:10,
                boxShadow:"0 8px 32px rgba(52,211,153,0.35)"
              }}>
                Create Free Account
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"32px 24px", position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
          
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#38bdf8,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Activity size={18} style={{ color:"#fff" }} />
            </div>
            <span style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.82)" }}>TrustHeal</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:24, fontSize:13, color:"rgba(255,255,255,0.28)" }}>
            <Link to="/about" style={{ color:"inherit", textDecoration:"none", transition:"color .2s" }}>About</Link>
            <Link to="/about" style={{ color:"inherit", textDecoration:"none", transition:"color .2s" }}>Privacy Policy</Link>
            <Link to="/about" style={{ color:"inherit", textDecoration:"none", transition:"color .2s" }}>Terms</Link>
          </div>

          <p style={{ fontSize:13, color:"rgba(255,255,255,0.22)" }}>
            © 2026 TrustHeal. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}