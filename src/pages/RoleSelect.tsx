import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Digital Hospital</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Who are you joining as?
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Select your role to get a personalized experience
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Patient */}
            <div
              onClick={() => setSelectedRole("patient")}
              className={`relative cursor-pointer rounded-2xl border-2 p-8 transition-all duration-200 ${
                selectedRole === "patient"
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-md"
              }`}
            >
              {selectedRole === "patient" && (
                <div className="absolute right-4 top-4 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              )}
              <div
                className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                  selectedRole === "patient" ? "bg-gradient-primary" : "bg-muted"
                }`}
              >
                <User
                  className={`h-8 w-8 ${
                    selectedRole === "patient" ? "text-white" : "text-muted-foreground"
                  }`}
                />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Patient</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Track your health, consult doctors, manage your medical records, and get
                AI-powered health insights.
              </p>
              <ul className="mt-5 space-y-2">
                {[
                  "Health dashboard & tracking",
                  "Book doctor consultations",
                  "AI symptom checker",
                  "Medical records storage",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedRole === "patient" ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Doctor */}
            <div
              onClick={() => setSelectedRole("doctor")}
              className={`relative cursor-pointer rounded-2xl border-2 p-8 transition-all duration-200 ${
                selectedRole === "doctor"
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-md"
              }`}
            >
              {selectedRole === "doctor" && (
                <div className="absolute right-4 top-4 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              )}
              <div
                className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                  selectedRole === "doctor" ? "bg-gradient-primary" : "bg-muted"
                }`}
              >
                <Stethoscope
                  className={`h-8 w-8 ${
                    selectedRole === "doctor" ? "text-white" : "text-muted-foreground"
                  }`}
                />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Doctor</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Manage your patients, conduct virtual consultations, and access professional
                medical tools.
              </p>
              <ul className="mt-5 space-y-2">
                {[
                  "Patient management panel",
                  "Virtual consultations",
                  "Prescription management",
                  "Verified doctor badge",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedRole === "doctor" ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Continue */}
          <div className="mt-10 flex justify-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedRole || loading}
              size="lg"
              className="gap-2 bg-gradient-primary px-10 text-white disabled:opacity-40"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Continue as{" "}
                  {selectedRole === "doctor"
                    ? "Doctor"
                    : selectedRole === "patient"
                    ? "Patient"
                    : "..."}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            You cannot change your role later. Choose carefully.
          </p>
        </div>
      </main>
    </div>
  );
}