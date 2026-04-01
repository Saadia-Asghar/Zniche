import { Router, type IRouter, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

async function callClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJSON<T>(text: string, fallback: T): T {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) return fallback;
  try { return JSON.parse(match[0]) as T; } catch { return fallback; }
}

router.post("/suggest-skills", async (req: Request, res: Response) => {
  const { input, userType, countryName } = req.body;
  if (!input) { res.status(400).json({ error: "Missing input" }); return; }
  try {
    const text = await callClaude(
      `The user typed "${input}" as their skill. They are a ${userType || "professional"} from ${countryName || "the world"}.
Generate 4 specific, sellable skill descriptions (15-25 words each).
Make them outcome-focused and specific to their location/culture where relevant.
Return ONLY a JSON array: ["...", "...", "...", "..."]`
    );
    res.json({ suggestions: parseJSON<string[]>(text, []) });
  } catch (err) {
    req.log.error({ err }, "suggest-skills error");
    res.json({ suggestions: [] });
  }
});

router.post("/suggest-audiences", async (req: Request, res: Response) => {
  const { skillDescription, userType, countryName } = req.body;
  if (!skillDescription) { res.status(400).json({ error: "Missing skillDescription" }); return; }
  try {
    const text = await callClaude(
      `Skill: "${skillDescription}". Creator is a ${userType || "professional"} from ${countryName || "the world"}.
Generate 4 very specific buyer personas. Each persona should feel like a real person with a real problem, not a marketing segment. Include cultural/location context where relevant.
Return ONLY a JSON array:
[{"title":"Who they are (max 6 words)","pain":"Their specific problem (max 12 words)","context":"Why they'd pay for this (max 10 words)"}]`
    );
    res.json({ audiences: parseJSON<object[]>(text, []) });
  } catch (err) {
    req.log.error({ err }, "suggest-audiences error");
    res.json({ audiences: [] });
  }
});

router.post("/recommend-format", async (req: Request, res: Response) => {
  const { skill, audience, experience, userType, countryName } = req.body;
  if (!skill) { res.status(400).json({ error: "Missing skill" }); return; }
  try {
    const text = await callClaude(
      `Skill: "${skill}", Audience: "${audience || "general learners"}", Experience: "${experience || "experienced"}", User type: "${userType || "professional"}", Creator country: "${countryName || "the world"}".
Recommend the single best product format to start with and explain why in exactly 12 words.
Also recommend a USD price point.
Return ONLY JSON:
{
  "recommended": "pdf_guide",
  "reason": "12-word explanation here",
  "price_usd": 29,
  "formats": [
    {"id":"pdf_guide","name":"PDF Guide","desc":"Downloadable guide they read at their own pace","time_to_create":"2-4 hours"},
    {"id":"live_sessions","name":"Live Sessions","desc":"1-on-1 or group calls, scheduled in advance","time_to_create":"Ready now"},
    {"id":"video_course","name":"Video Course","desc":"Pre-recorded lessons they watch anytime","time_to_create":"1-2 weeks"},
    {"id":"template_pack","name":"Template Pack","desc":"Ready-to-use files they can copy and adapt","time_to_create":"3-6 hours"},
    {"id":"toolkit","name":"Toolkit","desc":"Bundle of tools, checklists and resources","time_to_create":"4-8 hours"}
  ]
}`
    );
    const result = parseJSON<object>(text, {
      recommended: "pdf_guide",
      reason: "Great fit for sharing structured knowledge quickly",
      price_usd: 29,
      formats: [
        { id: "pdf_guide", name: "PDF Guide", desc: "Downloadable guide they read at their own pace", time_to_create: "2-4 hours" },
        { id: "live_sessions", name: "Live Sessions", desc: "1-on-1 or group calls, scheduled in advance", time_to_create: "Ready now" },
        { id: "video_course", name: "Video Course", desc: "Pre-recorded lessons they watch anytime", time_to_create: "1-2 weeks" },
        { id: "template_pack", name: "Template Pack", desc: "Ready-to-use files they can copy and adapt", time_to_create: "3-6 hours" },
        { id: "toolkit", name: "Toolkit", desc: "Bundle of tools, checklists and resources", time_to_create: "4-8 hours" },
      ],
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "recommend-format error");
    res.json({
      recommended: "pdf_guide",
      reason: "Great fit for sharing structured knowledge quickly",
      price_usd: 29,
      formats: [
        { id: "pdf_guide", name: "PDF Guide", desc: "Downloadable guide they read at their own pace", time_to_create: "2-4 hours" },
        { id: "live_sessions", name: "Live Sessions", desc: "1-on-1 or group calls, scheduled in advance", time_to_create: "Ready now" },
        { id: "video_course", name: "Video Course", desc: "Pre-recorded lessons they watch anytime", time_to_create: "1-2 weeks" },
        { id: "template_pack", name: "Template Pack", desc: "Ready-to-use files they can copy and adapt", time_to_create: "3-6 hours" },
        { id: "toolkit", name: "Toolkit", desc: "Bundle of tools, checklists and resources", time_to_create: "4-8 hours" },
      ],
    });
  }
});

export default router;
