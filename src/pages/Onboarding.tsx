import { useState, useEffect } from "react";  // ✅ useEffect added
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Basic Profile</h2>
              <p className="text-muted-foreground">Let's start with your basic information</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="input-medical mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={data.age}
                    onChange={(e) => setData({ ...data, age: e.target.value })}
                    placeholder="Age"
                    className="input-medical mt-1"
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <RadioGroup
                    value={data.gender}
                    onValueChange={(value) => setData({ ...data, gender: value })}
                    className="mt-2 flex gap-4"
                  >
                    {["male", "female", "other"].map((g) => (
                      <div key={g} className="flex items-center space-x-2">
                        <RadioGroupItem value={g} id={g} />
                        <Label htmlFor={g} className="capitalize">
                          {g}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={data.heightCm}
                    onChange={(e) => setData({ ...data, heightCm: e.target.value })}
                    placeholder="170"
                    className="input-medical mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={data.weightKg}
                    onChange={(e) => setData({ ...data, weightKg: e.target.value })}
                    placeholder="70"
                    className="input-medical mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Medical Background</h2>
              <p className="text-muted-foreground">Help us understand your health history</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Known Allergies</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {allergies.map((allergy) => (
                    <div
                      key={allergy}
                      onClick={() => handleAllergyToggle(allergy)}
                      className={`cursor-pointer rounded-xl border-2 px-3 py-2 text-sm transition-all ${
                        data.allergies.includes(allergy)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {allergy}
                    </div>
                  ))}
                </div>
                <Input
                  placeholder="Other allergies (comma separated)"
                  value={data.customAllergy}
                  onChange={(e) => setData({ ...data, customAllergy: e.target.value })}
                  className="input-medical mt-3"
                />
              </div>

              <div>
                <Label className="mb-3 block">Past Diagnoses</Label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {diagnoses.map((diagnosis) => (
                    <div
                      key={diagnosis}
                      onClick={() => handleDiagnosisToggle(diagnosis)}
                      className={`cursor-pointer rounded-xl border-2 px-3 py-2 text-sm transition-all ${
                        data.pastDiagnoses.includes(diagnosis)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {diagnosis}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="medications">Ongoing Medications (Optional)</Label>
                <Textarea
                  id="medications"
                  value={data.ongoingMedications}
                  onChange={(e) => setData({ ...data, ongoingMedications: e.target.value })}
                  placeholder="List any medications you're currently taking..."
                  className="input-medical mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
                <Moon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Lifestyle & Habits</h2>
              <p className="text-muted-foreground">Tell us about your daily routine</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Average Sleep Duration: {data.sleepHoursAvg} hours</Label>
                <Slider
                  value={[data.sleepHoursAvg]}
                  onValueChange={([value]) => setData({ ...data, sleepHoursAvg: value })}
                  min={3}
                  max={12}
                  step={0.5}
                  className="mt-4"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>3h</span>
                  <span>12h</span>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Sleep Quality</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {sleepQualityOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setData({ ...data, sleepQuality: option.value })}
                      className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-center transition-all ${
                        data.sleepQuality === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <p className="mt-1 text-sm font-medium">{option.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="smoking"
                    checked={data.smoking}
                    onCheckedChange={(checked) =>
                      setData({ ...data, smoking: checked as boolean })
                    }
                  />
                  <Label htmlFor="smoking" className="cursor-pointer">
                    Smoking
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="alcohol"
                    checked={data.alcohol}
                    onCheckedChange={(checked) =>
                      setData({ ...data, alcohol: checked as boolean })
                    }
                  />
                  <Label htmlFor="alcohol" className="cursor-pointer">
                    Alcohol
                  </Label>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Daily Activity Level</Label>
                <RadioGroup
                  value={data.activityLevel}
                  onValueChange={(value) => setData({ ...data, activityLevel: value })}
                  className="space-y-2"
                >
                  {activityLevels.map((level) => (
                    <div
                      key={level.value}
                      className={`flex cursor-pointer items-center space-x-3 rounded-xl border-2 px-4 py-3 transition-all ${
                        data.activityLevel === level.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={level.value} id={level.value} />
                      <div>
                        <Label htmlFor={level.value} className="cursor-pointer font-medium">
                          {level.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="w-full px-12 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Digital Hospital</span>
          </div>

          {/* Progress indicator */}
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

      {/* Main Content */}
      <main className="w-full px-12 py-10">
        <div className="card-medical w-full p-10">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
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
                  Complete Setup
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