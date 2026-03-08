import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { streamChat, type ChatMessage } from "@/lib/chatStream";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, Sparkles, Trash2, LogIn, ArrowRight, Bot, User } from "lucide-react";
import { Link } from "react-router-dom";

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-primary mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-primary mt-5 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ms-4 mb-0.5">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ms-4 mb-0.5"><span class="text-primary font-semibold">$1.</span> $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function AiChat() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    if (!user) { setLoadingHistory(false); return; }
    supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data.map(d => ({ role: d.role as "user" | "assistant", content: d.content })));
        setLoadingHistory(false);
      });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 shadow-glass text-center max-w-md">
        <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t.submit.loginRequired}</h2>
        <Link to="/login"><Button className="gradient-primary border-0 text-primary-foreground mt-4">{t.auth.signIn}<ArrowRight className="h-4 w-4 ms-2" /></Button></Link>
      </div>
    </div>
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Save user message
    await supabase.from("chat_history").insert({ user_id: user.id, role: "user", content: text });

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    let fullResponse = "";
    try {
      await streamChat({
        messages: newMessages,
        onDelta: (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullResponse };
            return updated;
          });
        },
        onDone: async () => {
          setStreaming(false);
          await supabase.from("chat_history").insert({ user_id: user.id, role: "assistant", content: fullResponse });
        },
        onError: (err) => {
          toast({ title: t.common.error, description: err, variant: "destructive" });
          setStreaming(false);
          setMessages(prev => prev.slice(0, -1)); // Remove empty assistant msg
        },
      });
    } catch {
      toast({ title: t.common.error, description: "Connection failed", variant: "destructive" });
      setStreaming(false);
    }
  };

  const clearChat = async () => {
    await supabase.from("chat_history").delete().eq("user_id", user.id);
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.nav.chat}</h1>
            <p className="text-xs text-muted-foreground">{t.chat.subtitle}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
            <Trash2 className="h-4 w-4 me-1" />{t.chat.clear}
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl glass shadow-glass p-4 space-y-4 mb-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.chat.empty}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-md">
              {[t.chat.suggestion1, t.chat.suggestion2, t.chat.suggestion3, t.chat.suggestion4].map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  className="text-start text-sm p-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-secondary/50" : "gradient-primary"}`}>
                {msg.role === "user" ? <User className="h-4 w-4 text-secondary-foreground" /> : <Bot className="h-4 w-4 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {streaming && (
          <div className="flex items-center gap-2 text-primary text-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{t.chat.thinking}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass rounded-2xl shadow-glass p-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chat.placeholder}
          className="min-h-[44px] max-h-32 resize-none bg-transparent border-0 focus-visible:ring-0 text-sm"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!input.trim() || streaming} size="icon"
          className="gradient-primary border-0 text-primary-foreground shrink-0 h-10 w-10">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
