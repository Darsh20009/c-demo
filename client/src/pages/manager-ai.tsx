import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Sparkles, Send, RefreshCw, Bot, User, Loader2, Brain,
  TrendingUp, Star, Lightbulb, BarChart3, ShoppingBag,
  Users, Clock, ChevronDown, ChevronUp, Zap, MessageSquare,
  Target, Coffee
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Insight {
  icon: string;
  title: string;
  insight: string;
}

const QUICK_PROMPTS = [
  { icon: "📊", label: "حلل مبيعات اليوم", prompt: "حلل مبيعات اليوم وأعطني ملاحظات وتوصيات" },
  { icon: "⭐", label: "أفضل المنتجات", prompt: "ما هي أكثر المنتجات مبيعاً هذا الأسبوع وما توصيتك بشأنها؟" },
  { icon: "💡", label: "اقتراح عروض", prompt: "اقترح عروضاً ترويجية مناسبة للأسبوع القادم بناءً على بيانات المبيعات" },
  { icon: "📈", label: "تحسين الأرباح", prompt: "كيف يمكنني تحسين أرباح الكافيه؟ أعطني خطة عملية" },
  { icon: "🕐", label: "أوقات الذروة", prompt: "ما هي أوقات الذروة وكيف أستثمرها بشكل أفضل؟" },
  { icon: "👥", label: "إدارة الموظفين", prompt: "أعطني نصائح لتحسين إنتاجية الموظفين في الكافيه" },
  { icon: "🍵", label: "منتجات جديدة", prompt: "اقترح منتجات جديدة أو موسمية يمكن إضافتها للمنيو" },
  { icon: "📉", label: "تقليل التكاليف", prompt: "كيف يمكنني تقليل تكاليف التشغيل دون التأثير على الجودة؟" },
];

