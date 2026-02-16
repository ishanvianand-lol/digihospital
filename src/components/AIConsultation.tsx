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
  const [languagePreference, setLanguagePreference] = useState<"english" | "hinglish" | null>(null);
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

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleLanguageSelect = (language: "english" | "hinglish") => {
    setLanguagePreference(language);
    
    const welcomeMessage = language === "english"
      ? "Great! I'll respond in English.\n\n🩺 I can help with:\n• Symptoms\n• Diet & nutrition\n• Exercise tips\n• Sleep & mental health\n\nWhat can I help you with?"
      : "Badhiya! Main Hinglish mein respond karungi.\n\n🩺 Main madad kar sakti hoon:\n• Symptoms\n• Diet aur nutrition\n• Exercise tips\n• Sleep aur mental health\n\nKya madad chahiye?";

    setChatMessages([
      {
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  };

  const callGeminiApi = async (userQuery: string): Promise<string> => {
    try {
      // Get API key
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      // Debug logs
      console.log("=== GEMINI API DEBUG START ===");
      console.log("1. API Key exists:", !!apiKey);
      console.log("2. API Key length:", apiKey?.length || 0);
      console.log("3. User Query:", userQuery);

      if (!apiKey) {
        console.error("❌ API Key missing!");
        return "⚠️ **Setup Required!**\n\n" +
               "API key configure nahi hai. Please follow these steps:\n\n" +
               "1. Google AI Studio pe jaaein: https://aistudio.google.com/app/apikey\n" +
               "2. 'Create API Key' button click karein\n" +
               "3. API key copy karein\n" +
               "4. Apni project ke root folder mein .env file banaaein\n" +
               "5. Usme ye add karein: VITE_GEMINI_API_KEY=your_api_key_here\n" +
               "6. Development server restart karein (npm run dev)";
      }

      // Prepare health context
      const contextString = healthContext
        ? `\n\nUser's Health Profile:
- Recent Symptoms: ${healthContext.recentSymptoms?.map((s) => s.symptoms).join(", ") || "None"}
- Sleep Score: ${healthContext.sleepScore || "Not available"}/100
- Health Risk Score: ${healthContext.healthRiskScore || 0}/100
- Past Diagnoses: ${healthContext.pastDiagnoses?.join(", ") || "None"}
- Allergies: ${healthContext.allergies?.join(", ") || "None"}
- Age: ${healthContext.age || "Not provided"}`
        : "";

      const systemPrompt = `You are a helpful AI health assistant. Respond in ${languagePreference === "english" ? "English" : "Hinglish (Hindi-English mix)"}.

CRITICAL RULES:
1. Keep responses SHORT and CRISP (max 3-4 sentences)
2. Be direct and to-the-point
3. Use bullet points when listing things
4. Match user's language: ${languagePreference === "english" ? "Pure English" : "Hinglish (mix Hindi-English naturally)"}
5. For emergencies, immediately say "Call 108 NOW"
6. End with ONE line disclaimer only

${contextString}

User Question: ${userQuery}

Give SHORT, practical answer.`;

      console.log("4. Making API request...");

      // API Request (Updated model name)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        }
      );

      console.log("5. Response Status:", response.status);

      // Handle different error statuses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error Response:", errorData);

        if (response.status === 400) {
          return "⚠️ **Request Error (400)**\n\n" +
                 "API request mein kuch issue hai.\n\n" +
                 "**Possible reasons:**\n" +
                 "• API key format galat hai\n" +
                 "• Request payload invalid hai\n\n" +
                 "**Solution:** Console check karein aur API key verify karein.";
        } else if (response.status === 403) {
          return "⚠️ **Access Denied (403)**\n\n" +
                 "API key invalid ya disabled hai.\n\n" +
                 "**Solution:**\n" +
                 "1. Google AI Studio pe jaaein\n" +
                 "2. Purani key delete karein\n" +
                 "3. Nayi key generate karein\n" +
                 "4. .env file mein update karein\n" +
                 "5. Server restart karein";
        } else if (response.status === 429) {
          return "⚠️ **Too Many Requests (429)**\n\n" +
                 "API quota limit exceed ho gaya hai.\n\n" +
                 "**Free tier limits:**\n" +
                 "• 60 requests per minute\n" +
                 "• 1,500 requests per day\n\n" +
                 "**Solution:** 1-2 minute wait karein aur phir try karein.";
        } else if (response.status === 500 || response.status === 503) {
          return "⚠️ **Server Error (500/503)**\n\n" +
                 "Google ka server temporarily down hai.\n\n" +
                 "**Solution:** 2-3 minute wait karein aur retry karein.";
        }

        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      // Parse response
      const data = await response.json();
      console.log("6. Response received:", !!data);

      // Validate response structure
      if (!data.candidates || data.candidates.length === 0) {
        console.error("❌ No candidates in response:", data);
        
        // Check if blocked by safety filters
        if (data.promptFeedback?.blockReason) {
          return "⚠️ **Content Blocked**\n\n" +
                 `Response blocked due to: ${data.promptFeedback.blockReason}\n\n` +
                 "Kripya apna question thoda alag tarike se phrase karein.";
        }

        return "⚠️ **Empty Response**\n\n" +
               "AI ne koi response generate nahi kiya.\n\n" +
               "**Possible reasons:**\n" +
               "• Safety filters ne block kar diya\n" +
               "• Question too broad ya vague tha\n\n" +
               "Please thoda specific question puchein.";
      }

      let aiResponse = data.candidates[0].content.parts[0].text;
      console.log("7. Response length:", aiResponse.length);

      // Add disclaimer if not present
      if (!aiResponse.toLowerCase().includes("disclaimer")) {
        const disclaimerText = languagePreference === "english" 
          ? "\n\n⚠️ Not medical advice. See a doctor for serious concerns."
          : "\n\n⚠️ Medical advice nahi. Serious issues ke liye doctor se milein.";
        aiResponse += disclaimerText;
      }

      console.log("✅ API call successful!");
      console.log("=== GEMINI API DEBUG END ===");

      return aiResponse;

    } catch (error: any) {
      console.error("=== GEMINI API ERROR ===");
      console.error("Error Type:", error.name);
      console.error("Error Message:", error.message);
      console.error("Full Error:", error);
      console.error("======================");

      // Network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return "⚠️ **Network Error**\n\n" +
               "Internet connection mein issue hai.\n\n" +
               "**Solution:**\n" +
               "• Internet connection check karein\n" +
               "• VPN disable karein (agar use kar rahe ho)\n" +
               "• Firewall settings check karein\n" +
               "• Different network try karein";
      }

      // Generic error
      return "⚠️ **Technical Issue**\n\n" +
             "Kuch technical problem aa gayi hai.\n\n" +
             "**Kya karein:**\n" +
             "1. Console logs check karein (F12 → Console)\n" +
             "2. API key verify karein\n" +
             "3. 1-2 minute baad retry karein\n" +
             "4. Emergency ke liye 108 dial karein\n\n" +
             `Error: ${error.message}`;
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
    setUserMessage("");
    setIsAiTyping(true);

    try {
      const aiResponse = await callGeminiApi(userMessage);

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
          "⚠️ Maaf kijiye, message process nahi ho paya.\n\n" +
          "Please try again ya emergency ke liye 108 dial karein.",
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

  const quickQuestions = [
    "My headache won't go away",
    "How can I sleep better?",
    "Diet tips for better health",
    "I feel anxious and stressed",
  ];

  return (
    <div
      className={`card-medical transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50 md:inset-8" : "h-full"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-6 w-6 text-primary" />
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Consultation</h3>
              <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
            </div>
          </div>
          {isExpanded ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Chat Messages */}
        <div
          className={`flex-1 space-y-4 overflow-y-auto p-4 ${
            isExpanded ? "max-h-[60vh]" : "max-h-[300px]"
          }`}
        >
          {chatMessages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
                <p className="mt-1 text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isAiTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    AI soch rahi hai...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Language Selection or Quick Questions */}
          {!languagePreference ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Choose your language:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLanguageSelect("english")}
                  className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-left transition-all hover:border-primary hover:shadow-lg"
                >
                  <div className="text-2xl mb-2">🇬🇧</div>
                  <div className="font-semibold text-foreground">English</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Responses in English
                  </div>
                </button>
                <button
                  onClick={() => handleLanguageSelect("hinglish")}
                  className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-orange-50 to-orange-100 p-4 text-left transition-all hover:border-primary hover:shadow-lg"
                >
                  <div className="text-2xl mb-2">🇮🇳</div>
                  <div className="font-semibold text-foreground">Hinglish</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hindi-English mix
                  </div>
                </button>
              </div>
            </div>
          ) : chatMessages.length === 1 && !isAiTyping ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {languagePreference === "english" ? "Quick questions:" : "Quick questions:"}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserMessage(question)}
                    className="rounded-xl border border-border/50 bg-background p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div ref={chatEndRef} />
        </div>

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
                  ? "Type your health question..."
                  : "Apna health question type karein..."
              }
              className="input-medical min-h-[60px] resize-none"
              rows={2}
              disabled={isAiTyping || !languagePreference}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || isAiTyping || !languagePreference}
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
              medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}