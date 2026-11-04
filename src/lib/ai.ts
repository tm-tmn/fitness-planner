/**
 * ตัวช่วยเรียก AI ฝั่งเซิร์ฟเวอร์ (ใช้ร่วมกันระหว่าง /api/estimate และ /api/coach)
 * ตั้ง GEMINI_API_KEY (ฟรี) หรือ ANTHROPIC_API_KEY อย่างใดอย่างหนึ่ง ถ้ามีทั้งคู่ใช้ Gemini
 */

export type AiPart = { text: string } | { image: { mime: string; data: string } };

export function aiConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export function isTimeout(e: unknown): boolean {
  return e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
}

interface GenerateOptions {
  system: string;
  parts: AiPart[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_ESTIMATE_TIMEOUT_MS) || 12000;

/** เรียกโมเดลแล้วคืนข้อความดิบ (ขอให้ตอบเป็น JSON) หรือโยน error */
export async function aiGenerate(opts: GenerateOptions): Promise<string> {
  const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const base = process.env.AI_ESTIMATE_BASE_URL || "https://generativelanguage.googleapis.com";
    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [
          {
            role: "user",
            parts: opts.parts.map((p) =>
              "text" in p ? { text: p.text } : { inlineData: { mimeType: p.image.mime, data: p.image.data } }
            ),
          },
        ],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 500,
          temperature: opts.temperature ?? 0.2,
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  }

  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) throw new Error("ai_not_configured");
  const base = process.env.AI_ESTIMATE_BASE_URL || "https://api.anthropic.com";
  const res = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: opts.maxTokens ?? 300,
      temperature: opts.temperature ?? 0.2,
      system: opts.system,
      messages: [
        {
          role: "user",
          content: opts.parts.map((p) =>
            "text" in p
              ? { type: "text", text: p.text }
              : { type: "image", source: { type: "base64", media_type: p.image.mime, data: p.image.data } }
          ),
        },
      ],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((c) => c.type === "text")?.text ?? "";
}

/** ดึงออบเจ็กต์ JSON ก้อนแรกจากข้อความของโมเดล */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// จำกัดจำนวนครั้งต่อผู้ใช้ — เก็บในหน่วยความจำของ instance นั้น จึงเป็นแค่เบรกกันใช้รัวๆ ไม่ใช่โควตาตายตัว
const hits = new Map<string, number[]>();

/** คืน true ถ้ายังเรียกได้ (และนับครั้งนี้ให้) */
export function rateLimitOk(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 2000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}
