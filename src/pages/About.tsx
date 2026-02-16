import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import {
  Shield,
  Brain,
  Heart,
  Lock,
  CheckCircle2,
  Activity,
  ArrowRight,
  Users,
  AlertTriangle,
  Database,
} from "lucide-react";

export default function About() {

  const glass = (accent = "rgba(255,255,255,0.06)"): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${accent}`,
    borderRadius: 22,
    boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
  });

  return (
    <div style={{ minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Sora', system-ui, sans-serif", position:"relative", overflowX:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes _up    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes _blob1 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(50px,-40px)scale(1.1)} 70%{transform:translate(-30px,25px)scale(.94)} }
        @keyframes _blob2 { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(-40px,30px)scale(1.07)} 70%{transform:translate(25px,-20px)scale(.97)} }
        @keyframes _float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }

        .abt-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
        .abt-card { transition: border-color .22s ease, transform .22s ease !important; }
        .abt-card:hover { border-color: rgba(56,189,248,0.3) !important; transform: translateY(-4px) !important; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div className="abt-blob" style={{ width:700,height:700,top:-200,left:-200, background:"radial-gradient(ellipse,rgba(14,165,233,0.1) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="abt-blob" style={{ width:550,height:550,bottom:-150,right:-150, background:"radial-gradient(ellipse,rgba(99,102,241,0.07) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      <Header />

      <main style={{ position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto", padding:"48px 24px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:72, animation:"_up .7s ease both" }}>
          <h1 style={{ fontSize:"clamp(36px,5vw,56px)", fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:20, letterSpacing:"-0.04em" }}>
            About TrustHeal
          </h1>
          <p style={{ maxWidth:680, margin:"0 auto", fontSize:17, color:"rgba(255,255,255,0.35)", lineHeight:1.7 }}>
            Revolutionizing preventive healthcare through AI-powered insights and blockchain-inspired data security
          </p>
        </div>

        {/* Mission */}
        <section style={{ marginBottom:72, animation:"_up .7s .1s ease both", opacity:0, animationFillMode:"forwards" }}>
          <div style={{ ...glass("rgba(56,189,248,0.11)"), padding:"48px 44px", maxWidth:1000, margin:"0 auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
              <div>
                <h2 style={{ fontSize:32, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:20, letterSpacing:"-0.02em" }}>Our Mission</h2>
                <p style={{ fontSize:15, color:"rgba(255,255,255,0.4)", lineHeight:1.8 }}>
                  TrustHeal aims to democratize healthcare by putting powerful health monitoring tools in everyone's hands. We believe that preventive care, powered by AI insights and secured by modern cryptography, can significantly improve health outcomes worldwide.
                </p>
              </div>
              <div style={{ display:"flex", justifyContent:"center", alignItems:"center" }}>
                <div style={{ position:"relative" }}>
                  <div style={{
                    position:"absolute",
                    inset:-20,
                    borderRadius:"50%",
                    background:"radial-gradient(circle,rgba(248,113,113,0.2) 0%,transparent 70%)",
                    animation:"_float 6s ease-in-out infinite"
                  }} />
                  <div style={{
                    width:200,
                    height:200,
                    borderRadius:"50%",
                    background:"linear-gradient(135deg,rgba(248,113,113,0.15),rgba(239,68,68,0.1))",
                    border:"2px solid rgba(248,113,113,0.3)",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    boxShadow:"0 20px 60px rgba(248,113,113,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                  }}>
                    <Heart size={80} style={{ color:"#f87171" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ marginBottom:72, animation:"_up .7s .2s ease both", opacity:0, animationFillMode:"forwards" }}>
          <h2 style={{ textAlign:"center", fontSize:"clamp(28px,3.5vw,40px)", fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:44, letterSpacing:"-0.03em" }}>
            Key Features
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
            {[
              {
                icon: Brain,
                title: "AI Health Intelligence",
                description: "Advanced algorithms analyze your symptoms, sleep patterns, and health history to provide personalized risk assessments and recommendations.",
                color: "#818cf8"
              },
              {
                icon: Shield,
                title: "Blockchain Security",
                description: "Your medical data is protected with blockchain-inspired encryption. Only you control who can access your health records.",
                color: "#34d399"
              },
              {
                icon: Lock,
                title: "One-Time Access Keys",
                description: "Generate cryptographic keys for doctor visits that are time-limited, visit-specific, and cannot be reused.",
                color: "#fbbf24"
              },
              {
                icon: Activity,
                title: "Daily Health Logging",
                description: "Track symptoms with severity ratings, log sleep quality, and build a comprehensive health timeline.",
                color: "#f87171"
              },
              {
                icon: Users,
                title: "Doctor Dashboard",
                description: "Healthcare providers can securely access patient summaries, symptom timelines, and AI insights.",
                color: "#38bdf8"
              },
              {
                icon: Database,
                title: "Decentralized Health ID",
                description: "Each user receives a unique DID that serves as their secure health identity across the platform.",
                color: "#a78bfa"
              },
            ].map((feature, index) => (
              <div key={index} className="abt-card" style={{ ...glass(`${feature.color}18`), padding:"28px 26px" }}>
                <div style={{
                  width:56,
                  height:56,
                  marginBottom:20,
                  borderRadius:15,
                  background:`${feature.color}18`,
                  border:`1px solid ${feature.color}28`,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  boxShadow:`0 4px 20px ${feature.color}20`
                }}>
                  <feature.icon size={28} style={{ color:feature.color }} />
                </div>
                <h3 style={{ fontSize:17, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:10, letterSpacing:"-0.01em" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.38)", lineHeight:1.7 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section style={{ marginBottom:72, animation:"_up .7s .3s ease both", opacity:0, animationFillMode:"forwards" }}>
          <h2 style={{ textAlign:"center", fontSize:"clamp(28px,3.5vw,40px)", fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:44, letterSpacing:"-0.03em" }}>
            How It Works
          </h2>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            {[
              {
                step: 1,
                title: "Create Your Health Profile",
                description: "Complete a comprehensive medical onboarding including your health history, allergies, and lifestyle factors.",
              },
              {
                step: 2,
                title: "Log Daily Health Data",
                description: "Track symptoms when you feel unwell, log your sleep quality, and maintain a health diary.",
              },
              {
                step: 3,
                title: "Receive AI Insights",
                description: "Our AI engine analyzes your data to provide health risk scores, pattern detection, and doctor recommendations.",
              },
              {
                step: 4,
                title: "Share Securely with Doctors",
                description: "Generate one-time access keys when visiting healthcare providers for secure, controlled data sharing.",
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:32, padding:"24px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16 }}
              >
                <div style={{
                  width:48,
                  height:48,
                  flexShrink:0,
                  borderRadius:"50%",
                  background:"linear-gradient(135deg,#38bdf8,#0284c7)",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  fontSize:20,
                  fontWeight:800,
                  color:"#fff",
                  boxShadow:"0 4px 16px rgba(56,189,248,0.3)"
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize:17, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:8 }}>{item.title}</h3>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.7 }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy & Security */}
        <section style={{ marginBottom:72, animation:"_up .7s .4s ease both", opacity:0, animationFillMode:"forwards" }}>
          <div style={{ ...glass("rgba(52,211,153,0.08)"), padding:"40px 44px", maxWidth:900, margin:"0 auto" }}>
            <h2 style={{ textAlign:"center", fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:32, letterSpacing:"-0.02em" }}>
              Privacy & Security
            </h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:18 }}>
              {[
                "All data encrypted at rest and in transit",
                "No third-party data sharing without consent",
                "One-time cryptographic access keys",
                "Complete audit trail of all data access",
                "User-controlled data deletion",
                "HIPAA-compliant architecture",
              ].map((item) => (
                <div key={item} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <CheckCircle2 size={20} style={{ color:"#34d399", flexShrink:0 }} />
                  <span style={{ fontSize:14, color:"rgba(255,255,255,0.65)", fontWeight:500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section style={{ marginBottom:72, animation:"_up .7s .5s ease both", opacity:0, animationFillMode:"forwards" }}>
          <div style={{ ...glass("rgba(251,191,36,0.08)"), maxWidth:1000, margin:"0 auto", padding:"36px 40px", border:"2px solid rgba(251,191,36,0.15)" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:20 }}>
              <div style={{ width:48, height:48, flexShrink:0, borderRadius:14, background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <AlertTriangle size={26} style={{ color:"#fbbf24" }} />
              </div>
              <div>
                <h2 style={{ fontSize:22, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:16, letterSpacing:"-0.02em" }}>
                  Medical Disclaimer
                </h2>
                <div style={{ display:"flex", flexDirection:"column", gap:14, fontSize:14, color:"rgba(255,255,255,0.45)", lineHeight:1.75 }}>
                  <p>
                    <strong style={{ color:"rgba(255,255,255,0.7)" }}>This system does not provide medical diagnosis.</strong> TrustHeal is designed to assist with symptom tracking, health monitoring, and risk awareness only.
                  </p>
                  <p>
                    The AI-powered health scores and recommendations are generated using pattern analysis and should not be considered as medical advice, diagnosis, or treatment recommendations.
                  </p>
                  <p>
                    <strong style={{ color:"rgba(255,255,255,0.7)" }}>Always consult a qualified healthcare professional</strong> for medical advice, diagnosis, and treatment. In case of a medical emergency, call your local emergency services immediately.
                  </p>
                  <p>
                    By using TrustHeal, you acknowledge that the platform is intended for informational purposes only and accept full responsibility for your health decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign:"center", animation:"_up .7s .6s ease both", opacity:0, animationFillMode:"forwards" }}>
          <div style={{ ...glass("rgba(56,189,248,0.08)"), padding:"48px 40px", maxWidth:800, margin:"0 auto" }}>
            <h2 style={{ fontSize:32, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:16, letterSpacing:"-0.03em" }}>
              Ready to Take Control of Your Health?
            </h2>
            <p style={{ fontSize:15, color:"rgba(255,255,255,0.35)", marginBottom:36, lineHeight:1.7 }}>
              Join TrustHeal today and experience smarter, more secure healthcare.
            </p>
            <Link to="/auth?mode=signup">
              <button style={{
                display:"inline-flex",
                alignItems:"center",
                gap:12,
                background:"linear-gradient(135deg,#34d399,#10b981)",
                border:"none",
                borderRadius:14,
                padding:"16px 40px",
                fontSize:16,
                color:"#fff",
                fontWeight:700,
                cursor:"pointer",
                boxShadow:"0 8px 32px rgba(52,211,153,0.35)",
                transition:"all .2s"
              }}>
                Get Started Free
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.05)", padding:"36px 24px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
          
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#38bdf8,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Activity size={18} style={{ color:"#fff" }} />
            </div>
            <span style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.82)" }}>TrustHeal</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:24, fontSize:13, color:"rgba(255,255,255,0.28)" }}>
            <Link to="/about" style={{ color:"inherit", textDecoration:"none", transition:"color .2s" }}>About</Link>
            <a href="#" style={{ color:"inherit", textDecoration:"none", transition:"color .2s" }}>Privacy Policy</a>
            <a href="#" style={{ color:"inherit", textDecoration:"none", transition:"color .2s" }}>Terms of Service</a>
            <a href="#" style={{ color:"inherit", textDecoration:"none", transition:"color .2s" }}>Contact</a>
          </div>

          <p style={{ fontSize:13, color:"rgba(255,255,255,0.22)" }}>
            © 2026 TrustHeal. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}