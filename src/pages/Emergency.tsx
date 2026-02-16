import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Header } from "../components/layout/Header";
import { mockHospitals } from "../lib/mockData";
import {
  AlertTriangle,
  Phone,
  MapPin,
  Navigation,
  Ambulance,
  Heart,
  Shield,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function Emergency() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sosActivated, setSosActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emergencySent, setEmergencySent] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (sosActivated && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (sosActivated && countdown === 0) {
      setEmergencySent(true);
    }
    return () => clearTimeout(timer);
  }, [sosActivated, countdown]);

  const handleSOS = () => {
    setSosActivated(true);
  };

  const cancelSOS = () => {
    setSosActivated(false);
    setCountdown(5);
    setEmergencySent(false);
  };

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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes _spin  { to { transform: rotate(360deg); } }
        @keyframes _up    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes _blob1 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(50px,-40px)scale(1.1)} 70%{transform:translate(-30px,25px)scale(.94)} }
        @keyframes _blob2 { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(-40px,30px)scale(1.07)} 70%{transform:translate(25px,-20px)scale(.97)} }
        @keyframes _pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes _pulse-ring { 0%{transform:scale(.9);opacity:1} 100%{transform:scale(1.8);opacity:0} }

        .emg-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
        .emg-card { transition: border-color .22s ease, transform .22s ease !important; }
        .emg-card:hover { border-color: rgba(248,113,113,0.3) !important; transform: translateY(-2px) !important; }
        .emg-btn { transition: all .18s !important; }
        .emg-btn:hover { transform: translateY(-1px) !important; filter: brightness(1.1) !important; }
        .sos-button { position:relative; animation: _pulse 2s ease-in-out infinite; }
        .sos-button::before { content:''; position:absolute; inset:-10px; border-radius:50%; border:3px solid rgba(220,38,38,0.5); animation: _pulse-ring 1.5s ease-out infinite; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#0d0505 0%,#0f0606 50%,#090707 100%)" }} />
      <div className="emg-blob" style={{ width:700,height:700,top:-200,left:-200, background:"radial-gradient(ellipse,rgba(220,38,38,0.15) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="emg-blob" style={{ width:550,height:550,bottom:-150,right:-150, background:"radial-gradient(ellipse,rgba(239,68,68,0.1) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      <Header />

      <main style={{ position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto", padding:"32px 24px 80px" }}>

        <button
          onClick={() => navigate("/dashboard")}
          className="emg-btn"
          style={{
            display:"flex",
            alignItems:"center",
            gap:8,
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:12,
            padding:"10px 18px",
            fontSize:13,
            color:"rgba(255,255,255,0.7)",
            fontWeight:600,
            cursor:"pointer",
            marginBottom:32
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Emergency SOS Section */}
        <div style={{ marginBottom:48, animation:"_up .6s ease both" }}>
          {!sosActivated ? (
            <div style={{ textAlign:"center" }}>
              <h1 style={{ fontSize:42, fontWeight:800, color:"#ef4444", marginBottom:16, letterSpacing:"-0.03em" }}>
                Emergency SOS
              </h1>
              <p style={{ fontSize:15, color:"rgba(255,255,255,0.32)", marginBottom:56 }}>
                Tap the button below to alert emergency services
              </p>

              <button
                onClick={handleSOS}
                className="sos-button"
                style={{
                  width:240,
                  height:240,
                  margin:"0 auto",
                  borderRadius:"50%",
                  background:"linear-gradient(135deg,#dc2626,#991b1b)",
                  border:"4px solid rgba(220,38,38,0.4)",
                  display:"flex",
                  flexDirection:"column",
                  alignItems:"center",
                  justifyContent:"center",
                  color:"#fff",
                  cursor:"pointer",
                  boxShadow:"0 20px 60px rgba(220,38,38,0.6), inset 0 1px 0 rgba(255,255,255,0.2)"
                }}
              >
                <AlertTriangle size={72} style={{ marginBottom:16 }} />
                <span style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.02em" }}>SOS</span>
              </button>

              <p style={{ marginTop:56, fontSize:13, color:"rgba(255,255,255,0.25)" }}>
                Only use in case of genuine medical emergency
              </p>
            </div>
          ) : !emergencySent ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:240, height:240, margin:"0 auto", borderRadius:"50%", background:"rgba(220,38,38,0.1)", border:"2px solid rgba(220,38,38,0.3)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>
                <span style={{ fontSize:88, fontWeight:800, color:"#ef4444", lineHeight:1, letterSpacing:"-0.04em" }}>{countdown}</span>
                <span style={{ marginTop:8, fontSize:14, color:"#ef4444", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em" }}>seconds</span>
              </div>

              <h2 style={{ marginTop:36, fontSize:26, fontWeight:800, color:"rgba(255,255,255,0.88)", marginBottom:12 }}>
                Emergency Alert Sending...
              </h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)", marginBottom:32 }}>
                Tap cancel if this was accidental
              </p>

              <button
                onClick={cancelSOS}
                className="emg-btn"
                style={{
                  background:"rgba(248,113,113,0.1)",
                  border:"2px solid rgba(248,113,113,0.3)",
                  borderRadius:12,
                  padding:"14px 32px",
                  fontSize:15,
                  color:"#f87171",
                  fontWeight:700,
                  cursor:"pointer"
                }}
              >
                Cancel Emergency
              </button>
            </div>
          ) : (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:160, height:160, margin:"0 auto", borderRadius:"50%", background:"rgba(52,211,153,0.1)", border:"2px solid rgba(52,211,153,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <CheckCircle2 size={72} style={{ color:"#34d399" }} />
              </div>

              <h2 style={{ marginTop:32, fontSize:32, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:12 }}>
                Emergency Alert Sent!
              </h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)", marginBottom:40 }}>
                Help is on the way. Stay calm and wait for assistance.
              </p>

              <div style={{ ...glass("rgba(52,211,153,0.15)"), maxWidth:520, margin:"0 auto", padding:"28px 32px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Ambulance size={28} style={{ color:"#ef4444" }} />
                  </div>
                  <div style={{ textAlign:"left", flex:1 }}>
                    <p style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:4 }}>Ambulance Dispatched</p>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>ETA: 8-12 minutes</p>
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[
                    { icon: Phone, text: "Emergency hotline notified" },
                    { icon: MapPin, text: "Your location shared with responders" },
                    { icon: Shield, text: "Medical history available to paramedics" }
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Icon size={16} style={{ color:"#38bdf8", flexShrink:0 }} />
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={cancelSOS}
                className="emg-btn"
                style={{
                  marginTop:28,
                  background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.12)",
                  borderRadius:12,
                  padding:"12px 28px",
                  fontSize:14,
                  color:"rgba(255,255,255,0.7)",
                  fontWeight:600,
                  cursor:"pointer"
                }}
              >
                I'm Okay - Cancel Alert
              </button>
            </div>
          )}
        </div>

        {/* Emergency Contacts */}
        <div style={{ marginBottom:48, animation:"_up .6s .1s ease both", opacity:0, animationFillMode:"forwards" }}>
          <h2 style={{ fontSize:24, fontWeight:800, color:"rgba(255,255,255,0.88)", marginBottom:24, letterSpacing:"-0.02em" }}>Emergency Contacts</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
            {[
              { num: "102", label: "Ambulance", icon: Ambulance, color: "#ef4444" },
              { num: "108", label: "Emergency Medical", icon: Heart, color: "#38bdf8" },
              { num: "112", label: "Emergency Services", icon: Phone, color: "#fbbf24" }
            ].map(({ num, label, icon: Icon, color }) => (
              <a
                key={num}
                href={`tel:${num}`}
                className="emg-card"
                style={{
                  ...glass(`${color}22`),
                  padding:"24px",
                  display:"flex",
                  alignItems:"center",
                  gap:18,
                  textDecoration:"none"
                }}
              >
                <div style={{ width:56, height:56, borderRadius:16, background:`${color}18`, border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon size={28} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.55)", marginBottom:4 }}>{label}</p>
                  <p style={{ fontSize:32, fontWeight:800, color, letterSpacing:"-0.02em" }}>{num}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Nearby Emergency Hospitals */}
        <div style={{ marginBottom:48, animation:"_up .6s .2s ease both", opacity:0, animationFillMode:"forwards" }}>
          <h2 style={{ fontSize:24, fontWeight:800, color:"rgba(255,255,255,0.88)", marginBottom:24, letterSpacing:"-0.02em" }}>Nearest Emergency Hospitals</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {mockHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="emg-card"
                style={{
                  ...glass("rgba(56,189,248,0.11)"),
                  padding:"24px",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"space-between",
                  flexWrap:"wrap",
                  gap:16
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:18, flex:1, minWidth:240 }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MapPin size={24} style={{ color:"#38bdf8" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                      <p style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.88)" }}>{hospital.name}</p>
                      {hospital.emergency && (
                        <span style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:999, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#ef4444", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                          24/7 ER
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.32)", marginBottom:2 }}>{hospital.address}</p>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.28)" }}>
                      {hospital.distance} away • {hospital.type}
                    </p>
                  </div>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <a href={`tel:${hospital.phone}`}>
                    <button className="emg-btn" style={{ width:42, height:42, borderRadius:11, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.65)" }}>
                      <Phone size={18} />
                    </button>
                  </a>
                  <button className="emg-btn" style={{ width:42, height:42, borderRadius:11, background:"linear-gradient(135deg,#38bdf8,#0284c7)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", boxShadow:"0 4px 16px rgba(56,189,248,0.3)" }}>
                    <Navigation size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tips */}
        <div style={{ ...glass("rgba(56,189,248,0.08)"), padding:"28px 32px", animation:"_up .6s .3s ease both", opacity:0, animationFillMode:"forwards" }}>
          <h3 style={{ fontSize:18, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:20 }}>While Waiting for Help</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              "Stay calm and remain in a safe position",
              "Keep your phone nearby and charged",
              "If possible, unlock your door for responders",
              "Have your ID and health insurance ready if available"
            ].map((tip, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <CheckCircle2 size={18} style={{ color:"#38bdf8", flexShrink:0, marginTop:2 }} />
                <span style={{ fontSize:14, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}