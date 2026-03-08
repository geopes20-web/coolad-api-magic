const EVALUATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-project`;

export interface ProjectData {
  name: string;
  description: string;
  sector: string;
  location: string;
  capital: string;
  expectedRevenue: string;
  teamSize: string;
  teamExperience: string;
  competitors: string;
  competitiveAdvantage: string;
  targetAudience: string;
  timeline: string;
  additionalInfo?: string;
}

export async function streamEvaluation({
  projectData,
  onDelta,
  onDone,
  onError,
}: {
  projectData: ProjectData;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const resp = await fetch(EVALUATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ projectData }),
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) {
      onError("تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً.");
      return;
    }
    if (resp.status === 402) {
      onError("يرجى إضافة رصيد للحساب.");
      return;
    }
    onError("فشل في بدء التقييم");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
