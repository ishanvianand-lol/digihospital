import { useState, useRef, useEffect } from "react";
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
    // Convert existing chat messages to Groq format (skip the first welcome message)
    const history = chatMessages
      .slice(1) // Skip the language selection welcome
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    history.push({ role: "user", content: currentUserMsg });
    return history;
  };

  const callGroqApi = async (userQuery: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      console.log("=== GROQ API DEBUG START ===");
      console.log("1. API Key exists:", !!apiKey);
      console.log("2. User Query:", userQuery);

      if (!apiKey) {
        console.error("❌ Groq API Key missing!");
        return (
          "⚠️ **Setup Required**\n\n" +
          "Groq API key configure nahi hai. Please:\n\n" +
          "1. [Groq Console](https://console.groq.com/keys) pe jaaein\n" +
          "2. Free API key generate karein\n" +
          "3. `.env` file mein add karein: `VITE_GROQ_API_KEY=your_key`\n" +
          "4. Dev server restart karein: `npm run dev`"
        );
      }

      // Build contextual health profile string
      const healthProfile = healthContext
        ? [
            healthContext.age ? `Age: ${healthContext.age}` : null,
            healthContext.recentSymptoms?.length
              ? `Recent symptoms: ${healthContext.recentSymptoms.map((s) => s.symptoms).join(", ")}`
              : null,
            healthContext.sleepScore != null
              ? `Sleep score: ${healthContext.sleepScore}/100`
              : null,
            healthContext.healthRiskScore != null
              ? `Health risk score: ${healthContext.healthRiskScore}/100`
              : null,
            healthContext.pastDiagnoses?.length
              ? `Past diagnoses: ${healthContext.pastDiagnoses.join(", ")}`
              : null,
            healthContext.allergies?.length
              ? `Known allergies: ${healthContext.allergies.join(", ")}`
              : null,
          ]
            .filter(Boolean)
            .join("\n")
        : null;

      const isEnglish = languagePreference === "english";

      // ✅ IMPROVED SYSTEM PROMPT — structured, empathetic, clinically-informed
      const systemPrompt = `You are Dr. Aria, a warm, knowledgeable, and highly empathetic AI health assistant built into a personal health app. You have the knowledge of a general physician with expertise in preventive care, nutrition, mental wellness, and lifestyle medicine.

LANGUAGE: Respond ONLY in ${isEnglish ? "clear, friendly English" : "Hinglish — a natural mix of Hindi and English, like a desi doctor speaking to a patient. Use Roman script for Hindi words (not Devanagari). Mix both languages naturally, e.g., 'Aapko thoda rest lena chahiye and keep yourself hydrated.'"}

${healthProfile ? `PATIENT PROFILE (use this context to personalize your response):\n${healthProfile}\n` : ""}

RESPONSE STYLE:
- Be warm, reassuring, and human — like a trusted family doctor
- Keep responses focused and practical (aim for 80–150 words)
- Use **bold** for key terms, medications, or action items
- Use numbered lists for step-by-step guidance, bullet points for options
- Acknowledge the user's concern before answering ("That sounds uncomfortable..." / "Ye common hai, par dhyan dena zaroori hai...")
- Personalize using their health profile when relevant (e.g., if they have a known allergy, factor it in)
- For serious or emergency symptoms (chest pain, difficulty breathing, sudden severe headache, loss of consciousness), IMMEDIATELY say: "🚨 Please call **112 / 108** right now or go to the nearest emergency room."

CONTENT GUIDELINES:
- Provide clear, evidence-based health information
- Suggest when to see a doctor vs. manage at home
- Give 2–3 practical, actionable tips whenever possible
- For mental health topics: be especially gentle and non-judgmental
- Never diagnose definitively — say "this *could* be..." or "common causes include..."
- Never prescribe specific medications or dosages
- If unsure, say so — honesty builds trust

END every response with a brief single-line disclaimer in the user's language:
${isEnglish ? '⚠️ *For informational purposes only — not a substitute for professional medical advice.*' : '⚠️ *Sirf information ke liye — professional medical advice ki jagah nahi.*'}`;

      const conversationHistory = buildConversationHistory(userQuery);

      console.log(
        "3. Sending",
        conversationHistory.length,
        "messages to Groq..."
      );

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile", // Best free Groq model for reasoning
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationHistory,
            ],
            temperature: 0.65,       // Slightly lower = more consistent, factual
            max_tokens: 512,
            top_p: 0.9,
            stream: false,
          }),
        }
      );

      console.log("4. Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Groq API Error:", errorData);

        const errorMessages: Record<number, string> = {
          401: isEnglish
            ? "⚠️ **Invalid API Key (401)**\n\nYour Groq API key is invalid or expired.\n\n**Fix:** Go to [console.groq.com](https://console.groq.com/keys), generate a new key, and update your `.env` file."
            : "⚠️ **Invalid API Key (401)**\n\nGroq API key invalid ya expired hai.\n\n**Fix:** [console.groq.com](https://console.groq.com/keys) pe nayi key banaaein aur `.env` update karein.",
          429: isEnglish
            ? "⚠️ **Rate Limited (429)**\n\nToo many requests. Groq's free tier allows 30 req/min.\n\n**Fix:** Wait 30 seconds and try again."
            : "⚠️ **Rate Limited (429)**\n\nBahut zyada requests ho gaye. 30 second wait karein aur retry karein.",
          500: isEnglish
            ? "⚠️ **Server Error (500)**\n\nGroq's servers are temporarily unavailable. Please try again in a minute."
            : "⚠️ **Server Error (500)**\n\nGroq ka server temporarily down hai. Ek minute baad try karein.",
        };

        return (
          errorMessages[response.status] ||
          (isEnglish
            ? `⚠️ **API Error (${response.status})**\n\nSomething went wrong. Please try again.`
            : `⚠️ **API Error (${response.status})**\n\nKuch gadbad ho gayi. Please try again.`)
        );
      }

      const data = await response.json();
      console.log("5. Groq response received ✅");

      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        console.error("❌ Empty response from Groq:", data);
        return isEnglish
          ? "⚠️ I couldn't generate a response. Please rephrase your question and try again."
          : "⚠️ Response generate nahi ho paya. Please question thoda alag tarike se puchein.";
      }

      console.log("6. Response length:", aiResponse.length);
      console.log("=== GROQ API DEBUG END ===");

      return aiResponse;
    } catch (error: any) {
      console.error("=== GROQ API ERROR ===", error);

      const isEnglish = languagePreference === "english";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return isEnglish
          ? "⚠️ **Network Error**\n\nCouldn't reach Groq's servers. Check your internet connection and try again."
          : "⚠️ **Network Error**\n\nInternet connection check karein aur retry karein.";
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

  const glass = (accent = "rgba(255,255,255,0.06)"): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${accent}`,
    borderRadius: 22,
    boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
  });

  return (
    <div style={{ ...glass("rgba(56,189,248,0.13)"), display:"flex", flexDirection:"column", overflow:"hidden" }}>
      
      <style>{`
        .ai-btn { transition: all .18s !important; }
        .ai-btn:hover { transform: translateY(-1px) !important; filter: brightness(1.1) !important; }
        .ai-msg { animation: _msgSlide .3s ease both; }
        @keyframes _msgSlide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(56,189,248,0.05)",
        padding:"18px 20px"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:42,
            height:42,
            borderRadius:"50%",
            background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))",
            border:"1px solid rgba(56,189,248,0.3)",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            boxShadow:"0 4px 16px rgba(56,189,248,0.2)"
          }}>
            <Bot size={22} style={{ color:"#38bdf8" }} />
          </div>
          <div>
            <p style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:2 }}>AI Consultation</p>
            <p style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"rgba(255,255,255,0.32)", fontWeight:500 }}>
              <Sparkles size={12} />
              Powered by Groq · Llama 3.3 70B
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded((e) => !e)}
          className="ai-btn"
          style={{
            width:36,
            height:36,
            borderRadius:"50%",
            background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.1)",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            cursor:"pointer",
            color:"rgba(255,255,255,0.5)"
          }}
        >
          {isExpanded ? <X size={18} /> : <MessageSquare size={18} />}
        </button>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex:1,
        overflowY:"auto",
        padding:"20px",
        display:"flex",
        flexDirection:"column",
        gap:16,
        maxHeight:420,
        minHeight:200,
        background:"rgba(0,0,0,0.1)"
      }}>
        {chatMessages.map((message, idx) => (
          <div
            key={idx}
            className="ai-msg"
            style={{
              display:"flex",
              gap:12,
              flexDirection: message.role === "user" ? "row-reverse" : "row",
              alignItems:"flex-start"
            }}
          >
            {message.role === "assistant" && (
              <div style={{
                width:32,
                height:32,
                flexShrink:0,
                borderRadius:"50%",
                background:"rgba(56,189,248,0.15)",
                border:"1px solid rgba(56,189,248,0.25)",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                marginTop:4
              }}>
                <Bot size={18} style={{ color:"#38bdf8" }} />
              </div>
            )}
            <div
              style={{
                maxWidth:"80%",
                borderRadius:16,
                padding:"12px 16px",
                fontSize:13,
                lineHeight:1.7,
                whiteSpace:"pre-wrap",
                wordBreak:"break-word",
                background: message.role === "user"
                  ? "linear-gradient(135deg,#0ea5e9,#0284c7)"
                  : "rgba(255,255,255,0.05)",
                color: message.role === "user" ? "#fff" : "rgba(255,255,255,0.82)",
                border: message.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: message.role === "user" ? "0 4px 16px rgba(14,165,233,0.25)" : "none",
                borderTopRightRadius: message.role === "user" ? 4 : 16,
                borderTopLeftRadius: message.role === "assistant" ? 4 : 16
              }}
            >
              {/* Render bold markdown manually */}
              {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={i} style={{ color: message.role === "user" ? "#fff" : "#38bdf8" }}>
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
              <p
                style={{
                  marginTop:8,
                  fontSize:10,
                  color: message.role === "user" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                  textAlign: message.role === "user" ? "right" : "left"
                }}
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
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:32,
              height:32,
              flexShrink:0,
              borderRadius:"50%",
              background:"rgba(56,189,248,0.15)",
              border:"1px solid rgba(56,189,248,0.25)",
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            }}>
              <Bot size={18} style={{ color:"#38bdf8" }} />
            </div>
            <div style={{
              display:"flex",
              alignItems:"center",
              gap:6,
              borderRadius:16,
              borderTopLeftRadius:4,
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.08)",
              padding:"12px 20px"
            }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"rgba(56,189,248,0.5)", animation:"_bounce .6s ease-in-out infinite" }} />
              <span style={{ width:8, height:8, borderRadius:"50%", background:"rgba(56,189,248,0.5)", animation:"_bounce .6s ease-in-out .15s infinite" }} />
              <span style={{ width:8, height:8, borderRadius:"50%", background:"rgba(56,189,248,0.5)", animation:"_bounce .6s ease-in-out .3s infinite" }} />
              <style>{`@keyframes _bounce{0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}}`}</style>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Language Selection */}
      {!languagePreference ? (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px" }}>
          <p style={{ marginBottom:14, fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.55)" }}>
            Choose your language:
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <button
              onClick={() => handleLanguageSelect("english")}
              className="ai-btn"
              style={{
                borderRadius:14,
                border:"2px solid rgba(56,189,248,0.3)",
                background:"linear-gradient(135deg,rgba(56,189,248,0.08),rgba(99,102,241,0.05))",
                padding:"18px 16px",
                textAlign:"left",
                cursor:"pointer"
              }}
            >
              <div style={{ fontSize:28, marginBottom:8 }}>🇬🇧</div>
              <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:4 }}>English</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Responses in English</div>
            </button>
            <button
              onClick={() => handleLanguageSelect("hinglish")}
              className="ai-btn"
              style={{
                borderRadius:14,
                border:"2px solid rgba(251,146,60,0.3)",
                background:"linear-gradient(135deg,rgba(251,146,60,0.08),rgba(234,88,12,0.05))",
                padding:"18px 16px",
                textAlign:"left",
                cursor:"pointer"
              }}
            >
              <div style={{ fontSize:28, marginBottom:8 }}>🇮🇳</div>
              <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.88)", marginBottom:4 }}>Hinglish</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Hindi-English mix</div>
            </button>
          </div>
        </div>
      ) : chatMessages.length === 1 && !isAiTyping ? (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px" }}>
          <p style={{ marginBottom:10, fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            Quick questions:
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {quickQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => setUserMessage(question)}
                className="ai-btn"
                style={{
                  borderRadius:12,
                  border:"1px solid rgba(255,255,255,0.08)",
                  background:"rgba(255,255,255,0.03)",
                  padding:"12px 14px",
                  textAlign:"left",
                  fontSize:12,
                  color:"rgba(255,255,255,0.65)",
                  cursor:"pointer",
                  fontWeight:500
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Input Area */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px" }}>
        <div style={{ display:"flex", gap:12, marginBottom:12 }}>
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
            rows={2}
            disabled={isAiTyping || !languagePreference}
            style={{
              flex:1,
              minHeight:60,
              resize:"none",
              background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:12,
              padding:"12px 14px",
              fontSize:13,
              color:"#e2e8f0",
              outline:"none",
              transition:"border-color .2s"
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!userMessage.trim() || isAiTyping || !languagePreference}
            className="ai-btn"
            style={{
              width:54,
              height:"auto",
              borderRadius:12,
              background:!userMessage.trim() || isAiTyping || !languagePreference
                ? "rgba(56,189,248,0.15)"
                : "linear-gradient(135deg,#0ea5e9,#0284c7)",
              border:"none",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              cursor:!userMessage.trim() || isAiTyping || !languagePreference ? "not-allowed" : "pointer",
              color:"#fff",
              boxShadow:!userMessage.trim() || isAiTyping || !languagePreference
                ? "none"
                : "0 4px 16px rgba(14,165,233,0.3)",
              opacity:!userMessage.trim() || isAiTyping || !languagePreference ? 0.4 : 1
            }}
          >
            {isAiTyping ? (
              <Loader2 size={20} style={{ animation:"_spin .8s linear infinite" }} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        
        {/* Disclaimer */}
        <div style={{
          display:"flex",
          alignItems:"flex-start",
          gap:10,
          borderRadius:12,
          background:"rgba(251,191,36,0.05)",
          border:"1px solid rgba(251,191,36,0.12)",
          padding:"10px 12px"
        }}>
          <AlertTriangle size={14} style={{ color:"#fbbf24", flexShrink:0, marginTop:1 }} />
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", lineHeight:1.6 }}>
            AI assistant for information only. Not a substitute for professional medical advice. Emergency? Call{" "}
            <strong style={{ color:"#f87171", fontWeight:700 }}>112 / 108</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}