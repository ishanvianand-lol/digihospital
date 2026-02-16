import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Slider } from "../components/ui/slider";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../hooks/use-toast";
import {
  Activity,
  User,
  Heart,
  Moon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { allergies, diagnoses, activityLevels, sleepQualityOptions } from "../lib/mockData";

interface OnboardingData {
  fullName: string;
  age: string;
  gender: string;
  heightCm: string;
  weightKg: string;
  allergies: string[];
  customAllergy: string;
  pastDiagnoses: string[];
  ongoingMedications: string;
  sleepHoursAvg: number;
  sleepQuality: string;
  smoking: boolean;
  alcohol: boolean;
  activityLevel: string;
}

const initialData: OnboardingData = {
  fullName: "",
  age: "",
  gender: "",
  heightCm: "",
  weightKg: "",
  allergies: [],
  customAllergy: "",
  pastDiagnoses: [],
  ongoingMedications: "",
  sleepHoursAvg: 7,
  sleepQuality: "average",
  smoking: false,
  alcohol: false,
  activityLevel: "moderate",
};

const STORAGE_KEY = "digihospital_onboarding_data";
const STORAGE_STEP_KEY = "digihospital_onboarding_step";

const loadFromStorage = (): OnboardingData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading data:", e);
  }
  return initialData;
};

const loadStepFromStorage = (): number => {
  try {
    const saved = localStorage.getItem(STORAGE_STEP_KEY);
    if (saved) {
      return parseInt(saved, 10);
    }
  } catch (e) {
    console.error("Error loading step:", e);
  }
  return 1;
};

