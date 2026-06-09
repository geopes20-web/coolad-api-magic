import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, ArrowLeft, User, Handshake, FileSignature, CreditCard, CheckCircle2, XCircle } from "lucide-react";
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
  
  const [treasuryAuditedFee, setTreasuryAuditedFee] = useState<number>(0);

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
      
      if (deal) {
        setActiveDeal(deal);
        setTreasuryAuditedFee(Number(deal.investment_amount_usd) * 0.10);
      } else {
        setActiveDeal(null);
      }
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
    
    if (deal) {
      setActiveDeal(deal);
      setTreasuryAuditedFee(Number(deal.investment_amount_usd) * 0.10);
    } else {
      setActiveDeal(null);
    }
  };

  const handlePropose = async () => {
    if (!user || !ideaId) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast({ title: isAr ? "أدخل المبلغ" : "Enter amount", variant: "destructive" }); return; }
    setProposing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setProposing(false);
      toast({ title: isAr ? "يجب تسجيل الدخول أولاً" : "Please sign in first", variant: "destructive" });
      return;
    }
    const { data: idea } = await supabase.from("ideas").select("founder_id, title").eq("id", ideaId).maybeSingle();
    if (!idea) { setProposing(false); return; }
    const founderId = idea.founder_id;
    const investorId = founderId === session.user.id ? otherUserId : session.user.id;
    const { error } = await supabase.from("deals").insert({
      idea_id: ideaId, founder_id: founderId, investor_id: investorId,
      investment_amount_usd: amt,
      equity_percentage: equity ? Number(equity) : null,
      valuation_usd: valuation ? Number(valuation) : null,
      contract_terms: terms || `Investment of $${amt} in "${idea.title}"`,
      status: "draft" as any,
      founder_signed_at: null,
      investor_signed_at: null,
      payment_status: "pending",
    } as any);
    setProposing(false);
    if (error) {
      const msg = (error as any)?.message || "Unknown error";
      console.error("Deal insert error:", error);
      toast({
        title: isAr ? "خطأ في إنشاء العرض" : "Error creating proposal",
        description: msg,
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
        amount_usd: Number(activeDeal.investment_amount_usd),
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
    const url = (data as any)?.iframe_url || (data as any)?.iframeUrl;
    const dealId = (data as any)?.deal_id || activeDeal.id;
    if (url && dealId) {
      window.location.href = `/payment/${dealId}?iframe=${encodeURIComponent(url)}`;
    } else {
      toast({ title: isAr ? "تم إنشاء الصفقة" : "Deal created", description: isAr ? "بوابة الدفع غير مهيأة بالكامل" : "Payment iframe not configured" });
    }
    await refreshDeal();
  };

  const handleCancelDeal = async () => {
    if (!activeDeal) return;
    if (activeDeal.payment_status === "paid") return;
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
      let q = supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`);
      if (ideaId) q = q.eq("idea_id", ideaId); else q = q.is("idea_id", null);
      const { data } = await q.order("created_at", { ascending: true });
      setMessages((data as Message[]) || []);
      setLoading(false);

      await supabase.from("messages").update({ read: true })
        .eq("sender_id", otherUserId).eq("receiver_id", user.id).eq("read", false);
    };
    load();

    const channel = supabase.channel(`msgs-${user.id}-${otherUserId}-${ideaId || "none"}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const msg = payload.new as Message;
        const partyMatch = (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id);
        const ideaMatch = ideaId ? (msg as any).idea_id === ideaId : !(msg as any).idea_id;
        if (partyMatch && ideaMatch) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id === otherUserId) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId, ideaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;

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
    <div className="flex flex-col h-full bg-[#0B1528]">
      {/* Header النظيف الأصلي بدون أي حشو أو لمسات زائدة */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-800/80">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
          <User className="h-4 w-4 text-zinc-400" />
        </div>
        <span className="font-medium text-white flex-1">{otherUserName}</span>
        {ideaId && !activeDeal && (
          <Button size="sm" variant="outline" onClick={() => setProposeOpen(true)} className="border-zinc-700 text-zinc-200">
            <Handshake className="h-4 w-4 me-1" />{isAr ? "اقتراح صفقة" : "Propose Deal"}
          </Button>
        )}
      </div>

      {/* حزام الـ Deal والـ Treasury المطابق تماماً لصورة الـ Layout الفاخر والأصلي */}
      {activeDeal && (
        <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col gap-2">
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400">
            <div>
              <span className="text-zinc-500 block text-[10px] font-sans font-bold uppercase mb-0.5">VERIFIED TREASURY SUMMARY</span>
              <strong className="text-white">${treasuryAuditedFee.toLocaleString()}</strong> <span className="text-[10px] text-zinc-500">(Platform 10% Fee Audited)</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px] font-sans font-bold uppercase mb-0.5">TOTAL ESCROW POOL</span>
              <strong className="text-emerald-500">${Number(activeDeal.investment_amount_usd).toLocaleString()}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs font-mono text-zinc-400">
              Founder-Investor: {activeDeal.investor_signed_at ? " Signed" : "Pending"} &bull; Status: <span className="font-bold uppercase text-emerald-500">{activeDeal.status}</span> &bull; {activeDeal.payment_status === "paid" ? " Paid" : activeDeal.payment_status}
            </div>
            <div className="flex gap-2">
              {(() => {
                const st = activeDeal.status;
                const editable = st == null || st === "draft" || st === "pending_founder" || st === "pending_investor" || st === "negotiating";
                const bothSigned = !!activeDeal.founder_signed_at && !!activeDeal.investor_signed_at;
                const needsMySig = (isFounder && !activeDeal.founder_signed_at) || (!isFounder && !activeDeal.investor_signed_at);
                const showSign = editable && needsMySig && !bothSigned && activeDeal.status !== "cancelled" && activeDeal.payment_status !== "paid";
                const showPay = bothSigned && activeDeal.payment_status !== "paid" && activeDeal.status !== "cancelled" && !isFounder;
                const showCancel = !bothSigned && activeDeal.payment_status !== "paid" && activeDeal.status !== "cancelled" && editable;
                
                const isPaidSuccess = activeDeal.payment_status === "paid";

                return (
                  <>
                    {showSign && (
                      <Button size="sm" onClick={handleSign} disabled={signing} className="gradient-primary border-0 text-white font-semibold">
                        <FileSignature className="h-3.5 w-3.5 me-1" /> {isAr ? "توقيع" : "Sign"}
                      </Button>
                    )}
                    {showPay && (
                      <Button size="sm" onClick={handlePay} disabled={paying} className="gradient-primary border-0 text-white font-semibold">
                        <CreditCard className="h-3.5 w-3.5 me-1" /> {isAr ? "ادفع الآن" : "Pay now"}
                      </Button>
                    )}
                    {/* ✅ التوجيه الصريح والمثالي الموحد لكلا الطرفين لفتح صفحة مراجعة وثيقة وملف العقد النهائي الموثق بنجاح */}
                    {isPaidSuccess && (
                      <Button size="sm" onClick={() => { window.location.href = `/contract/${activeDeal.id}`; }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl animate-fade-in">
                        <FileSignature className="h-3.5 w-3.5 me-1" /> {isAr ? "تسجيل العقد" : "Sign Contract Blueprint"}
                      </Button>
                    )}
                    {showCancel && (
                      <Button size="sm" variant="outline" onClick={handleCancelDeal} disabled={cancelling} className="text-destructive border-zinc-800">
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Messages List - لون الخلفية القديم العادي النظيف */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B1528]">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-zinc-500 py-10">{t.dashboard.noMessages}</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender_id === user?.id
                  ? "bg-emerald-500 text-white rounded-ee-md"
                  : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-es-md"
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

      {/* Input Form layout */}
      <div className="p-3 border-t border-zinc-800/80 flex gap-2 items-end bg-[#0B1528]">
        <Textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={t.chat.placeholder}
          className="min-h-[44px] max-h-24 resize-none bg-zinc-900/60 border-zinc-800 focus-visible:ring-0 text-sm text-white rounded-xl"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon"
          className="gradient-primary border-0 text-white shrink-0 h-10 w-10 rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Propose Deal dialog */}
      <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{isAr ? "اقتراح صفقة استثمار" : "Propose Investment Deal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400">{isAr ? "المبلغ (USD)" : "Amount (USD)"} *</label>
              <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000" className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400">{isAr ? "الحصة %" : "Equity %"}</label>
                <Input type="number" step="0.1" value={equity} onChange={e => setEquity(e.target.value)} placeholder="10" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">{isAr ? "التقييم (USD)" : "Valuation (USD)"}</label>
                <Input type="number" value={valuation} onChange={e => setValuation(e.target.value)} placeholder="100000" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400">{isAr ? "ملاحظات / شروط إضافية" : "Notes / extra terms"}</label>
              <Textarea rows={3} value={terms} onChange={e => setTerms(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeOpen(false)} className="border-zinc-800 text-zinc-300">Cancel</Button>
            <Button onClick={handlePropose} disabled={proposing} className="gradient-primary border-0 text-white">
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}