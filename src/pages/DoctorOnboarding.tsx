import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
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

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
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

  // Guard: agar user nahi hai toh auth pe bhejo
  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);
  useEffect(() => {
    localStorage.setItem(STORAGE_STEP_KEY, step.toString());
  }, [step]);

  const set = (field: keyof DoctorData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  // ── File change handler ────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 5MB.",
      });
      return;
    }
    setDegreeFile(file);
  };

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!data.fullName.trim()) {
      toast({ variant: "destructive", title: "Full name required" });
      return false;
    }
    if (!data.gender) {
      toast({ variant: "destructive", title: "Gender required" });
      return false;
    }
    return true;
  };

  // ── Step 2 validation ──────────────────────────────────────────────────────
  const validateStep2 = () => {
    if (!data.degreeType) {
      toast({ variant: "destructive", title: "Please select your degree" });
      return false;
    }
    if (!data.degreeInstitute.trim()) {
      toast({ variant: "destructive", title: "Institute name required" });
      return false;
    }
    if (!data.degreeYear) {
      toast({ variant: "destructive", title: "Graduation year required" });
      return false;
    }
    return true;
  };

  // ── Step 3 validation ──────────────────────────────────────────────────────
  const validateStep3 = () => {
    if (!data.specialization) {
      toast({ variant: "destructive", title: "Please select specialization" });
      return false;
    }
    if (!data.experienceYears) {
      toast({ variant: "destructive", title: "Experience years required" });
      return false;
    }
    if (!data.hospitalName.trim()) {
      toast({ variant: "destructive", title: "Hospital/Clinic name required" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep3()) return;
    if (!user) return;
    setLoading(true);

    try {
      let degreeDocUrl: string | null = null;

      // Upload degree document if provided
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

      // Insert/update doctor_profiles table
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

      // Cleanup localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);

      toast({
        title: "Profile submitted! 🎉",
        description: "Your profile is under review. We'll notify you once verified.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Personal Info ──────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
          <Stethoscope className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Personal Information</h2>
        <p className="text-muted-foreground">Basic details about you</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Dr. Full Name"
            className="input-medical mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            className="input-medical mt-1"
          />
        </div>

        <div>
          <Label className="mb-2 block">Gender *</Label>
          <RadioGroup
            value={data.gender}
            onValueChange={(v) => set("gender", v)}
            className="flex gap-6"
          >
            {["Male", "Female", "Other"].map((g) => (
              <div key={g} className="flex items-center space-x-2">
                <RadioGroupItem value={g.toLowerCase()} id={`gender-${g}`} />
                <Label htmlFor={`gender-${g}`} className="cursor-pointer">{g}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="bio">Brief Professional Bio (Optional)</Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Tell patients about yourself and your approach to healthcare..."
            className="input-medical mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // ── Step 2: Qualifications ─────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Qualifications & Degree</h2>
        <p className="text-muted-foreground">Your medical education details</p>
      </div>

      <div className="space-y-5">
        {/* Degree Selection */}
        <div>
          <Label className="mb-3 block">Medical Degree *</Label>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
            {DEGREE_OPTIONS.map((deg) => (
              <div
                key={deg}
                onClick={() => set("degreeType", deg)}
                className={`cursor-pointer rounded-xl border-2 px-3 py-2 text-center text-sm font-medium transition-all ${
                  data.degreeType === deg
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {deg}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="institute">Institute / University *</Label>
            <Input
              id="institute"
              value={data.degreeInstitute}
              onChange={(e) => set("degreeInstitute", e.target.value)}
              placeholder="e.g. AIIMS Delhi"
              className="input-medical mt-1"
            />
          </div>
          <div>
            <Label htmlFor="degreeYear">Graduation Year *</Label>
            <Input
              id="degreeYear"
              type="number"
              value={data.degreeYear}
              onChange={(e) => set("degreeYear", e.target.value)}
              placeholder="e.g. 2015"
              min="1950"
              max={new Date().getFullYear()}
              className="input-medical mt-1"
            />
          </div>
        </div>

        {/* Degree Certificate Upload */}
        <div>
          <Label className="mb-2 block">
            Degree Certificate{" "}
            <span className="text-xs text-muted-foreground">(PDF / JPG / PNG — max 5MB, optional)</span>
          </Label>
          <div
            onClick={() => degreeInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-all ${
              degreeFile
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            {degreeFile ? (
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">{degreeFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDegreeFile(null); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 5MB</p>
              </>
            )}
          </div>
          <input
            ref={degreeInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );

  // ── Step 3: Practice Details ───────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Practice Details</h2>
        <p className="text-muted-foreground">Your specialization and clinic information</p>
      </div>

      <div className="space-y-5">
        {/* Specialization */}
        <div>
          <Label className="mb-3 block">Specialization *</Label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {SPECIALIZATIONS.map((spec) => (
              <div
                key={spec}
                onClick={() => set("specialization", spec)}
                className={`cursor-pointer rounded-xl border-2 px-4 py-2.5 text-sm transition-all ${
                  data.specialization === spec
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {spec}
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="subSpec">Sub-specialization (Optional)</Label>
          <Input
            id="subSpec"
            value={data.subSpecialization}
            onChange={(e) => set("subSpecialization", e.target.value)}
            placeholder="e.g. Interventional Cardiology"
            className="input-medical mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="exp">Experience (Years) *</Label>
            <Input
              id="exp"
              type="number"
              value={data.experienceYears}
              onChange={(e) => set("experienceYears", e.target.value)}
              placeholder="e.g. 8"
              min="0"
              max="60"
              className="input-medical mt-1"
            />
          </div>
          <div>
            <Label htmlFor="fee">Consultation Fee ₹ (Optional)</Label>
            <Input
              id="fee"
              type="number"
              value={data.consultationFee}
              onChange={(e) => set("consultationFee", e.target.value)}
              placeholder="e.g. 500"
              className="input-medical mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="hospital">Hospital / Clinic Name *</Label>
          <Input
            id="hospital"
            value={data.hospitalName}
            onChange={(e) => set("hospitalName", e.target.value)}
            placeholder="e.g. Apollo Hospital / City Clinic"
            className="input-medical mt-1"
          />
        </div>

        <div>
          <Label htmlFor="hospitalAddr">Hospital / Clinic Address (Optional)</Label>
          <Textarea
            id="hospitalAddr"
            value={data.hospitalAddress}
            onChange={(e) => set("hospitalAddress", e.target.value)}
            placeholder="Full address of your practice..."
            className="input-medical mt-1"
            rows={2}
          />
        </div>

        {/* Verification Notice */}
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Verification Notice:</span> Your profile will be
            reviewed by our team within 24–48 hours. You'll receive an email once approved.
            Until then, your account will have limited access.
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

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Digital Hospital</span>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-12 py-10">
        <div className="card-medical w-full p-10">{renderStep()}</div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              step > 1 ? setStep((s) => s - 1) : navigate("/role-select")
            }
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext} className="gap-2 bg-gradient-primary text-white">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 bg-gradient-primary text-white"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Submit for Verification
                  <CheckCircle2 className="h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}