function formatContent(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s(.+)$/gm, '<div class="font-bold text-[#2D9B6E] mt-2">$1</div>')
    .replace(/^[-•]\s(.+)$/gm, '<div class="flex gap-2 items-start mt-1"><span class="text-[#2D9B6E] mt-0.5">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

export default function ManagerAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showInsights, setShowInsights] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: insightsData, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ["/api/ai/insights"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await apiRequest("POST", "/api/ai/chat", { message, history });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "عذراً، لم أتمكن من الإجابة.",
        timestamp: new Date(),
      }]);
    },
    onError: (error: any) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ ${error?.message || "حدث خطأ في الاتصال بالذكاء الاصطناعي. تأكد من إضافة OPENAI_API_KEY في إعدادات النظام."}`,
        timestamp: new Date(),
      }]);
    },
  });

  const sendMessage = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || chatMutation.isPending) return;

    setMessages(prev => [...prev, {
      role: "user",
      content: msg,
      timestamp: new Date(),
    }]);
    setInput("");
    chatMutation.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  const insights: Insight[] = (insightsData as any)?.insights || [];
  const stats = (insightsData as any)?.stats;
  const hasApiKey = !(insightsData as any)?.error?.includes("OPENAI_API_KEY");

  return (
    <div className="min-h-screen bg-[#070707] text-white" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">مركز الذكاء الاصطناعي</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-[#555]">مدعوم بـ Gemini Flash 1.5</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-xs">
              <Sparkles className="w-3 h-3 ml-1" />
              AI
            </Badge>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-[#555] hover:text-white text-xs h-7">
                مسح المحادثة
              </Button>
            )}
          </div>
        </div>

        {/* No API Key Warning */}
        {!insightsLoading && (insightsData as any)?.error?.includes("OPENAI_API_KEY") && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-amber-400 font-medium text-sm">مفتاح API غير مضبوط</div>
                <div className="text-[#888] text-xs mt-1">
                  لتفعيل الذكاء الاصطناعي، أضف متغير البيئة <code className="bg-[#1a1a1a] px-1 rounded text-amber-300">OPENAI_API_KEY</code> بقيمة مفتاح OpenRouter الخاص بك من{" "}
                  <a href="https://openrouter.ai" target="_blank" className="text-amber-400 underline">openrouter.ai</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "مبيعات اليوم", value: `${(stats.todayRevenue || 0).toFixed(0)} ر.س`, icon: <TrendingUp className="w-4 h-4" />, color: "text-green-400" },
              { label: "طلبات اليوم", value: stats.todayOrders || 0, icon: <ShoppingBag className="w-4 h-4" />, color: "text-blue-400" },
              { label: "مبيعات الأسبوع", value: `${(stats.weekRevenue || 0).toFixed(0)} ر.س`, icon: <BarChart3 className="w-4 h-4" />, color: "text-violet-400" },
              { label: "نمو الأسبوع", value: stats.growthPct ? `${stats.growthPct}%` : "—", icon: <Target className="w-4 h-4" />, color: stats.growthPct > 0 ? "text-green-400" : "text-red-400" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-3 flex items-center gap-3">
                <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
                <div>
                  <div className={`font-bold text-sm ${stat.color}`}>{stat.value}</div>
                  <div className="text-[#555] text-[10px]">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Insights */}
        {(insightsLoading || insights.length > 0) && (
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowInsights(v => !v)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white">رؤى الذكاء الاصطناعي</span>
                <span className="text-[10px] text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full">محدث تلقائياً</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); refetchInsights(); }} className="text-[#444] hover:text-white transition-colors p-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                {showInsights ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
              </div>
            </button>

            {showInsights && (
              <div className="px-4 pb-4">
                {insightsLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    <span className="text-[#555] text-sm">يولد الذكاء الاصطناعي رؤى لكافيهك...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {insights.map((insight, i) => (
                      <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 flex items-start gap-3">
                        <span className="text-xl shrink-0">{insight.icon}</span>
                        <div>
                          <div className="text-white text-sm font-medium">{insight.title}</div>
                          <div className="text-[#888] text-xs mt-0.5 leading-relaxed">{insight.insight}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 400 }}>
          {/* Chat Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a]">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-white font-medium">محادثة مع المساعد</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600/20 to-purple-800/20 border border-violet-500/20 flex items-center justify-center mb-4">
                  <Coffee className="w-8 h-8 text-violet-400" />
                </div>
                <div className="text-white font-medium mb-1">أهلاً، كيف يمكنني مساعدتك؟</div>
                <div className="text-[#555] text-sm max-w-sm">
                  اسألني عن مبيعاتك، موظفيك، منيوك، أو اطلب مني تحليل أداء كافيهك
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-[#2D9B6E]/20 border border-[#2D9B6E]/30"
                      : "bg-violet-600/20 border border-violet-500/30"
                  }`}>
                    {msg.role === "user"
                      ? <User className="w-4 h-4 text-[#2D9B6E]" />
                      : <Bot className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#2D9B6E]/15 border border-[#2D9B6E]/20 text-white rounded-tl-sm"
                        : "bg-[#141414] border border-[#222] text-[#ccc] rounded-tr-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                      ) : msg.content}
                    </div>
                    <div className="text-[#444] text-[10px] mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <div className="bg-[#141414] border border-[#222] rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[#555] text-xs">يفكر...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 0 && (
            <div className="px-4 pb-3">
              <div className="text-[#444] text-xs mb-2">اختر سؤالاً سريعاً:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.prompt)}
                    disabled={chatMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl text-xs text-[#888] hover:text-white transition-all text-right"
                    data-testid={`quick-prompt-${i}`}
                  >
                    <span className="shrink-0">{p.icon}</span>
                    <span className="line-clamp-1">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-[#1a1a1a]">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اسألني أي شيء عن كافيهك... (Enter للإرسال)"
                  className="resize-none bg-[#111] border-[#222] text-white placeholder-[#444] focus:border-violet-500/50 rounded-xl text-sm min-h-[44px] max-h-[120px] pr-3"
                  rows={1}
                  disabled={chatMutation.isPending}
                  data-testid="input-ai-message"
                />
              </div>
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || chatMutation.isPending}
                className="h-11 w-11 p-0 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-30"
                data-testid="button-send-message"
              >
                {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <BarChart3 className="w-5 h-5" />,
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              title: "تحليل المبيعات",
              desc: "يقرأ الذكاء الاصطناعي بيانات مبيعاتك في الوقت الفعلي ويقدم تحليلاً دقيقاً"
            },
            {
              icon: <Star className="w-5 h-5" />,
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              title: "تحسين المنيو",
              desc: "اقتراحات ذكية لتطوير قائمة الطعام بناءً على الطلب والأداء"
            },
            {
              icon: <Users className="w-5 h-5" />,
              color: "text-green-400 bg-green-500/10 border-green-500/20",
              title: "إدارة الفريق",
              desc: "نصائح وتوصيات لتحسين إدارة موظفيك وجدولة الوردايات"
            },
          ].map((card, i) => (
            <div key={i} className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{card.title}</div>
                <div className="text-[#555] text-xs mt-1 leading-relaxed">{card.desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
