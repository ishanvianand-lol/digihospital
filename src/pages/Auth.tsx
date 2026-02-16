import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { z } from "zod";
import { supabase } from "../supabase/client";
import { Activity, Mail, Lock as LockIcon, Sparkles } from "lucide-react";

// ─── Google OAuth ─────────────────────────────────────────────
const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth`,
    },
  });
};

// ─── Validation Schema ────────────────────────────────────────
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp] = useState(
    searchParams.get("mode") === "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ─────────────────────────────────────────────────────────────
  // 🔥 FIX: Explicitly exchange OAuth code for session
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const exchangeCodeForSession = async () => {
      const code = searchParams.get("code");
      if (!code) return;

      const { data, error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth exchange failed:", error);
        return;
      }

      console.log("OAuth session established:", data.session);
    };

    exchangeCodeForSession();
  }, [searchParams]);

  // ─────────────────────────────────────────────────────────────
  // Smart Redirect After Login
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const redirect = async () => {
      const role = user.user_metadata?.role;

      if (!role) {
        if (window.location.pathname !== "/role-select") {
          navigate("/role-select");
        }
        return;
      }

      if (role === "doctor") {
        const { data } = await supabase
          .from("doctor_profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        navigate(
          data?.onboarding_completed ? "/dashboard" : "/doctor-onboarding"
        );
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        navigate(
          data?.onboarding_completed ? "/dashboard" : "/onboarding"
        );
      }
    };

    redirect();
  }, [user, navigate]);

  // ─────────────────────────────────────────────────────────────
  // Form Validation
  // ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0] === "email") fieldErrors.email = e.message;
          if (e.path[0] === "password") fieldErrors.password = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Submit Handler
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);

        if (error) {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message,
          });
        } else {
          toast({
            title: "Check your email",
            description:
              "We sent you a confirmation link. Please verify your email.",
          });
        }
      } else {
        const { error } = await signIn(email, password);

        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const glass = (accent = "rgba(255,255,255,0.06)"): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${accent}`,
    borderRadius: 22,
    boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
  });

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Sora', system-ui, sans-serif", position:"relative", overflow:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes _spin  { to { transform: rotate(360deg); } }
        @keyframes _up    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes _blob1 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(50px,-40px)scale(1.1)} 70%{transform:translate(-30px,25px)scale(.94)} }
        @keyframes _blob2 { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(-40px,30px)scale(1.07)} 70%{transform:translate(25px,-20px)scale(.97)} }

        .auth-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
        .auth-btn { transition: all .18s !important; }
        .auth-btn:hover { transform: translateY(-1px) !important; filter: brightness(1.1) !important; }
        .auth-input { transition: border-color .2s ease !important; }
        .auth-input:focus { border-color: rgba(56,189,248,0.4) !important; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.18); border-radius:4px; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div className="auth-blob" style={{ width:600,height:600,top:-150,left:-150, background:"radial-gradient(ellipse,rgba(14,165,233,0.12) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="auth-blob" style={{ width:500,height:500,bottom:-150,right:-150, background:"radial-gradient(ellipse,rgba(99,102,241,0.08) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      <div style={{ position:"relative", zIndex:1, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
        
        <div style={{ width:"100%", maxWidth:460, animation:"_up .7s ease both" }}>

          {/* Logo & Title */}
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#38bdf8,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(56,189,248,0.3)" }}>
                <Activity size={24} style={{ color:"#fff" }} />
              </div>
              <span style={{ fontSize:22, fontWeight:800, color:"rgba(255,255,255,0.88)", letterSpacing:"-0.02em" }}>Digital Hospital</span>
            </div>

            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:999, padding:"6px 16px", marginBottom:20 }}>
              <Sparkles size={13} style={{ color:"#38bdf8" }} />
              <span style={{ fontSize:11, color:"#38bdf8", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Secure Health Access</span>
            </div>

            <h2 style={{ fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:8, letterSpacing:"-0.02em" }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.28)" }}>
              {isSignUp ? "Start your health journey today" : "Continue to your dashboard"}
            </p>
          </div>

          {/* Auth Card */}
          <div style={{ ...glass("rgba(56,189,248,0.11)"), padding:"36px 32px" }}>

            {/* Google Login */}
            <button
              onClick={signInWithGoogle}
              className="auth-btn"
              style={{
                width:"100%",
                background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:12,
                padding:"14px",
                fontSize:14,
                color:"rgba(255,255,255,0.82)",
                fontWeight:600,
                cursor:"pointer",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                gap:10,
                marginBottom:24
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.22)", fontWeight:600 }}>OR</span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:20 }}>
              
              {/* Email */}
              <div>
                <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>
                  Email Address
                </Label>
                <div style={{ position:"relative" }}>
                  <Mail size={16} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.22)", pointerEvents:"none" }} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="auth-input"
                    style={{
                      width:"100%",
                      background:"rgba(255,255,255,0.04)",
                      border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:10,
                      padding:"12px 14px 12px 42px",
                      fontSize:14,
                      color:"#e2e8f0",
                      outline:"none"
                    }}
                  />
                </div>
                {errors.email && (
                  <p style={{ marginTop:6, fontSize:12, color:"#f87171" }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>
                  Password
                </Label>
                <div style={{ position:"relative" }}>
                  <LockIcon size={16} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.22)", pointerEvents:"none" }} />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                    style={{
                      width:"100%",
                      background:"rgba(255,255,255,0.04)",
                      border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:10,
                      padding:"12px 14px 12px 42px",
                      fontSize:14,
                      color:"#e2e8f0",
                      outline:"none"
                    }}
                  />
                </div>
                {errors.password && (
                  <p style={{ marginTop:6, fontSize:12, color:"#f87171" }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn"
                style={{
                  width:"100%",
                  background:loading?"rgba(56,189,248,0.3)":"linear-gradient(135deg,#0ea5e9,#0284c7)",
                  border:"none",
                  borderRadius:12,
                  padding:"14px",
                  fontSize:15,
                  color:"#fff",
                  fontWeight:700,
                  cursor:loading?"not-allowed":"pointer",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  gap:10,
                  boxShadow:loading?"none":"0 6px 24px rgba(14,165,233,0.3)",
                  marginTop:8
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"_spin .6s linear infinite" }} />
                    Loading...
                  </>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </button>
            </form>

            {/* Footer Link */}
            <div style={{ marginTop:24, textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.28)" }}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <a
                href={isSignUp ? "/auth?mode=signin" : "/auth?mode=signup"}
                style={{ color:"#38bdf8", fontWeight:600, textDecoration:"none", transition:"opacity .2s" }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </a>
            </div>
          </div>

          {/* Security Notice */}
          <div style={{ marginTop:20, textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.2)", lineHeight:1.6 }}>
            🔒 Your data is encrypted and secured with industry-standard protocols
          </div>
        </div>
      </div>
    </div>
  );
}