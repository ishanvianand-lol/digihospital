import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../supabase/client";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  GraduationCap,
  Building2,
  Upload,
  FileText,
  X,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DoctorData {
  fullName: string;
  phone: string;
  gender: string;
  degreeType: string;
  degreeInstitute: string;
  degreeYear: string;
  specialization: string;
  subSpecialization: string;
  hospitalName: string;
  hospitalAddress: string;
  experienceYears: string;
  consultationFee: string;
  bio: string;
}

const initialData: DoctorData = {
  fullName: "",
  phone: "",
  gender: "",
  degreeType: "",
  degreeInstitute: "",
  degreeYear: "",
  specialization: "",
  subSpecialization: "",
  hospitalName: "",
  hospitalAddress: "",
  experienceYears: "",
  consultationFee: "",
  bio: "",
};

const DEGREE_OPTIONS = [
  "MBBS", "MD", "DO", "BDS", "BAMS", "BHMS", "MDS", "MS", "DNB", "DM", "Other",
];

const SPECIALIZATIONS = [
  "General Physician", "Cardiologist", "Dermatologist", "Neurologist",
  "Orthopedic Surgeon", "Pediatrician", "Psychiatrist", "Gynecologist / Obstetrician",
  "Ophthalmologist", "ENT Specialist", "Endocrinologist", "Gastroenterologist",
  "Urologist", "Oncologist", "Radiologist", "Anesthesiologist",
  "Emergency Medicine", "Other",
];

const STORAGE_KEY = "digihospital_doctor_onboarding";
const STORAGE_STEP_KEY = "digihospital_doctor_onboarding_step";

