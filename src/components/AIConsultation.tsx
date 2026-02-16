import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  AlertTriangle,
  X,
  MessageSquare,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AiConsultationProps {
  healthContext?: {
    recentSymptoms?: any[];
    sleepScore?: number;
    healthRiskScore?: number;
    pastDiagnoses?: string[];
    allergies?: string[];
    age?: number;
  };
}

export function AiConsultation({ healthContext }: AiConsultationProps) {
  const [languagePreference, setLanguagePreference] = useState<
    "english" | "hinglish" | null
  >(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Hello! / Namaste!\n\nPlease choose your preferred language:\n\n🇬🇧 English - For responses in English\n🇮🇳 Hinglish - Hindi-English mix mein responses\n\nClick below to select:",
      timestamp: new Date(),
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleLanguageSelect = (language: "english" | "hinglish") => {
    setLanguagePreference(language);
    const welcomeMessage =
      language === "english"
        ? "Great! I'll respond in English. 🩺\n\nI'm your personal health assistant. I can help with:\n• **Symptoms** — understanding what you're experiencing\n• **Diet & Nutrition** — food, supplements, hydration\n• **Exercise & Recovery** — safe routines and rest\n• **Sleep & Mental Health** — better rest, stress relief\n• **Medications** — general info (not prescriptions)\n\nWhat's on your mind today?"
        : "Badhiya! Main Hinglish mein respond karungi. 🩺\n\nMain aapki personal health assistant hoon. Main madad kar sakti hoon:\n• **Symptoms** — aap kya experience kar rahe hain\n• **Diet & Nutrition** — khaana, supplements, paani\n• **Exercise & Recovery** — safe routines aur rest\n• **Sleep & Mental Health** — achhi neend, stress relief\n• **Medications** — general info (prescription nahi)\n\nAaj kya jaanna chahte hain?";

    setChatMessages([
      {
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  };

  const buildConversationHistory = (currentUserMsg: string) => {
    const history = chatMessages
      .slice(1)
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    history.push({ role: "user", content: currentUserMsg });
    return history;
  };

  const callGroqApi = async (userQuery: string): Promise<string> => {
    try {
      const isEnglish = languagePreference === "english";

      const patientProfile = healthContext
        ? [
            healthContext.age ? `- Age: ${healthContext.age} years` : null,
            healthContext.recentSymptoms?.length
              ? `- Recent symptoms: ${healthContext.recentSymptoms.map((s) => s.symptoms).join(", ")}`
              : null,
            healthContext.sleepScore != null
              ? `- Sleep score: ${healthContext.sleepScore}/100`
              : null,
            healthContext.healthRiskScore != null
              ? `- Health risk score: ${healthContext.healthRiskScore}/100`
              : null,
            healthContext.pastDiagnoses?.length
              ? `- Past diagnoses: ${healthContext.pastDiagnoses.join(", ")}`
              : null,
            healthContext.allergies?.length
              ? `- Known allergies: ${healthContext.allergies.join(", ")}`
              : null,
          ]
            .filter(Boolean)
            .join("\n")
        : "- No profile data available";

      const conversationHistory = buildConversationHistory(userQuery);
      const formattedHistory = conversationHistory
        .slice(0, -1)
        .map((m) => `${m.role === "user" ? "Patient" : "Dr. Aria"}: ${m.content}`)
        .join("\n");

      const systemRole = `You are Dr. Aria, a calm, empathetic, and knowledgeable AI health assistant with expertise in general medicine, preventive care, nutrition, and mental wellness. You communicate like a trusted family doctor — warm, clear, and never alarmist.`;

      const safetyRules = `SAFETY & RESPONSE RULES:
1. NEVER diagnose definitively. Use language like "this could be..." or "common causes include..."
2. NEVER prescribe specific medications or dosages.
3. If symptoms suggest emergency (chest pain, difficulty breathing, sudden severe headache, loss of consciousness, stroke signs), IMMEDIATELY respond: "🚨 Please call 112 / 108 right now or go to the nearest emergency room."
4. For mental health topics, be especially gentle and non-judgmental.
5. Suggest seeing a real doctor for persistent, worsening, or unclear symptoms.
6. Factor in the patient's known allergies when mentioning any remedies or foods.
7. Be honest if unsure — say so clearly.`;

      const responseFormat = `RESPONSE FORMAT:
- Length: 80–150 words maximum
- Use **bold** for key terms and action items
- Use numbered lists for steps, bullet points for options
- Acknowledge the concern briefly before answering
- End with 2–3 practical, actionable tips
- Close with this exact disclaimer on a new line: ${
        isEnglish
          ? "⚠️ *For informational purposes only — not a substitute for professional medical advice.*"
          : "⚠️ *Sirf information ke liye — professional medical advice ki jagah nahi.*"
      }`;

      const languageInstruction = isEnglish
        ? "Respond in clear, friendly English."
        : "Respond in Hinglish — a natural mix of Hindi and English using Roman script only (no Devanagari). Example: 'Aapko thoda rest lena chahiye and stay hydrated.'";

      const fullPrompt = `${systemRole}

LANGUAGE: ${languageInstruction}

PATIENT PROFILE:
${patientProfile}

${safetyRules}

${responseFormat}

${formattedHistory ? `CONVERSATION HISTORY:\n${formattedHistory}\n` : ""}
Patient: ${userQuery}
Dr. Aria:`;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3",
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.65,
            top_p: 0.9,
            num_predict: 512,
            stop: ["Patient:", "User:"],
          },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 404) {
          return isEnglish
            ? "⚠️ **Model Not Found**\n\nThe llama3 model isn't loaded in Ollama.\n\n**Fix:** Run `ollama pull llama3` in your terminal, then try again."
            : "⚠️ **Model nahi mila**\n\nllama3 model Ollama mein load nahi hai.\n\n**Fix:** Terminal mein `ollama pull llama3` run karein, phir retry karein.";
        }
        return isEnglish
          ? `⚠️ **Server Error (${status})**\n\nOllama returned an unexpected error. Please check that Ollama is running correctly.`
          : `⚠️ **Server Error (${status})**\n\nOllama mein kuch gadbad hai. Check karein ki Ollama sahi se chal raha hai.`;
      }

      const data = await response.json();
      const aiResponse = data?.response?.trim();

      if (!aiResponse) {
        return isEnglish
          ? "⚠️ I couldn't generate a response. Please rephrase your question and try again."
          : "⚠️ Response generate nahi ho paya. Please question thoda alag tarike se puchein.";
      }

      return aiResponse;
    } catch (error: any) {
      const isEnglish = languagePreference === "english";

      if (
        error.name === "TypeError" &&
        (error.message.includes("fetch") || error.message.includes("Failed to fetch") || error.message.includes("ECONNREFUSED"))
      ) {
        return "AI server offline. Please start Ollama.";
      }

      return isEnglish
        ? `⚠️ **Unexpected Error**\n\nSomething went wrong. Please try again.\n\n_Error: ${error.message}_`
        : `⚠️ **Technical Issue**\n\nKuch gadbad hui. Retry karein.\n\n_Error: ${error.message}_`;
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isAiTyping || !languagePreference) return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, newUserMessage]);
    const sentMessage = userMessage;
    setUserMessage("");
    setIsAiTyping(true);

    try {
      const aiResponse = await callGroqApi(sentMessage);
      const newAiMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Message handling error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          languagePreference === "english"
            ? "⚠️ Sorry, I couldn't process your message. Please try again, or call **112 / 108** for emergencies."
            : "⚠️ Maaf kijiye, message process nahi ho paya. Retry karein ya emergency ke liye **112 / 108** dial karein.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions =
    languagePreference === "english"
      ? [
          "My headache won't go away",
          "How can I sleep better?",
          "Diet tips for better health",
          "I feel anxious and stressed",
        ]
      : [
          "Sir dard band nahi ho raha",
          "Neend acchi kaise karein?",
          "Healthy khane ke tips",
          "Anxiety aur stress feel ho raha hai",
        ];

  return (
    <div className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">AI Consultation</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Powered by Ollama · Llama 3
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded((e) => !e)}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {isExpanded ? (
            <X className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[420px] min-h-[200px]">
        {chatMessages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {message.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={i}>{part.slice(2, -2)}</strong>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
              <p
                className={`mt-1 text-[10px] ${message.role === "user" ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}
              >
                {message.timestamp.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isAiTyping && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Language Selection */}
      {!languagePreference ? (
        <div className="border-t border-border/50 p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Choose your language:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleLanguageSelect("english")}
              className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-left transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mb-1 text-2xl">🇬🇧</div>
              <div className="font-semibold text-sm">English</div>
              <div className="text-xs text-muted-foreground">
                Responses in English
              </div>
            </button>
            <button
              onClick={() => handleLanguageSelect("hinglish")}
              className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-orange-50 to-orange-100 p-4 text-left transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mb-1 text-2xl">🇮🇳</div>
              <div className="font-semibold text-sm">Hinglish</div>
              <div className="text-xs text-muted-foreground">
                Hindi-English mix
              </div>
            </button>
          </div>
        </div>
      ) : chatMessages.length === 1 && !isAiTyping ? (
        <div className="border-t border-border/50 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Quick questions:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => setUserMessage(question)}
                className="rounded-xl border border-border/50 bg-background p-2.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Input Area */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2">
          <Textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !languagePreference
                ? "Please select language first..."
                : languagePreference === "english"
                  ? "Describe your symptoms or ask a health question..."
                  : "Apne symptoms describe karein ya health question puchein..."
            }
            className="input-medical min-h-[60px] resize-none"
            rows={2}
            disabled={isAiTyping || !languagePreference}
          />
          <Button
            onClick={handleSendMessage}
            disabled={
              !userMessage.trim() || isAiTyping || !languagePreference
            }
            className="h-auto bg-gradient-primary text-white"
          >
            {isAiTyping ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning/5 p-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">
            AI assistant for information only. Not a substitute for professional
            medical advice. Emergency? Call{" "}
            <strong className="text-foreground">112 / 108</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}