import type { AiReview, ScanResult } from "./types";

export const KEY_STORAGE = "lb:anthropic-key";
export const MODEL = "claude-opus-5-5";

export const getKey = (): string => { try { return localStorage.getItem(KEY_STORAGE) ?? ""; } catch { return ""; } };
export const setKey = (k: string) => { try { k ? localStorage.setItem(KEY_STORAGE, k) : localStorage.removeItem(KEY_STORAGE); } catch { /* storage blocked */ } };

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    features: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, rating: { type: "number" }, comment: { type: "string" } }, required: ["name", "rating", "comment"], additionalProperties: false },
    },
    grooming: {
      type: "object",
      properties: { hairstyle: { type: "string" }, facialHair: { type: "string" }, eyewear: { type: "string" }, skincare: { type: "string" }, style: { type: "string" } },
      required: ["hairstyle", "facialHair", "eyewear", "skincare", "style"], additionalProperties: false,
    },
    body: { type: "string" },
    caveats: { type: "string" },
  },
  required: ["summary", "strengths", "improvements", "features", "grooming", "body", "caveats"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are an honest, kind aesthetics coach reviewing the user's OWN photos at their request. The user is an adult who wants specific, usable feedback, not flattery and not cruelty.

Rules:
- Rate each feature you can actually see on a 1-10 scale where 5 is average for adults, 7 is clearly good and 9+ is rare. Be calibrated and consistent. Never give everything the same number.
- Cover, where visible: overall face, eyes, brows, nose, lips, jawline, chin, cheekbones, forehead, skin, hair and hairline, teeth (if visible), neck, posture, and physique (if a body photo is present).
- You see soft tissue in a photograph. You cannot see bone, so describe bone structure only as "what the outline suggests" and say that it is an inference.
- Use the measured numbers supplied as ground truth for geometry and do not contradict them. Add what the measurements cannot capture: styling, grooming, expression, lighting, colour and harmony.
- Every critique must come with a practical fix: grooming, haircut, facial hair, glasses, skincare, posture, training, or body-fat change. Say plainly when something is structural and not something to chase.
- Do not guess at ethnicity, health conditions, age or identity. Do not compare the person to celebrities. Do not diagnose.
- Be concise: one or two sentences per feature comment.`;

export async function reviewWithClaude(opts: { apiKey: string; images: { label: string; dataUrl: string }[]; result: ScanResult }): Promise<AiReview> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });

  const content: Array<{ type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }> = [];
  for (const im of opts.images) {
    content.push({ type: "text", text: `Photo: ${im.label}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: im.dataUrl.replace(/^data:image\/jpeg;base64,/, "") } });
  }
  const r = opts.result;
  const lines = (r.features ?? []).map((f) => `- ${f.label}: ${f.value} (reference ${f.ref}; score ${f.score ?? "descriptive"})`);
  content.push({
    type: "text",
    text: `Reference set: ${r.sex ?? "unspecified"}. Self-rated: submental fullness ${r.self.submentalFullness}/5, hairline Norwood ${r.self.norwood}, hair ${r.self.hairCondition}/5, brows ${r.self.brows}/5, facial hair ${r.self.facialHair}/5, teeth ${r.self.teeth}/5.\n\nMeasured by the app:\n${lines.join("\n") || "(no measurements)"}\n\nGive your full review as JSON matching the schema.`,
  });

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
      messages: [{ role: "user", content }],
    } as never);
    const msg = res as unknown as { stop_reason: string; content: { type: string; text?: string }[] };
    if (msg.stop_reason === "refusal") throw new Error("The model declined to review these photos.");
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    if (!text) throw new Error("The model returned no text.");
    const j = JSON.parse(text) as Omit<AiReview, "model" | "ts">;
    j.features = (j.features ?? []).map((f) => ({ ...f, rating: Math.min(10, Math.max(1, Math.round(f.rating * 10) / 10)) }));
    return { ...j, model: MODEL, ts: Date.now() };
  } catch (e) {
    const A = Anthropic as unknown as Record<string, new (...a: never[]) => Error>;
    if (e instanceof A.AuthenticationError) throw new Error("That API key was rejected. Check it and try again.");
    if (e instanceof A.PermissionDeniedError) throw new Error("This key is not allowed to use that model.");
    if (e instanceof A.RateLimitError) throw new Error("Rate limited. Wait a minute and retry.");
    if (e instanceof A.BadRequestError) throw new Error(`The request was rejected: ${(e as Error).message}`);
    if (e instanceof A.APIConnectionError) throw new Error("Could not reach Anthropic. Check your connection.");
    throw e instanceof Error ? e : new Error("Unexpected error");
  }
}
