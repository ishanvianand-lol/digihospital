import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../hooks/useAuth";
import { Activity, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { z } from "zod";
import { supabase } from "../supabase/client";

// ─── Google OAuth ──────────────────────────────────────────────────────────────
// Google login ke baad /role-select pe redirect hoga
// RoleSelect page check karega: agar role already hai → onboarding/dashboard bhejo
const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/role-select`,
    },
  });
};

// ─── Validation Schema ────────────────────────────────────────────────────────
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Smart redirect after login ──────────────────────────────────────────────
  // User login kare toh uski role dekho aur sahi jagah bhejo
  useEffect(() => {
    if (!user) return;

    const redirect = async () => {
      const role = user.user_metadata?.role;

      // Naya user — pehle role choose karo
      if (!role) {
        navigate("/role-select");
        return;
      }

      if (role === "doctor") {
        // Doctor ka onboarding complete hai?
        const { data } = await supabase
          .from("doctor_profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        navigate(data?.onboarding_completed ? "/dashboard" : "/doctor-onboarding");
      } else {
        // Patient ka onboarding complete hai?
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        navigate(data?.onboarding_completed ? "/dashboard" : "/onboarding");
      }
    };

    redirect();
  }, [user, navigate]);

  // ── Form Validation ────────────────────────────────────────────────────────
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
          else if (e.path[0] === "password") fieldErrors.password = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
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
            title: error.message.includes("already registered") ? "Account exists" : "Sign up failed",
            description: error.message.includes("already registered")
              ? "This email is already registered. Please sign in instead."
              : error.message,
          });
        } else {
          toast({
            title: "Check your email",
            description: "We sent you a confirmation link. Please verify your email to continue.",
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: error.message.includes("Invalid login")
              ? "Invalid credentials"
              : error.message.includes("Email not confirmed")
              ? "Email not verified"
              : "Sign in failed",
            description: error.message.includes("Invalid login")
              ? "The email or password you entered is incorrect."
              : error.message.includes("Email not confirmed")
              ? "Please check your email and click the confirmation link."
              : error.message,
          });
        }
        // Redirect → useEffect handles it when `user` updates
      }
    } finally {
      setLoading(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden bg-gradient-hero lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center text-white">
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <Activity className="h-16 w-16" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold">Digital Hospital</h1>
          <p className="text-lg text-white/80">
            AI-powered preventive healthcare with blockchain-secured medical records.
            Take control of your health journey today.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Digital Hospital</span>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isSignUp
                ? "Start your health journey with Digital Hospital"
                : "Sign in to access your health dashboard"}
            </p>
          </div>

          {/* Google — sabse upar, prominent */}
          <Button
            type="button"
            onClick={signInWithGoogle}
            className="w-full border border-border bg-white text-foreground hover:bg-muted"
            size="lg"
          >
            {/* Google SVG icon */}
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your-name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input-medical pl-10 ${errors.email ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input-medical pl-10 ${errors.password ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gap-2 bg-gradient-primary text-white"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-primary hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}