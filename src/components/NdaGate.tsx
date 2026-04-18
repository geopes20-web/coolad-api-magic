/**
 * NdaGate
 * Forces the user to accept an NDA before they can chat with another user
 * about a specific idea. NDA is created/signed per (idea_id, investor_id, founder_id).
 *
 * Flow:
 * 1. If no idea_id → skip (NDA only required when idea-specific).
 * 2. Look up nda_agreements for this trio.
 * 3. If current user already signed → render children.
 * 4. Else show consent dialog. On accept → upsert + sign.
 */
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ScrollText, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NdaGateProps {
  ideaId?: string;
  otherUserId: string;
  children: ReactNode;
}

export default function NdaGate({ ideaId, otherUserId, children }: NdaGateProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (!user || !ideaId) { setSigned(true); setLoading(false); return; }
    (async () => {
      // Fetch idea to know the founder
      const { data: idea } = await supabase
        .from("ideas").select("founder_id").eq("id", ideaId).maybeSingle();
      if (!idea) { setSigned(true); setLoading(false); return; }

      const founderId = idea.founder_id;
      const investorId = user.id === founderId ? otherUserId : user.id;

      const { data: nda } = await supabase
        .from("nda_agreements")
        .select("*")
        .eq("idea_id", ideaId)
        .eq("founder_id", founderId)
        .eq("investor_id", investorId)
        .maybeSingle();

      const meSigned = user.id === founderId
        ? !!nda?.founder_signed_at
        : !!nda?.investor_signed_at;
      setSigned(meSigned);
      setLoading(false);
    })();
  }, [user, ideaId, otherUserId]);

  const handleAccept = async () => {
    if (!agree || !user || !ideaId) return;
    setAccepting(true);

    const { data: idea } = await supabase
      .from("ideas").select("founder_id, title").eq("id", ideaId).maybeSingle();
    if (!idea) { setAccepting(false); return; }

    const founderId = idea.founder_id;
    const investorId = user.id === founderId ? otherUserId : user.id;
    const isFounder = user.id === founderId;
    const now = new Date().toISOString();
    const signature = user.email || user.id;

    // Try update existing first
    const { data: existing } = await supabase
      .from("nda_agreements").select("id")
      .eq("idea_id", ideaId).eq("founder_id", founderId).eq("investor_id", investorId)
      .maybeSingle();

    if (existing) {
      const patch = isFounder
        ? { founder_signed_at: now, founder_signature: signature }
        : { investor_signed_at: now, investor_signature: signature };
      await supabase.from("nda_agreements").update(patch).eq("id", existing.id);
    } else {
      const ndaContent = `Mutual NDA for idea "${idea.title}" between founder and investor on IDEVEST platform.`;
      const insert: any = {
        idea_id: ideaId, founder_id: founderId, investor_id: investorId,
        nda_content: ndaContent,
      };
      if (isFounder) { insert.founder_signed_at = now; insert.founder_signature = signature; }
      else { insert.investor_signed_at = now; insert.investor_signature = signature; }
      await supabase.from("nda_agreements").insert(insert);
    }

    setAccepting(false);
    setSigned(true);
    toast({ title: isAr ? "تم التوقيع" : "NDA Signed", description: isAr ? "يمكنك الآن بدء الدردشة" : "You can now start chatting." });
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (signed) return <>{children}</>;

  return (
    <div className="p-6 h-full flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-3">
            <ScrollText className="w-6 h-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {isAr ? "اتفاقية عدم الإفصاح (NDA)" : "Non-Disclosure Agreement"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? "مطلوبة قبل بدء أي مناقشة بشأن الفكرة" : "Required before discussing any idea details"}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 max-h-48 overflow-y-auto text-xs text-muted-foreground leading-relaxed mb-4">
          {isAr
            ? "أتعهد بالحفاظ على سرية كافة المعلومات المتعلقة بالفكرة المطروحة، وعدم الإفصاح عنها أو استخدامها لأي غرض خارج إطار النقاش الرسمي على منصة IDEVEST. يعتبر التوقيع الرقمي ملزماً قانونياً."
            : "I agree to keep all information related to the discussed idea strictly confidential, and not to disclose or use it for any purpose outside formal discussions on the IDEVEST platform. Digital signature is legally binding."}
        </div>

        <label className="flex items-center gap-2 mb-4 text-sm text-foreground cursor-pointer">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
          {isAr ? "أقر وأوافق على الشروط أعلاه" : "I have read and agree to the above"}
        </label>

        <Button
          className="w-full gradient-primary border-0 text-primary-foreground"
          disabled={!agree || accepting}
          onClick={handleAccept}
        >
          {accepting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <ShieldCheck className="h-4 w-4 me-2" />}
          {isAr ? "توقيع الاتفاقية والمتابعة" : "Sign NDA and Continue"}
        </Button>
      </div>
    </div>
  );
}
