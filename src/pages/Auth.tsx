import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { z } from "zod";
import { supabase } from "../supabase/client";

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

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            onClick={signInWithGoogle}
            className="w-full border"
            size="lg"
          >
            Continue with Google
          </Button>

          <div className="my-6 text-center text-sm text-muted-foreground">
            or
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
