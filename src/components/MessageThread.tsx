import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, ArrowLeft, User, ShieldAlert, Handshake, FileSignature, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { analyzeMessage, BLOCKED_MESSAGE_EN, BLOCKED_MESSAGE_AR } from "@/lib/chatFilter";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

  // Deal proposal state
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [equity, setEquity] = useState("");
  const [valuation, setValuation] = useState("");
  const [terms, setTerms] = useState("");
  const [proposing, setProposing] = useState(false);
  const [signing, setSigning] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isAr = typeof document !== "undefined" && document.documentElement.lang === "ar";

  // Load most recent deal between these two parties for this idea
  useEffect(() => {
    if (!user || !ideaId) return;
    (async () => {
      const { data: idea } = await supabase.from("ideas").select("founder_id").eq("id", ideaId).maybeSingle();
      if (!idea) return;
      const founderIsMe = idea.founder_id === user.id;
      setIsFounder(founderIsMe);
      const founderId = idea.founder_id;
      const investorId = founderIsMe ? otherUserId : user.id;
      const { data: deal } = await supabase.from("deals").select("*")
        .eq("idea_id", ideaId).eq("founder_id", founderId).eq("investor_id", investorId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      setActiveDeal(deal || null);
    })();
  }, [user, ideaId, otherUserId]);

  const refreshDeal = async () => {
    if (!user || !ideaId) return;
    const { data: idea } = await supabase.from("ideas").select("founder_id").eq("id", ideaId).maybeSingle();
    if (!idea) return;
    const founderId = idea.founder_id;
    const investorId = idea.founder_id === user.id ? otherUserId : user.id;
    const { data: deal } = await supabase.from("deals").select("*")
      .eq("idea_id", ideaId).eq("founder_id", founderId).eq("investor_id", investorId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    setActiveDeal(deal || null);
  };

  const handlePropose = async () => {
    if (!user || !ideaId) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast({ title: isAr ? "أدخل المبلغ" : "Enter amount", variant: "destructive" }); return; }
    setProposing(true);
    const { data: idea } = await supabase.from("ideas").select("founder_id, title").eq("id", ideaId).maybeSingle();
    if (!idea) { setProposing(false); return; }
    const founderId = idea.founder_id;
    const investorId = founderId === user.id ? otherUserId : user.id;
    const { error } = await supabase.from("deals").insert({
      idea_id: ideaId, founder_id: founderId, investor_id: investorId,
      investment_amount_usd: amt,
      equity_percentage: equity ? Number(equity) : null,
      valuation_usd: valuation ? Number(valuation) : null,
      contract_terms: terms || `Investment of $${amt} in "${idea.title}"`,
      status: "pending" as any,
      payment_status: "pending",
    } as any);
    setProposing(false);
    if (error) {
      const msg = (error as any)?.message || "";
      const code = (error as any)?.code || "";
      const isRls = code === "42501" || /permission|rls|forbidden|policy/i.test(msg);
      toast({
        title: isRls ? (isAr ? "صلاحيات غير كافية" : "Permission denied") : "Error",
        description: isRls
          ? (isAr
              ? "فشلت العملية بسبب الصلاحيات، يرجى تسجيل الخروج وإعادة الدخول لتحديث جلسة العمل."
              : "Action blocked by permissions. Please sign out and sign in again to refresh your session.")
          : msg,
        variant: "destructive",
      });
      return;
    }
    setProposeOpen(false);
    setAmount(""); setEquity(""); setValuation(""); setTerms("");
    toast({ title: isAr ? "تم إرسال العرض" : "Proposal sent", description: isAr ? "بانتظار توقيع الطرف الآخر" : "Awaiting the other party's signature" });
    await refreshDeal();
  };

  const handleSign = async () => {
    if (!user || !activeDeal) return;
    setSigning(true);
    const patch: any = isFounder
      ? { founder_signed_at: new Date().toISOString() }
      : { investor_signed_at: new Date().toISOString() };
    const bothSigned = isFounder ? !!activeDeal.investor_signed_at : !!activeDeal.founder_signed_at;
    if (bothSigned) patch.status = "signed";
    const { error } = await supabase.from("deals").update(patch).eq("id", activeDeal.id);
    setSigning(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: isAr ? "تم التوقيع" : "Signed", description: bothSigned ? (isAr ? "العقد جاهز للدفع" : "Contract ready for payment") : (isAr ? "بانتظار الطرف الآخر" : "Awaiting counter-party") });
    await refreshDeal();
  };

  const handlePay = async () => {
    if (!activeDeal || !ideaId) return;
    setPaying(true);
    const { data, error } = await supabase.functions.invoke("paymob-initiate", {
      body: {
        idea_id: ideaId,
        amount_usd: activeDeal.investment_amount_usd,
        equity_percentage: activeDeal.equity_percentage,
        valuation_usd: activeDeal.valuation_usd,
        contract_terms: activeDeal.contract_terms,
      },
    });
    setPaying(false);
    if (error || (data as any)?.error) {
      toast({ title: "Payment error", description: (data as any)?.error || error?.message || "Failed", variant: "destructive" });
      return;
    }
    const url = (data as any)?.iframe_url;
    const dealId = (data as any)?.deal_id;
    if (url && dealId) {
      // Navigate within our app to a route that hosts the Paymob iframe — avoids
      // cross-origin/blob issues from popping the raw Paymob URL in a new tab.
      window.location.href = `/payment/${dealId}?iframe=${encodeURIComponent(url)}`;
    } else {
      toast({ title: isAr ? "تم إنشاء الصفقة" : "Deal created", description: isAr ? "بوابة الدفع غير مهيأة بالكامل" : "Payment iframe not configured" });
    }
    await refreshDeal();
  };

  const handleCancelDeal = async () => {
    if (!activeDeal) return;
    if (activeDeal.payment_status === "paid") return;
    // Once both parties signed, payment flow is locked — no cancel/edit.
    if (activeDeal.founder_signed_at && activeDeal.investor_signed_at) {
      toast({ title: isAr ? "غير مسموح" : "Not allowed", description: isAr ? "تم توقيع العقد من الطرفين، لا يمكن الإلغاء." : "Both parties signed — cancellation is locked.", variant: "destructive" });
      return;
    }
    if (!confirm(isAr ? "هل أنت متأكد من إلغاء الصفقة؟" : "Cancel this deal?")) return;
    setCancelling(true);
    const { error } = await supabase.from("deals").update({ status: "cancelled" as any, payment_status: "cancelled" }).eq("id", activeDeal.id);
    setCancelling(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: isAr ? "تم إلغاء الصفقة" : "Deal cancelled" });
    setActiveDeal(null);
  };

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

    // Layer 1: Client-side filter (instant feedback)
    const analysis = analyzeMessage(input);
    if (analysis.blocked) {
      toast({
        title: "⚠️",
        description: document.documentElement.lang === "ar" ? BLOCKED_MESSAGE_AR : BLOCKED_MESSAGE_EN,
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    // Layer 2: Server-side filter via edge function (authoritative)
    const { data, error } = await supabase.functions.invoke("send-message", {
      body: { receiver_id: otherUserId, content: input.trim(), idea_id: ideaId || null },
    });
    setSending(false);

    const errCode = (data as any)?.error;
    if (error || errCode === "blocked" || errCode === "blocked_user") {
      const isBlockedMsg = errCode === "blocked";
      const isBlockedUser = errCode === "blocked_user";
      toast({
        title: (isBlockedMsg || isBlockedUser) ? "⚠️" : t.common.error,
        description: isBlockedUser
          ? (isAr ? "تم حظر حسابك ولا يمكنك إرسال الرسائل." : "Your account is blocked and cannot send messages.")
          : isBlockedMsg
            ? (isAr ? BLOCKED_MESSAGE_AR : BLOCKED_MESSAGE_EN)
            : (error?.message || "Failed to send"),
        variant: "destructive",
      });
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
        <span className="font-medium text-foreground flex-1">{otherUserName}</span>
        {ideaId && !activeDeal && (
          <Button size="sm" variant="outline" onClick={() => setProposeOpen(true)}>
            <Handshake className="h-4 w-4 me-1" />{isAr ? "اقتراح صفقة" : "Propose Deal"}
          </Button>
        )}
      </div>

      {/* Active deal banner */}
      {activeDeal && (
        <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs">
              <div className="font-semibold text-foreground">
                💼 ${Number(activeDeal.investment_amount_usd).toLocaleString()}
                {activeDeal.equity_percentage ? ` · ${activeDeal.equity_percentage}% equity` : ""}
              </div>
              <div className="text-muted-foreground mt-0.5">
                {isAr ? "المؤسس: " : "Founder: "}
                {activeDeal.founder_signed_at ? <CheckCircle2 className="h-3 w-3 inline text-primary" /> : "—"}
                {" · "}
                {isAr ? "المستثمر: " : "Investor: "}
                {activeDeal.investor_signed_at ? <CheckCircle2 className="h-3 w-3 inline text-primary" /> : "—"}
                {" · "}
                {activeDeal.payment_status === "paid" ? "✅ Paid" : activeDeal.payment_status}
              </div>
            </div>
            <div className="flex gap-2">
              {((isFounder && !activeDeal.founder_signed_at) || (!isFounder && !activeDeal.investor_signed_at)) && (
                <Button size="sm" onClick={handleSign} disabled={signing} className="gradient-primary border-0 text-primary-foreground">
                  {signing ? <Loader2 className="h-3 w-3 animate-spin me-1" /> : <FileSignature className="h-3 w-3 me-1" />}
                  {isAr ? "توقيع" : "Sign"}
                </Button>
              )}
              {activeDeal.founder_signed_at && activeDeal.investor_signed_at && activeDeal.payment_status !== "paid" && !isFounder && (
                <Button size="sm" onClick={handlePay} disabled={paying} className="gradient-primary border-0 text-primary-foreground">
                  {paying ? <Loader2 className="h-3 w-3 animate-spin me-1" /> : <CreditCard className="h-3 w-3 me-1" />}
                  {isAr ? "ادفع الآن" : "Pay now"}
                </Button>
              )}
              {activeDeal.payment_status !== "paid" && activeDeal.status !== "cancelled" && (
                <Button size="sm" variant="outline" onClick={handleCancelDeal} disabled={cancelling} className="text-destructive">
                  {cancelling ? <Loader2 className="h-3 w-3 animate-spin me-1" /> : <XCircle className="h-3 w-3 me-1" />}
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Propose Deal dialog */}
      <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "اقتراح صفقة استثمار" : "Propose Investment Deal"}</DialogTitle>
            <DialogDescription>
              {isAr
                ? "حدد شروط الاستثمار. يجب توقيع الطرفين قبل تفعيل الدفع عبر Paymob (وضع الاختبار)."
                : "Set the investment terms. Both parties must sign before Paymob (test mode) payment is enabled."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">{isAr ? "المبلغ (USD)" : "Amount (USD)"} *</label>
              <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">{isAr ? "الحصة %" : "Equity %"}</label>
                <Input type="number" step="0.1" value={equity} onChange={e => setEquity(e.target.value)} placeholder="10" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{isAr ? "التقييم (USD)" : "Valuation (USD)"}</label>
                <Input type="number" value={valuation} onChange={e => setValuation(e.target.value)} placeholder="100000" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{isAr ? "ملاحظات / شروط إضافية" : "Notes / extra terms"}</label>
              <Textarea rows={3} value={terms} onChange={e => setTerms(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handlePropose} disabled={proposing} className="gradient-primary border-0 text-primary-foreground">
              {proposing ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Handshake className="h-4 w-4 me-1" />}
              {isAr ? "إرسال العرض" : "Send Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