export default function Onboarding() {
  const [step, setStep] = useState(loadStepFromStorage());
  const [data, setData] = useState<OnboardingData>(loadFromStorage());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createProfile, updateProfile, profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 3;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(STORAGE_STEP_KEY, step.toString());
  }, [step]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAllergyToggle = (allergy: string) => {
    setData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const handleDiagnosisToggle = (diagnosis: string) => {
    setData((prev) => ({
      ...prev,
      pastDiagnoses: prev.pastDiagnoses.includes(diagnosis)
        ? prev.pastDiagnoses.filter((d) => d !== diagnosis)
        : [...prev.pastDiagnoses, diagnosis],
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    const allAllergies = data.customAllergy
      ? [...data.allergies, data.customAllergy]
      : data.allergies;

    const profileData = {
      full_name: data.fullName,
      age: parseInt(data.age) || null,
      gender: data.gender,
      height_cm: parseFloat(data.heightCm) || null,
      weight_kg: parseFloat(data.weightKg) || null,
      allergies: allAllergies,
      past_diagnoses: data.pastDiagnoses,
      ongoing_medications: data.ongoingMedications || null,
      sleep_hours_avg: data.sleepHoursAvg,
      sleep_quality: data.sleepQuality,
      smoking: data.smoking,
      alcohol: data.alcohol,
      activity_level: data.activityLevel,
      onboarding_completed: true,
    };

    try {
      let result;
      if (profile) {
        result = await updateProfile(profileData);
      } else {
        result = await createProfile(profileData);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Profile created!",
        description: "Your health profile has been set up successfully.",
      });

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
      });
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div style={{ textAlign:"center", marginBottom:12 }}>
              <div style={{ width:72, height:72, margin:"0 auto 20px", borderRadius:20, background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"1px solid rgba(56,189,248,0.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(56,189,248,0.2)" }}>
                <User size={32} style={{ color:"#38bdf8" }} />
              </div>
              <h2 style={{ fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:8, letterSpacing:"-0.02em" }}>Basic Profile</h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)" }}>Let's start with your basic information</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Full Name</Label>
                <Input
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none", transition:"border-color .2s" }}
                />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Age</Label>
                  <Input
                    type="number"
                    value={data.age}
                    onChange={(e) => setData({ ...data, age: e.target.value })}
                    placeholder="Age"
                    style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }}
                  />
                </div>
                <div>
                  <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Gender</Label>
                  <RadioGroup value={data.gender} onValueChange={(value) => setData({ ...data, gender: value })} style={{ display:"flex", gap:16, marginTop:6 }}>
                    {["male", "female", "other"].map((g) => (
                      <div key={g} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <RadioGroupItem value={g} id={g} />
                        <Label htmlFor={g} style={{ fontSize:13, color:"rgba(255,255,255,0.65)", cursor:"pointer", textTransform:"capitalize" }}>
                          {g}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Height (cm)</Label>
                  <Input
                    type="number"
                    value={data.heightCm}
                    onChange={(e) => setData({ ...data, heightCm: e.target.value })}
                    placeholder="170"
                    style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }}
                  />
                </div>
                <div>
                  <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={data.weightKg}
                    onChange={(e) => setData({ ...data, weightKg: e.target.value })}
                    placeholder="70"
                    style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div style={{ textAlign:"center", marginBottom:12 }}>
              <div style={{ width:72, height:72, margin:"0 auto 20px", borderRadius:20, background:"linear-gradient(135deg,rgba(248,113,113,0.2),rgba(239,68,68,0.15))", border:"1px solid rgba(248,113,113,0.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(248,113,113,0.2)" }}>
                <Heart size={32} style={{ color:"#f87171" }} />
              </div>
              <h2 style={{ fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:8, letterSpacing:"-0.02em" }}>Medical Background</h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)" }}>Help us understand your health history</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              <div>
                <Label style={{ display:"block", marginBottom:12, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Known Allergies</Label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {allergies.map((allergy) => (
                    <div
                      key={allergy}
                      onClick={() => handleAllergyToggle(allergy)}
                      style={{
                        cursor:"pointer",
                        borderRadius:12,
                        border:`2px solid ${data.allergies.includes(allergy) ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`,
                        background:data.allergies.includes(allergy) ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.03)",
                        padding:"12px 14px",
                        fontSize:13,
                        fontWeight:600,
                        color:data.allergies.includes(allergy) ? "#f87171" : "rgba(255,255,255,0.55)",
                        transition:"all .2s",
                        textAlign:"center"
                      }}
                    >
                      {allergy}
                    </div>
                  ))}
                </div>
                <Input
                  placeholder="Other allergies (comma separated)"
                  value={data.customAllergy}
                  onChange={(e) => setData({ ...data, customAllergy: e.target.value })}
                  style={{ marginTop:12, width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none" }}
                />
              </div>

              <div>
                <Label style={{ display:"block", marginBottom:12, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Past Diagnoses</Label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                  {diagnoses.map((diagnosis) => (
                    <div
                      key={diagnosis}
                      onClick={() => handleDiagnosisToggle(diagnosis)}
                      style={{
                        cursor:"pointer",
                        borderRadius:12,
                        border:`2px solid ${data.pastDiagnoses.includes(diagnosis) ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                        background:data.pastDiagnoses.includes(diagnosis) ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.03)",
                        padding:"12px 14px",
                        fontSize:13,
                        fontWeight:600,
                        color:data.pastDiagnoses.includes(diagnosis) ? "#38bdf8" : "rgba(255,255,255,0.55)",
                        transition:"all .2s",
                        textAlign:"center"
                      }}
                    >
                      {diagnosis}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label style={{ display:"block", marginBottom:8, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Ongoing Medications (Optional)</Label>
                <Textarea
                  value={data.ongoingMedications}
                  onChange={(e) => setData({ ...data, ongoingMedications: e.target.value })}
                  placeholder="List any medications you're currently taking..."
                  rows={3}
                  style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", fontSize:14, color:"#e2e8f0", outline:"none", resize:"vertical" }}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div style={{ textAlign:"center", marginBottom:12 }}>
              <div style={{ width:72, height:72, margin:"0 auto 20px", borderRadius:20, background:"linear-gradient(135deg,rgba(129,140,248,0.2),rgba(99,102,241,0.15))", border:"1px solid rgba(129,140,248,0.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 32px rgba(129,140,248,0.2)" }}>
                <Moon size={32} style={{ color:"#818cf8" }} />
              </div>
              <h2 style={{ fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.92)", marginBottom:8, letterSpacing:"-0.02em" }}>Lifestyle & Habits</h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.32)" }}>Tell us about your daily routine</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              <div>
                <Label style={{ display:"block", marginBottom:12, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>
                  Average Sleep Duration: <span style={{ color:"#818cf8", fontWeight:700 }}>{data.sleepHoursAvg} hours</span>
                </Label>
                <Slider
                  value={[data.sleepHoursAvg]}
                  onValueChange={([value]) => setData({ ...data, sleepHoursAvg: value })}
                  min={3}
                  max={12}
                  step={0.5}
                  style={{ marginTop:8 }}
                />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"rgba(255,255,255,0.22)" }}>
                  <span>3h</span>
                  <span>12h</span>
                </div>
              </div>

              <div>
                <Label style={{ display:"block", marginBottom:12, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Sleep Quality</Label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                  {sleepQualityOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setData({ ...data, sleepQuality: option.value })}
                      style={{
                        cursor:"pointer",
                        borderRadius:14,
                        border:`2px solid ${data.sleepQuality === option.value ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                        background:data.sleepQuality === option.value ? "rgba(129,140,248,0.08)" : "rgba(255,255,255,0.03)",
                        padding:"16px 12px",
                        textAlign:"center",
                        transition:"all .2s"
                      }}
                    >
                      <span style={{ fontSize:28, display:"block", marginBottom:6 }}>{option.emoji}</span>
                      <p style={{ fontSize:12, fontWeight:600, color:data.sleepQuality === option.value ? "#818cf8" : "rgba(255,255,255,0.55)" }}>{option.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 16px" }}>
                  <Checkbox
                    id="smoking"
                    checked={data.smoking}
                    onCheckedChange={(checked) =>
                      setData({ ...data, smoking: checked as boolean })
                    }
                  />
                  <Label htmlFor="smoking" style={{ fontSize:14, color:"rgba(255,255,255,0.65)", cursor:"pointer", fontWeight:600 }}>
                    Smoking
                  </Label>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 16px" }}>
                  <Checkbox
                    id="alcohol"
                    checked={data.alcohol}
                    onCheckedChange={(checked) =>
                      setData({ ...data, alcohol: checked as boolean })
                    }
                  />
                  <Label htmlFor="alcohol" style={{ fontSize:14, color:"rgba(255,255,255,0.65)", cursor:"pointer", fontWeight:600 }}>
                    Alcohol
                  </Label>
                </div>
              </div>

              <div>
                <Label style={{ display:"block", marginBottom:12, fontSize:13, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>Daily Activity Level</Label>
                <RadioGroup
                  value={data.activityLevel}
                  onValueChange={(value) => setData({ ...data, activityLevel: value })}
                  style={{ display:"flex", flexDirection:"column", gap:10 }}
                >
                  {activityLevels.map((level) => (
                    <div
                      key={level.value}
                      style={{
                        display:"flex",
                        alignItems:"center",
                        gap:14,
                        cursor:"pointer",
                        borderRadius:12,
                        border:`2px solid ${data.activityLevel === level.value ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                        background:data.activityLevel === level.value ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                        padding:"14px 16px",
                        transition:"all .2s"
                      }}
                    >
                      <RadioGroupItem value={level.value} id={level.value} />
                      <div style={{ flex:1 }}>
                        <Label htmlFor={level.value} style={{ display:"block", fontSize:14, fontWeight:700, color:data.activityLevel === level.value ? "#34d399" : "rgba(255,255,255,0.78)", cursor:"pointer", marginBottom:2 }}>
                          {level.label}
                        </Label>
                        <p style={{ fontSize:12, color:"rgba(255,255,255,0.32)" }}>{level.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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

        .onb-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; will-change:transform; }
      `}</style>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"linear-gradient(140deg,#050d11 0%,#060f0d 50%,#07090f 100%)" }} />
      <div className="onb-blob" style={{ width:600,height:600,top:-150,left:-150, background:"radial-gradient(ellipse,rgba(14,165,233,0.1) 0%,transparent 65%)", animation:"_blob1 18s ease-in-out infinite" }} />
      <div className="onb-blob" style={{ width:500,height:500,bottom:-150,right:-150, background:"radial-gradient(ellipse,rgba(99,102,241,0.07) 0%,transparent 65%)", animation:"_blob2 22s ease-in-out infinite", animationDelay:"-8s" }} />

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
        backgroundSize:"64px 64px" }} />

      {/* Header */}
      <header style={{ position:"relative", zIndex:1, borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(6,12,18,0.8)", backdropFilter:"blur(20px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 40px", height:72, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#38bdf8,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(56,189,248,0.3)" }}>
              <Activity size={20} style={{ color:"#fff" }} />
            </div>
            <span style={{ fontSize:18, fontWeight:800, color:"rgba(255,255,255,0.88)", letterSpacing:"-0.01em" }}>TrustHeal</span>
          </div>

          {/* Progress indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width:36,
                  height:36,
                  borderRadius:"50%",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  fontSize:14,
                  fontWeight:700,
                  background: s === step
                    ? "linear-gradient(135deg,#38bdf8,#0284c7)"
                    : s < step
                    ? "linear-gradient(135deg,#34d399,#10b981)"
                    : "rgba(255,255,255,0.05)",
                  color: s <= step ? "#fff" : "rgba(255,255,255,0.25)",
                  border: s === step ? "2px solid rgba(56,189,248,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: s === step ? "0 4px 16px rgba(56,189,248,0.25)" : "none",
                  transition:"all .3s"
                }}
              >
                {s < step ? <CheckCircle2 size={18} /> : s}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"48px 40px 80px" }}>
        <div style={{ ...glass(), padding:"48px 44px" }}>
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:28 }}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            style={{
              display:"flex",
              alignItems:"center",
              gap:10,
              background:step === 1 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:12,
              padding:"14px 28px",
              fontSize:14,
              color:step === 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)",
              fontWeight:600,
              cursor:step === 1 ? "not-allowed" : "pointer",
              transition:"all .2s"
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              style={{
                display:"flex",
                alignItems:"center",
                gap:10,
                background:"linear-gradient(135deg,#0ea5e9,#0284c7)",
                border:"none",
                borderRadius:12,
                padding:"14px 32px",
                fontSize:14,
                color:"#fff",
                fontWeight:700,
                cursor:"pointer",
                boxShadow:"0 6px 24px rgba(14,165,233,0.3)",
                transition:"all .2s"
              }}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                display:"flex",
                alignItems:"center",
                gap:10,
                background:loading ? "rgba(52,211,153,0.3)" : "linear-gradient(135deg,#34d399,#10b981)",
                border:"none",
                borderRadius:12,
                padding:"14px 32px",
                fontSize:14,
                color:"#fff",
                fontWeight:700,
                cursor:loading ? "not-allowed" : "pointer",
                boxShadow:loading ? "none" : "0 6px 24px rgba(52,211,153,0.35)",
                transition:"all .2s"
              }}
            >
              {loading ? (
                <>
                  <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"_spin .6s linear infinite" }} />
                  Setting up...
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}