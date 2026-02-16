import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../supabase/client";
import { Header } from "../components/layout/Header";
import { AiConsultation } from "../components/AIConsultation";
import {
  analyzeHealth,
  calculateSleepScore,
  generateAccessKey,
  type HealthAnalysisResult,
} from "../lib/aiHealthEngine";
import { symptoms, sleepQualityOptions, mockDoctors } from "../lib/mockData";
import {
  Activity,
  Heart,
  Moon,
  Brain,
  AlertTriangle,
  Shield,
  Clock,
  Plus,
  Mic,
  MicOff,
  Copy,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { format } from "date-fns";

interface HealthLog {
  id: string;
  symptoms: string[];
  severity: number | null;
  notes: string | null;
  created_at: string;
}

interface SleepEntry {
  id: string;
  hours_slept: number;
  quality_rating: string;
  sleep_score: number | null;
  logged_date: string;
}

interface AccessKey {
  id: string;
  access_key: string;
  doctor_name: string | null;
  hospital_name: string | null;
  purpose: string | null;
  is_used: boolean | null;
  expires_at: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<HealthAnalysisResult | null>(null);
  const [latestSleepScore, setLatestSleepScore] = useState<number>(70);

  // Modal states
  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [accessKeyModalOpen, setAccessKeyModalOpen] = useState(false);
  const [aiInsightModalOpen, setAiInsightModalOpen] = useState(false);

  // Symptom logging state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState(5);
  const [symptomNotes, setSymptomNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Sleep logging state
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<"excellent" | "good" | "average" | "poor">("average");

  // Access key state
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("");
  const [generatedKey, setGeneratedKey] = useState<{ key: string; hash: string } | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Fetch data
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user && !profileLoading && profile === null) {
      navigate("/onboarding");
      return;
    }

    if (user && profile && !profile.onboarding_completed) {
      navigate("/onboarding");
      return;
    }

    if (user) {
      fetchHealthLogs();
      fetchSleepEntries();
      fetchAccessKeys();
    }
  }, [user, authLoading, profile, profileLoading, navigate]);

  // Run AI analysis when data changes
  useEffect(() => {
    if (profile) {
      runAiAnalysis();
    }
  }, [profile, healthLogs, sleepEntries]);

  const fetchHealthLogs = async () => {
    const { data, error } = await supabase
      .from("health_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setHealthLogs(data);
    }
  };

  const fetchSleepEntries = async () => {
    const { data, error } = await supabase
      .from("sleep_entries")
      .select("*")
      .order("logged_date", { ascending: false })
      .limit(7);

    if (!error && data) {
      setSleepEntries(data);
      if (data.length > 0 && data[0].sleep_score) {
        setLatestSleepScore(data[0].sleep_score);
      }
    }
  };

  const fetchAccessKeys = async () => {
    const { data, error } = await supabase
      .from("doctor_access_keys")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setAccessKeys(data);
    }
  };

  const runAiAnalysis = () => {
    if (!profile) return;

    const latestLog = healthLogs[0];
    const avgSleepScore =
      sleepEntries.length > 0
        ? sleepEntries.reduce((acc, s) => acc + (s.sleep_score || 70), 0) / sleepEntries.length
        : 70;

    const analysis = analyzeHealth({
      symptoms: latestLog?.symptoms || [],
      severity: latestLog?.severity || undefined,
      sleepScore: avgSleepScore,
      allergies: profile.allergies || [],
      pastDiagnoses: profile.past_diagnoses || [],
      age: profile.age || undefined,
      smoking: profile.smoking || false,
      alcohol: profile.alcohol || false,
      activityLevel: (profile.activity_level as "active" | "moderate" | "sedentary") || undefined,
    });

    setAiAnalysis(analysis);
  };

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((s) => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleLogSymptoms = async () => {
    if (!user || selectedSymptoms.length === 0) return;

    const { error } = await supabase.from("health_logs").insert({
      user_id: user.id,
      symptoms: selectedSymptoms,
      severity: symptomSeverity,
      notes: symptomNotes || null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log symptoms",
      });
    } else {
      toast({
        title: "Symptoms logged",
        description: "Your symptoms have been recorded successfully.",
      });
      setSymptomModalOpen(false);
      setSelectedSymptoms([]);
      setSymptomSeverity(5);
      setSymptomNotes("");
      fetchHealthLogs();
    }
  };

  const handleLogSleep = async () => {
    if (!user) return;

    const score = calculateSleepScore(sleepHours, sleepQuality);

    const { error } = await supabase.from("sleep_entries").insert({
      user_id: user.id,
      hours_slept: sleepHours,
      quality_rating: sleepQuality,
      sleep_score: score,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          variant: "destructive",
          title: "Already logged",
          description: "You have already logged sleep for today.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to log sleep",
        });
      }
    } else {
      toast({
        title: "Sleep logged",
        description: `Sleep score: ${score}/100`,
      });
      setSleepModalOpen(false);
      fetchSleepEntries();
    }
  };

  const handleGenerateAccessKey = async () => {
    if (!user) return;

    const { accessKey, keyHash } = generateAccessKey();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("doctor_access_keys").insert({
      patient_user_id: user.id,
      access_key: accessKey,
      key_hash: keyHash,
      doctor_name: doctorName || null,
      hospital_name: hospitalName || null,
      purpose: visitPurpose || null,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate access key",
      });
    } else {
      setGeneratedKey({ key: accessKey, hash: keyHash });
      fetchAccessKeys();
    }
  };

  const copyAccessKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setKeyCopied(true);
    toast({
      title: "Copied!",
      description: "Access key copied to clipboard",
    });
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Recording...",
        description: "Voice-to-text is simulated in this demo.",
      });
      setTimeout(() => {
        setSymptomNotes((prev) => prev + " I've been feeling tired and having headaches.");
        setIsRecording(false);
      }, 2000);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's your health overview for today
          </p>
        </div>

        {/* Health ID Card */}
        <div className="card-glass mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Decentralized Health ID</p>
                <p className="font-mono text-sm font-medium">
                  {profile?.decentralized_health_id || "Generating..."}
                </p>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Button
            onClick={() => setSymptomModalOpen(true)}
            className="h-auto flex-col gap-2 bg-destructive/10 p-4 text-destructive hover:bg-destructive/20"
            variant="ghost"
          >
            <Heart className="h-6 w-6" />
            <span className="text-sm font-medium">I Feel Uneasy</span>
          </Button>

          <Button
            onClick={() => setSleepModalOpen(true)}
            className="h-auto flex-col gap-2 bg-primary/10 p-4 text-primary hover:bg-primary/20"
            variant="ghost"
          >
            <Moon className="h-6 w-6" />
            <span className="text-sm font-medium">Log Sleep</span>
          </Button>

          <Button
            onClick={() => setAccessKeyModalOpen(true)}
            className="h-auto flex-col gap-2 bg-accent/10 p-4 text-accent hover:bg-accent/20"
            variant="ghost"
          >
            <Shield className="h-6 w-6" />
            <span className="text-sm font-medium">Doctor Access</span>
          </Button>

          <Button
            onClick={() => navigate("/emergency")}
            className="pulse-emergency h-auto flex-col gap-2 p-4"
          >
            <AlertTriangle className="h-6 w-6" />
            <span className="text-sm font-medium">Emergency SOS</span>
          </Button>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - AI Health Score */}
          <div className="lg:col-span-1">
            <div className="card-medical p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">AI Health Score</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiInsightModalOpen(true)}
                  className="text-primary"
                >
                  <Sparkles className="mr-1 h-4 w-4" />
                  Insights
                </Button>
              </div>
              {/* Medicine Reminder - Full Width */}
      
              <div className="flex flex-col items-center py-4">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-primary">
                      {aiAnalysis?.healthRiskScore ?? 0}
                    </span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {aiAnalysis?.urgencyLevel === "emergency"
                      ? "Immediate attention recommended"
                      : aiAnalysis?.urgencyLevel === "monitor"
                      ? "Schedule a checkup soon"
                      : "Your health looks stable"}
                  </p>
                </div>
              </div>

              {aiAnalysis && (
                <div
                  className={`mt-4 rounded-xl p-3 ${
                    aiAnalysis.urgencyLevel === "emergency"
                      ? "bg-destructive/10"
                      : aiAnalysis.urgencyLevel === "monitor"
                      ? "bg-warning/10"
                      : "bg-success/10"
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Stethoscope className="h-4 w-4" />
                    Recommended: {aiAnalysis.recommendedDoctorType}
                  </p>
                </div>
              )}

              {/* Impact Breakdown */}
              {aiAnalysis && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Risk Factors:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Symptoms</p>
                      <p className="text-sm font-bold">{aiAnalysis.detailedAnalysis.symptomImpact}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Sleep</p>
                      <p className="text-sm font-bold">{aiAnalysis.detailedAnalysis.sleepImpact}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Lifestyle</p>
                      <p className="text-sm font-bold">{aiAnalysis.detailedAnalysis.lifestyleImpact}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">History</p>
                      <p className="text-sm font-bold">{aiAnalysis.detailedAnalysis.medicalHistoryImpact}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Sleep & Symptoms */}
          <div className="space-y-6 lg:col-span-1">
            {/* Sleep Score */}
            <div className="card-medical p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Sleep Score</h3>
                </div>
                <span className="text-sm text-muted-foreground">Today</span>
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <span className="text-5xl font-bold text-primary">{latestSleepScore}</span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>

              {sleepEntries.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last night</span>
                    <span className="font-medium">{sleepEntries[0].hours_slept}h sleep</span>
                  </div>
                  <div className="mt-3 flex gap-1">
                    {sleepEntries.slice(0, 7).reverse().map((entry, idx) => (
                      <div
                        key={idx}
                        className="h-8 flex-1 rounded-md transition-all"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${(entry.sleep_score || 0) / 100})`,
                        }}
                        title={`${entry.logged_date}: ${entry.sleep_score || 0}/100`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">Last 7 days</p>
                </div>
              )}
            </div>

            {/* Recent Symptoms */}
            <div className="card-medical p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Recent Symptoms</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSymptomModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {healthLogs.length > 0 ? (
                <div className="space-y-3">
                  {healthLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="rounded-xl bg-muted/50 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {log.symptoms.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            >
                              {symptoms.find((sym) => sym.id === s)?.label || s}
                            </span>
                          ))}
                          {log.symptoms.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{log.symptoms.length - 2} more
                            </span>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            (log.severity || 0) >= 7
                              ? "bg-destructive/10 text-destructive"
                              : (log.severity || 0) >= 4
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {log.severity || 0}/10
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Heart className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No symptoms logged yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSymptomModalOpen(true)}
                    className="mt-2"
                  >
                    Log your first symptom
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - AI CONSULTATION */}
          <div className="lg:col-span-1">
            <AiConsultation
              healthContext={{
                recentSymptoms: healthLogs.slice(0, 3),
                sleepScore: latestSleepScore,
                healthRiskScore: aiAnalysis?.healthRiskScore ?? 0,
                pastDiagnoses: profile?.past_diagnoses || [],
                allergies: profile?.allergies || [],
                age: profile?.age ?? undefined,
              }}
            />
          </div>
        </div>

        {/* Doctor Recommendations & Access Keys Row */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Doctor Recommendations */}
          <div className="card-medical p-6">
            <div className="mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Recommended Doctors</h3>
            </div>

            <div className="space-y-3">
              {mockDoctors.slice(0, 3).map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center gap-4 rounded-xl border border-border/50 p-4"
                >
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{doctor.distance}</span>
                      <span className="text-yellow-500">★ {doctor.rating}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Book
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Access Keys */}
          <div className="card-medical p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Access Keys</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAccessKeyModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {accessKeys.length > 0 ? (
              <div className="space-y-3">
                {accessKeys.slice(0, 3).map((key) => (
                  <div key={key.id} className="rounded-xl bg-muted/50 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs">{key.access_key}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          key.is_used
                            ? "bg-muted text-muted-foreground"
                            : new Date(key.expires_at) < new Date()
                            ? "bg-destructive/10 text-destructive"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {key.is_used
                          ? "Used"
                          : new Date(key.expires_at) < new Date()
                          ? "Expired"
                          : "Active"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {key.doctor_name || "Any doctor"} • {key.hospital_name || "Any hospital"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No access keys generated</p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">Medical Disclaimer</p>
              <p className="text-sm text-muted-foreground">
                This system does not provide medical diagnosis. AI assists with symptom
                tracking and risk awareness only. Always consult a qualified healthcare
                professional for medical advice.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Symptom Logging Modal */}
      <Dialog open={symptomModalOpen} onOpenChange={setSymptomModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              I Feel Uneasy
            </DialogTitle>
            <DialogDescription>
              Select your symptoms and rate their severity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label className="mb-3 block">What symptoms are you experiencing?</Label>
              <div className="grid grid-cols-2 gap-2">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => handleSymptomToggle(symptom.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left transition-all ${
                      selectedSymptoms.includes(symptom.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{symptom.icon}</span>
                    <span className="text-sm font-medium">{symptom.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Severity: {symptomSeverity}/10</Label>
              <Slider
                value={[symptomSeverity]}
                onValueChange={([v]) => setSymptomSeverity(v)}
                min={1}
                max={10}
                step={1}
                className="mt-4"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span>Severe</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Additional Notes</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecording}
                  className={isRecording ? "text-destructive" : ""}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-1 h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="mr-1 h-4 w-4" />
                      Voice
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                placeholder="Describe how you're feeling... (supports English & Hinglish)"
                className="input-medical"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSymptomModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-primary text-white"
              onClick={handleLogSymptoms}
              disabled={selectedSymptoms.length === 0}
            >
              Log Symptoms
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sleep Logging Modal */}
      <Dialog open={sleepModalOpen} onOpenChange={setSleepModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              Log Your Sleep
            </DialogTitle>
            <DialogDescription>How was your sleep last night?</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label>Hours Slept: {sleepHours}h</Label>
              <Slider
                value={[sleepHours]}
                onValueChange={([v]) => setSleepHours(v)}
                min={1}
                max={14}
                step={0.5}
                className="mt-4"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>1h</span>
                <span>14h</span>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Sleep Quality</Label>
              <div className="grid grid-cols-2 gap-2">
                {sleepQualityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSleepQuality(option.value as "excellent" | "good" | "average" | "poor")}
                    className={`rounded-xl border-2 px-4 py-3 text-center transition-all ${
                      sleepQuality === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <p className="mt-1 text-sm font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSleepModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-primary text-white"
              onClick={handleLogSleep}
            >
              Log Sleep
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Key Generation Modal */}
      <Dialog open={accessKeyModalOpen} onOpenChange={setAccessKeyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Generate Doctor Access Key
            </DialogTitle>
            <DialogDescription>
              Create a one-time, time-limited access key for your doctor
            </DialogDescription>
          </DialogHeader>

          {!generatedKey ? (
            <>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="doctorName">Doctor's Name (Optional)</Label>
                  <Input
                    id="doctorName"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Smith"
                    className="input-medical mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hospitalName">Hospital/Clinic (Optional)</Label>
                  <Input
                    id="hospitalName"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="Apollo Hospital"
                    className="input-medical mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="purpose">Visit Purpose (Optional)</Label>
                  <Input
                    id="purpose"
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    placeholder="General checkup"
                    className="input-medical mt-1"
                  />
                </div>

                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Key will expire in 24 hours</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAccessKeyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-primary text-white"
                  onClick={handleGenerateAccessKey}
                >
                  Generate Key
                </Button>
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
                <p className="mb-2 text-sm text-muted-foreground">Your Access Key</p>
                <p className="font-mono text-xl font-bold text-primary">
                  {generatedKey.key}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => copyAccessKey(generatedKey.key)}
                >
                  {keyCopied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Key
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  One-time use only
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Expires in 24 hours
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Cryptographically secured
                </p>
              </div>

              <Button
                className="mt-6 w-full"
                onClick={() => {
                  setGeneratedKey(null);
                  setDoctorName("");
                  setHospitalName("");
                  setVisitPurpose("");
                  setAccessKeyModalOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Insights Modal */}
      <Dialog open={aiInsightModalOpen} onOpenChange={setAiInsightModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Health Insights
            </DialogTitle>
            <DialogDescription>
              Detailed analysis of your health patterns
            </DialogDescription>
          </DialogHeader>

          {aiAnalysis && (
            <div className="space-y-6 py-4">

              <div
                className={`rounded-xl p-4 ${
                  aiAnalysis.urgencyLevel === "emergency"
                    ? "bg-destructive/10"
                    : aiAnalysis.urgencyLevel === "monitor"
                    ? "bg-warning/10"
                    : "bg-success/10"
                }`}
              >
                <p className="mb-2 font-medium">Urgency Level</p>
                <p className="text-sm capitalize">{aiAnalysis.urgencyLevel}</p>
              </div>

              <div>
                <p className="mb-3 font-medium">Analysis Reasoning</p>
                <ul className="space-y-2">
                  {aiAnalysis.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="mb-2 font-medium">Executive Summary</p>
                <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
              </div>

              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
                <p className="flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  AI assists with risk awareness only. This is not a medical diagnosis.
                </p>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-gradient-primary text-white"
            onClick={() => setAiInsightModalOpen(false)}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}