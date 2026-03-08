import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, ArrowLeft, User, ShieldAlert } from "lucide-react";
import { containsExternalContact, BLOCKED_MESSAGE_EN, BLOCKED_MESSAGE_AR } from "@/lib/chatFilter";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface MessageThreadProps {
  otherUserId: string;
  otherUserName: string;
  ideaId?: string;
  onBack: () => void;
}

export default function MessageThread({ otherUserId, otherUserName, ideaId, onBack }: MessageThreadProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) || []);
      setLoading(false);

      // Mark as read
      await supabase.from("messages").update({ read: true })
        .eq("sender_id", otherUserId).eq("receiver_id", user.id).eq("read", false);
    };
    load();

    // Realtime subscription
    const channel = supabase.channel(`msgs-${user.id}-${otherUserId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id === otherUserId) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      idea_id: ideaId || null,
      content: input.trim(),
    });
    setSending(false);
    if (error) {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    } else {
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium text-foreground">{otherUserName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">{t.dashboard.noMessages}</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender_id === user?.id
                  ? "gradient-primary text-primary-foreground rounded-ee-md"
                  : "bg-muted text-foreground rounded-es-md"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className="text-[10px] opacity-60 mt-1 block">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50 flex gap-2 items-end">
        <Textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={t.chat.placeholder}
          className="min-h-[44px] max-h-24 resize-none bg-transparent border-0 focus-visible:ring-0 text-sm"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon"
          className="gradient-primary border-0 text-primary-foreground shrink-0 h-10 w-10">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