export default function DoctorOnboarding() {
  const [step, setStep] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(STORAGE_STEP_KEY) || "1", 10); }
    catch { return 1; }
  });
  const [data, setData] = useState<DoctorData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialData;
    } catch { return initialData; }
  });
  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const degreeInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const totalSteps = 3;

  // ── Auth guard — redirect to auth only if truly not logged in ──────────────
  useEffect(() => {
    if (user === null) navigate("/auth");
  }, [user, navigate]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { localStorage.setItem(STORAGE_STEP_KEY, step.toString()); }, [step]);

  const set = (field: keyof DoctorData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 5MB." });
      return;
    }
    setDegreeFile(file);
  };

  const validateStep1 = () => {
    if (!data.fullName.trim()) { toast({ variant: "destructive", title: "Full name required" }); return false; }
    if (!data.gender) { toast({ variant: "destructive", title: "Gender required" }); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!data.degreeType) { toast({ variant: "destructive", title: "Please select your degree" }); return false; }
    if (!data.degreeInstitute.trim()) { toast({ variant: "destructive", title: "Institute name required" }); return false; }
    if (!data.degreeYear) { toast({ variant: "destructive", title: "Graduation year required" }); return false; }
    // ── DEGREE CERTIFICATE IS NOW REQUIRED ────────────────────────────────────
    if (!degreeFile) {
      toast({
        variant: "destructive",
        title: "Degree certificate required",
        description: "Please upload your degree certificate (PDF/JPG/PNG) to prevent fraud.",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!data.specialization) { toast({ variant: "destructive", title: "Please select specialization" }); return false; }
    if (!data.experienceYears) { toast({ variant: "destructive", title: "Experience years required" }); return false; }
    if (!data.hospitalName.trim()) { toast({ variant: "destructive", title: "Hospital/Clinic name required" }); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    if (!user) return;
    setLoading(true);

    try {
      let degreeDocUrl: string | null = null;

      if (degreeFile) {
        const ext = degreeFile.name.split(".").pop();
        const filePath = `${user.id}/degree.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("doctor-documents")
          .upload(filePath, degreeFile, { upsert: true, contentType: degreeFile.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("doctor-documents")
          .getPublicUrl(filePath);
        degreeDocUrl = urlData.publicUrl;
      }

      const { error: dbError } = await supabase.from("doctor_profiles").upsert(
        {
          user_id: user.id,
          full_name: data.fullName,
          phone: data.phone || null,
          gender: data.gender,
          degree_type: data.degreeType,
          degree_institute: data.degreeInstitute,
          degree_year: parseInt(data.degreeYear) || null,
          degree_document_url: degreeDocUrl,
          specialization: data.specialization,
          sub_specialization: data.subSpecialization || null,
          hospital_name: data.hospitalName,
          hospital_address: data.hospitalAddress || null,
          experience_years: parseInt(data.experienceYears) || null,
          consultation_fee: data.consultationFee ? parseFloat(data.consultationFee) : null,
          bio: data.bio || null,
          verification_status: "pending",
          onboarding_completed: true,
        },
        { onConflict: "user_id" }
      );

      if (dbError) throw dbError;

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);

      toast({
        title: "Profile submitted! 🎉",
        description: "Your profile is under review. We'll notify you once verified.",
      });

      // ── GO TO DOCTOR DASHBOARD ─────────────────────────────────────────────
      navigate("/doctor-dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission failed", description: error.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const glass = (): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 22,
    boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
  });

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <div style={{ width:72, height:72, margin:"0 auto 20px", borderRadius:20, background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"1px solid rgba(56,189,248,0.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(56,189,248,0.2)" }}>
          <Stethoscope size={32} style={{ color:"#38bdf8" }} />
        </div>
        <h2 style={{ fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:8, letterSpacing:"-0.02em" }}>Personal Information</h2>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)" }}>Basic details about you</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <div>
          <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Full Name *</Label>
          <Input value={data.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Dr. Full Name"
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
        </div>
        <div>
          <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Phone Number (Optional)</Label>
          <Input type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX"
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
        </div>
        <div>
          <Label style={{ display:"block", marginBottom:10, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Gender *</Label>
          <RadioGroup value={data.gender} onValueChange={(v) => set("gender", v)} style={{ display:"flex", gap:20 }}>
            {["Male", "Female", "Other"].map((g) => (
              <div key={g} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <RadioGroupItem value={g.toLowerCase()} id={`gender-${g}`} />
                <Label htmlFor={`gender-${g}`} style={{ fontSize:13, color:"rgba(255,255,255,0.65)", cursor:"pointer" }}>{g}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div>
          <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Brief Professional Bio (Optional)</Label>
          <Textarea value={data.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell patients about yourself..." rows={3}
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none", resize:"vertical" }} />
        </div>
      </div>
    </div>
  );

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <div style={{ width:72, height:72, margin:"0 auto 20px", borderRadius:20, background:"linear-gradient(135deg,rgba(251,191,36,0.2),rgba(245,158,11,0.15))", border:"1px solid rgba(251,191,36,0.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(251,191,36,0.2)" }}>
          <GraduationCap size={32} style={{ color:"#fbbf24" }} />
        </div>
        <h2 style={{ fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:8, letterSpacing:"-0.02em" }}>Qualifications & Degree</h2>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)" }}>Your medical education details</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <div>
          <Label style={{ display:"block", marginBottom:12, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Medical Degree *</Label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {DEGREE_OPTIONS.map((deg) => (
              <div key={deg} onClick={() => set("degreeType", deg)} style={{
                cursor:"pointer", borderRadius:12,
                border:`2px solid ${data.degreeType === deg ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                background:data.degreeType === deg ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)",
                padding:"12px 10px", textAlign:"center", fontSize:13, fontWeight:700,
                color:data.degreeType === deg ? "#38bdf8" : "rgba(255,255,255,0.55)", transition:"all .2s"
              }}>{deg}</div>
            ))}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Institute / University *</Label>
            <Input value={data.degreeInstitute} onChange={(e) => set("degreeInstitute", e.target.value)} placeholder="e.g. AIIMS Delhi"
              style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
          </div>
          <div>
            <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Graduation Year *</Label>
            <Input type="number" value={data.degreeYear} onChange={(e) => set("degreeYear", e.target.value)} placeholder="e.g. 2015" min="1950" max={new Date().getFullYear()}
              style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
          </div>
        </div>

        {/* ── DEGREE CERTIFICATE — NOW REQUIRED ─────────────────────────── */}
        <div>
          <Label style={{ display:"block", marginBottom:10, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>
            Degree Certificate *{" "}
            <span style={{ fontSize:11, color:"rgba(248,113,113,0.8)" }}>(Required — PDF / JPG / PNG, max 5MB)</span>
          </Label>

          {/* Fraud warning banner */}
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
            <ShieldCheck size={16} style={{ color:"#818cf8", flexShrink:0 }} />
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>
              <span style={{ fontWeight:700, color:"#818cf8" }}>Anti-fraud: </span>
              Uploading a fake/forged document is a criminal offence. All certificates are manually verified by our team.
            </p>
          </div>

          <div onClick={() => degreeInputRef.current?.click()} style={{
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", borderRadius:14,
            border:`2px dashed ${degreeFile ? "rgba(56,189,248,0.4)" : "rgba(248,113,113,0.3)"}`,
            background:degreeFile ? "rgba(56,189,248,0.05)" : "rgba(248,113,113,0.03)",
            padding:"32px 24px", transition:"all .2s"
          }}>
            {degreeFile ? (
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <FileText size={24} style={{ color:"#38bdf8" }} />
                <span style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.82)" }}>{degreeFile.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setDegreeFile(null); if (degreeInputRef.current) degreeInputRef.current.value = ""; }}
                  style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:6, color:"#f87171", cursor:"pointer" }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} style={{ color:"rgba(248,113,113,0.4)", marginBottom:12 }} />
                <p style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.55)", marginBottom:4 }}>Click to upload certificate</p>
                <p style={{ fontSize:12, color:"rgba(248,113,113,0.5)", fontWeight:600 }}>Required — cannot proceed without this</p>
              </>
            )}
          </div>
          <input ref={degreeInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );

  // ── Step 3 ─────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <div style={{ width:72, height:72, margin:"0 auto 20px", borderRadius:20, background:"linear-gradient(135deg,rgba(52,211,153,0.2),rgba(16,185,129,0.15))", border:"1px solid rgba(52,211,153,0.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(52,211,153,0.2)" }}>
          <Building2 size={32} style={{ color:"#34d399" }} />
        </div>
        <h2 style={{ fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:8, letterSpacing:"-0.02em" }}>Practice Details</h2>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)" }}>Your specialization and clinic information</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <div>
          <Label style={{ display:"block", marginBottom:12, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Specialization *</Label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {SPECIALIZATIONS.map((spec) => (
              <div key={spec} onClick={() => set("specialization", spec)} style={{
                cursor:"pointer", borderRadius:12,
                border:`2px solid ${data.specialization === spec ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                background:data.specialization === spec ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                padding:"12px 14px", fontSize:13, fontWeight:600,
                color:data.specialization === spec ? "#34d399" : "rgba(255,255,255,0.55)",
                transition:"all .2s", textAlign:"center"
              }}>{spec}</div>
            ))}
          </div>
        </div>

        <div>
          <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Sub-specialization (Optional)</Label>
          <Input value={data.subSpecialization} onChange={(e) => set("subSpecialization", e.target.value)} placeholder="e.g. Interventional Cardiology"
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Experience (Years) *</Label>
            <Input type="number" value={data.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} placeholder="e.g. 8" min="0" max="60"
              style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
          </div>
          <div>
            <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Consultation Fee ₹ (Optional)</Label>
            <Input type="number" value={data.consultationFee} onChange={(e) => set("consultationFee", e.target.value)} placeholder="e.g. 500"
              style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
          </div>
        </div>

        <div>
          <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Hospital / Clinic Name *</Label>
          <Input value={data.hospitalName} onChange={(e) => set("hospitalName", e.target.value)} placeholder="e.g. Apollo Hospital / City Clinic"
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }} />
        </div>

        <div>
          <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Hospital / Clinic Address (Optional)</Label>
          <Textarea value={data.hospitalAddress} onChange={(e) => set("hospitalAddress", e.target.value)} placeholder="Full address of your practice..." rows={2}
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none", resize:"vertical" }} />
        </div>

        <div style={{ display:"flex", alignItems:"flex-start", gap:12, background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:14, padding:"14px 16px" }}>
          <AlertTriangle size={18} style={{ color:"#fbbf24", flexShrink:0, marginTop:2 }} />
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.65 }}>
            <span style={{ fontWeight:700, color:"#fbbf24" }}>Verification Notice:</span> Your profile will be reviewed by our team within 24–48 hours. You'll receive an email once approved.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  return (
    <div style={{ minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Sora', system-ui, sans-serif", position:"relative", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes _spin  { to { transform: rotate(360deg); } }
        @keyframes _blob1 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(50px,-40px)scale(1.1)} 70%{transform:translate(-30px,25px)scale(.94)} }
        @keyframes _blob2 { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(-40px,30px)scale(1.07)} 70%{transform:translate(25px,-20px)scale(.97)} }
        .doc-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
      `}</style>

      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div className="doc-blob" style={{ width:600, height:600, top:-150, left:-150, background:"radial-gradient(ellipse,rgba(14,165,233,0.1) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="doc-blob" style={{ width:500, height:500, bottom:-150, right:-150, background:"radial-gradient(ellipse,rgba(99,102,241,0.07) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)", backgroundSize:"64px 64px" }} />

      <header style={{ position:"relative", zIndex:1, borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(6,12,18,0.8)", backdropFilter:"blur(20px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 40px", height:72, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#38bdf8,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(56,189,248,0.3)" }}>
              <Activity size={20} style={{ color:"#fff" }} />
            </div>
            <span style={{ fontSize:18, fontWeight:800, color:"rgba(255,255,255,0.88)", letterSpacing:"-0.01em" }}>Digital Hospital</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700,
                background: s === step ? "linear-gradient(135deg,#38bdf8,#0284c7)" : s < step ? "linear-gradient(135deg,#34d399,#10b981)" : "rgba(255,255,255,0.05)",
                color: s <= step ? "#fff" : "rgba(255,255,255,0.25)",
                border: s === step ? "2px solid rgba(56,189,248,0.3)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: s === step ? "0 4px 16px rgba(56,189,248,0.25)" : "none", transition:"all .3s"
              }}>
                {s < step ? <CheckCircle2 size={18} /> : s}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main style={{ position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"48px 40px 80px" }}>
        <div style={{ ...glass(), padding:"48px 44px" }}>
          {renderStep()}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:28 }}>
          <button onClick={() => step > 1 ? setStep((s) => s - 1) : navigate("/role-select")}
            style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"14px 28px", fontSize:14, color:"rgba(255,255,255,0.75)", fontWeight:600, cursor:"pointer" }}>
            <ArrowLeft size={16} /> Back
          </button>

          {step < totalSteps ? (
            <button onClick={handleNext}
              style={{ display:"flex", alignItems:"center", gap:10, background:"linear-gradient(135deg,#0ea5e9,#0284c7)", border:"none", borderRadius:12, padding:"14px 32px", fontSize:14, color:"#fff", fontWeight:700, cursor:"pointer", boxShadow:"0 6px 24px rgba(14,165,233,0.3)" }}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:10, background:loading ? "rgba(52,211,153,0.3)" : "linear-gradient(135deg,#34d399,#10b981)", border:"none", borderRadius:12, padding:"14px 32px", fontSize:14, color:"#fff", fontWeight:700, cursor:loading ? "not-allowed" : "pointer", boxShadow:loading ? "none" : "0 6px 24px rgba(52,211,153,0.35)" }}>
              {loading ? (
                <><div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"_spin .6s linear infinite" }} /> Submitting...</>
              ) : (
                <>Submit for Verification <CheckCircle2 size={16} /></>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}