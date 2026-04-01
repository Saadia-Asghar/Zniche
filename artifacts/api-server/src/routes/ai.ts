import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

function sendEvent(res: Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJSON<T>(text: string, fallback: T): T {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return fallback;
  try { return JSON.parse(match[0]) as T; } catch { return fallback; }
}

function guessCategory(skill: string): string {
  const s = skill.toLowerCase();
  if (s.match(/code|program|develop|software|web|app|tech|engineer/)) return "Tech & Software";
  if (s.match(/write|blog|content|copy|edit|author/)) return "Writing & Content";
  if (s.match(/design|figma|graphic|ui|ux|brand|logo/)) return "Design & Creative";
  if (s.match(/coach|mentor|consult|strategy|business|market/)) return "Business & Coaching";
  if (s.match(/music|photo|video|art|film|creative/)) return "Arts & Media";
  if (s.match(/teach|tutor|course|learn|language|math|science/)) return "Education & Tutoring";
  if (s.match(/finance|invest|money|account|tax|budget/)) return "Finance & Money";
  if (s.match(/health|fitness|yoga|diet|nutrition|wellness/)) return "Health & Wellness";
  if (s.match(/cook|food|chef|recipe|bak|cuisin/)) return "Food & Cooking";
  return "Other";
}

// Phase 1: Steps 1-3 (Market Intelligence, Buyer Psychology, Product Architecture)
router.post("/ai/build/phase1", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { productId, skill, price, userType, targetAudience, experienceLevel, productFormat } = req.body;
  if (!productId || !skill) { res.status(400).json({ error: "Missing required fields" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    // Step 1 - Market Intelligence
    sendEvent(res, { step: 1, status: "active", message: "Researching market demand..." });
    let marketResearch = "";
    try {
      marketResearch = await callClaude(
        `Search for real evidence of demand for: ${skill} targeting ${targetAudience || "general learners"}. Find: (1) What platforms sell this type of knowledge? (2) What are real prices being charged? (3) What search terms do buyers use? Format as 3 clear bullet points with specific numbers and platform names. Be concise and specific.`,
        "You are a market research analyst. Be specific and data-driven."
      );
      sendEvent(res, { step: 1, status: "done", output: marketResearch });
    } catch {
      marketResearch = `Strong demand exists for ${skill} expertise. Platforms like Gumroad, Udemy, and Skillshare charge $19–$97 for similar products.`;
      sendEvent(res, { step: 1, status: "done", output: marketResearch });
    }

    // Step 2 - Buyer Psychology
    sendEvent(res, { step: 2, status: "active", message: "Analyzing buyer psychology..." });
    let buyerProfile = "";
    try {
      buyerProfile = await callClaude(
        `Based on this audience: ${targetAudience || "general learners"} who want ${skill}, write a buyer profile. Include: their #1 frustration (1 sentence), what they've already tried (1 sentence), what would make them buy immediately (1 sentence), and their exact first question when they land on a sales page (quoted). Be specific — not generic.`,
        "You are a buyer psychology expert."
      );
      sendEvent(res, { step: 2, status: "done", output: buyerProfile });
    } catch {
      buyerProfile = `Buyers for ${skill} are frustrated by lack of structured guidance. They've tried YouTube and free resources. Clear, step-by-step instruction would make them buy immediately.`;
      sendEvent(res, { step: 2, status: "done", output: buyerProfile });
    }

    // Step 3 - Product Architecture
    sendEvent(res, { step: 3, status: "active", message: "Designing product architecture..." });
    let productConcept = "";
    let productName = "";
    let productDescription = "";
    let tagline = "";
    try {
      const raw = await callClaude(
        `Design a ${productFormat || "PDF Guide"} product for ${targetAudience || "learners"} taught by someone with ${experienceLevel || "good"} experience in ${skill} priced at $${price || 49}. Create: PRODUCT_NAME (4-6 words, outcome-focused, no fluff), TAGLINE (8-12 words, specific outcome), WHAT_INSIDE (5 specific modules with names), UNIQUE_ANGLE (what makes this different from free YouTube content). Return as JSON: {"product_name":"...","tagline":"...","modules":["...","...","...","...","..."],"unique_angle":"..."}`,
        "You are a product designer for digital knowledge products."
      );
      const parsed = parseJSON<any>(raw, {});
      productName = parsed.product_name || `${skill} Mastery Guide`;
      tagline = parsed.tagline || `The fastest path from learning to earning with ${skill}`;
      productDescription = `A comprehensive ${productFormat || "PDF Guide"} covering: ${(parsed.modules || []).join(", ")}. ${parsed.unique_angle || ""}`;
      productConcept = raw;
      sendEvent(res, { step: 3, status: "done", output: raw, productName, tagline });
    } catch {
      productName = `${skill} Essentials`;
      tagline = `The practical guide to mastering ${skill} and turning it into income`;
      productDescription = `A comprehensive guide to mastering ${skill} for ${targetAudience || "learners"}.`;
      sendEvent(res, { step: 3, status: "done", output: productDescription, productName, tagline });
    }

    // Save phase 1 data to DB
    await db.update(productsTable).set({
      productName,
      tagline,
      productDescription,
      productFormat: productFormat || "PDF Guide",
      category: guessCategory(skill),
      marketResearch,
      userType: userType || null,
      targetAudience: targetAudience || null,
      experienceLevel: experienceLevel || null,
      updatedAt: new Date(),
    }).where(eq(productsTable.id, productId));

    // Signal verification needed
    sendEvent(res, { step: 4, status: "verify_needed", productName, tagline });

  } catch (err) {
    req.log.error({ err }, "AI build phase1 error");
    sendEvent(res, { error: "Build phase 1 failed" });
  } finally {
    res.end();
  }
});

// Phase 2: Steps 5-8 (after skill verification)
router.post("/ai/build/phase2", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { productId, quizScore, isVerified } = req.body;
  if (!productId) { res.status(400).json({ error: "Missing productId" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (!product) { sendEvent(res, { error: "Product not found" }); res.end(); return; }

  const { skill, price, targetAudience, experienceLevel, productName, tagline, productFormat } = product;

  try {
    // Step 4 done (skill verification result)
    const verifiedBadge = isVerified ? "Verified Expert" : "New Creator";
    sendEvent(res, { step: 4, status: "done", output: `${verifiedBadge} badge earned (${quizScore || 0}/3 correct)` });

    // Update verified status
    await db.update(productsTable).set({
      isVerifiedCreator: !!isVerified,
      updatedAt: new Date(),
    }).where(eq(productsTable.id, productId));

    // Step 5 - Sales Page Copy
    sendEvent(res, { step: 5, status: "active", message: "Writing your sales page copy..." });
    let salesCopy = "";
    let headline = "";
    try {
      const raw = await callClaude(
        `Write a complete sales page for: PRODUCT: ${productName}, AUDIENCE: ${targetAudience || "learners"}, PROMISE: ${tagline}, PRICE: $${price}. Include: HERO_HEADLINE (bold claim, max 8 words, no question marks), HERO_SUBHEADLINE (expands promise, max 18 words), WHO_THIS_IS_FOR (3 bullet points starting with "You're someone who..."), WHAT_YOU_GET (5 specific tangible items), CREATOR_BIO_HOOK (first-person, 2 sentences, mentions experience naturally), FAQ (3 real buyer questions with direct answers), CTA_BUTTON (max 5 words). Return as JSON: {"headline":"...","subheadline":"...","who_for":["...","...","..."],"what_you_get":["...","...","...","...","..."],"bio_hook":"...","faq":[{"q":"...","a":"..."}],"cta":"..."}`,
        "You are a conversion copywriter. Write like a human, not an AI. Never use the words 'unlock', 'elevate', 'transform', 'journey'."
      );
      const parsed = parseJSON<any>(raw, {});
      headline = parsed.headline || `Master ${skill} in Record Time`;
      salesCopy = raw;
      sendEvent(res, { step: 5, status: "done", output: raw });
    } catch {
      headline = `Master ${skill} in Record Time`;
      salesCopy = JSON.stringify({ headline, subheadline: `The fastest path to turning your ${skill} expertise into real income`, who_for: [`You're someone who knows ${skill} but doesn't know how to package it`, "You're someone who wants a reliable extra income stream", "You're someone ready to turn knowledge into a product"], what_you_get: ["Step-by-step guide", "Ready-to-use templates", "Proven frameworks", "Real examples", "Bonus resources"], bio_hook: `I've spent years mastering ${skill} and now I want to help you skip the learning curve.`, faq: [{ q: "Who is this for?", a: `Anyone who wants to master ${skill} faster.` }, { q: "What format is it?", a: `It's a ${productFormat || "PDF Guide"} you can use immediately.` }, { q: "Is there a guarantee?", a: "Yes — 30-day money-back guarantee." }], cta: "Get Instant Access" });
      sendEvent(res, { step: 5, status: "done", output: salesCopy });
    }

    // Step 6 - Visual Build
    sendEvent(res, { step: 6, status: "active", message: "Assembling your product page..." });
    await new Promise(r => setTimeout(r, 600));
    const pageSlug = (productName || skill).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    sendEvent(res, { step: 6, status: "done", output: `Sales page assembled at /product/${productId}` });

    // Step 7 - Stripe Checkout
    sendEvent(res, { step: 7, status: "active", message: "Creating your payment link..." });
    let stripeCheckoutUrl = null;
    try {
      const stripeResp = await fetch(`/api/stripe/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (stripeResp.ok) {
        const stripeData = await stripeResp.json() as { url?: string };
        stripeCheckoutUrl = stripeData.url || null;
      }
    } catch { /* Stripe optional */ }
    sendEvent(res, { step: 7, status: "done", output: stripeCheckoutUrl ? `Payment link created` : "Connect Stripe in settings to activate payments" });

    // Step 8 - Launch Kit
    sendEvent(res, { step: 8, status: "active", message: "Writing your launch kit..." });
    let launchKit = "";
    let socialCaptions = "";
    try {
      const raw = await callClaude(
        `Write a launch kit for ${productName} — ${tagline} at $${price}. Create: (1) LinkedIn post (150 words, professional but warm), (2) Twitter/X post (max 240 chars, conversational, 2 hashtags), (3) WhatsApp message (short, feels like texting a friend, no hashtags), (4) Email subject line (max 8 words), (5) Email body (50 words, friendly, one CTA). Return as JSON: {"linkedin":"...","twitter":"...","whatsapp":"...","email_subject":"...","email_body":"..."}`,
        "Write like a real person sharing something they're excited about."
      );
      launchKit = raw;
      const parsed = parseJSON<any>(raw, {});
      socialCaptions = `LinkedIn: ${parsed.linkedin || ""}\n\nTwitter: ${parsed.twitter || ""}\n\nWhatsApp: ${parsed.whatsapp || ""}`;
      sendEvent(res, { step: 8, status: "done", output: raw, launchKit: raw });
    } catch {
      socialCaptions = `1. Just launched my new product: ${productName}! ${tagline}\n2. New product drop 🚀 ${productName} — check it out!\n3. Hey! I just published ${productName}. Thought you might like it!`;
      sendEvent(res, { step: 8, status: "done", output: socialCaptions });
    }

    // Publish to marketplace
    const category = guessCategory(skill as string);
    await db.update(productsTable).set({
      headline,
      salesCopy,
      socialCaptions,
      launchKit,
      pageSlug,
      category,
      status: "completed",
      marketplaceListed: true,
      stripeCheckoutUrl,
      updatedAt: new Date(),
    }).where(eq(productsTable.id, productId));

    sendEvent(res, {
      done: true,
      product: { id: productId, productName, tagline, headline, salesCopy, launchKit, socialCaptions, category, status: "completed", price },
    });

  } catch (err) {
    req.log.error({ err }, "AI build phase2 error");
    sendEvent(res, { error: "Build phase 2 failed" });
  } finally {
    res.end();
  }
});

// Legacy single-phase build (kept for compatibility)
router.post("/ai/build", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { productId, skill, hoursPerWeek, price, userType, targetAudience, experienceLevel, productFormat } = req.body;
  if (!productId || !skill) { res.status(400).json({ error: "Missing required fields" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let productName = `${skill} Mastery Guide`;
  let tagline = `The practical path to mastering ${skill}`;
  let productDescription = "";
  let headline = "";
  let salesCopy = "";
  let socialCaptions = "";
  let marketResearch = "";
  let launchKit = "";

  try {
    sendEvent(res, { step: 1, status: "active", message: "Researching market demand..." });
    try {
      marketResearch = await callClaude(`What platforms sell ${skill} knowledge? What prices are charged? What terms do buyers search? Give 3 bullet points with specifics.`, "You are a market research analyst.");
      sendEvent(res, { step: 1, status: "done", output: marketResearch });
    } catch {
      marketResearch = `Strong demand for ${skill}. Platforms like Gumroad and Udemy show $19–$97 pricing.`;
      sendEvent(res, { step: 1, status: "done", output: marketResearch });
    }

    sendEvent(res, { step: 2, status: "active", message: "Designing your product concept..." });
    try {
      const raw = await callClaude(`Design a ${productFormat || "PDF Guide"} about ${skill} for $${price}. Return JSON: {"product_name":"...","tagline":"...","description":"2 sentences"}`, "You are a product designer.");
      const parsed = parseJSON<any>(raw, {});
      productName = parsed.product_name || productName;
      tagline = parsed.tagline || tagline;
      productDescription = parsed.description || productDescription;
      sendEvent(res, { step: 2, status: "done", output: raw, productName, tagline });
    } catch {
      sendEvent(res, { step: 2, status: "done", output: `${productName}: ${tagline}` });
    }

    sendEvent(res, { step: 3, status: "active", message: "Writing your sales copy..." });
    try {
      const raw = await callClaude(`Write a sales page for "${productName}" — ${tagline} at $${price}. Return JSON: {"headline":"...","subheadline":"...","cta":"..."}`, "Write like a human, not an AI.");
      const parsed = parseJSON<any>(raw, {});
      headline = parsed.headline || `Master ${skill} in Record Time`;
      salesCopy = raw;
      sendEvent(res, { step: 3, status: "done", output: raw });
    } catch {
      headline = `Master ${skill} in Record Time`;
      salesCopy = `{"headline":"${headline}","subheadline":"The fastest path to turning your expertise into income.","cta":"Get Instant Access"}`;
      sendEvent(res, { step: 3, status: "done", output: salesCopy });
    }

    sendEvent(res, { step: 4, status: "active", message: "Building your sales page..." });
    await new Promise(r => setTimeout(r, 600));
    sendEvent(res, { step: 4, status: "done", output: `Sales page created for "${productName}"` });

    sendEvent(res, { step: 5, status: "active", message: "Creating your payment setup..." });
    await new Promise(r => setTimeout(r, 500));
    sendEvent(res, { step: 5, status: "done", output: "Payment system ready — connect Stripe to activate checkout" });

    sendEvent(res, { step: 6, status: "active", message: "Writing social captions..." });
    try {
      socialCaptions = await callClaude(`Write 5 social media captions for: "${productName}" — ${tagline}. Price $${price}. Number 1-5. Each under 280 chars.`);
      sendEvent(res, { step: 6, status: "done", output: socialCaptions });
    } catch {
      socialCaptions = `1. Just launched: ${productName} 🚀\n2. Turned my ${skill} expertise into a product!\n3. New: ${productName} — ${tagline}`;
      sendEvent(res, { step: 6, status: "done", output: socialCaptions });
    }

    sendEvent(res, { step: 7, status: "active", message: "Publishing to marketplace..." });
    const category = guessCategory(skill);
    const pageSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    await db.update(productsTable).set({
      productName, tagline, productDescription, productFormat: productFormat || "PDF Guide",
      category, headline, salesCopy, socialCaptions, marketResearch, launchKit,
      userType: userType || null, targetAudience: targetAudience || null, experienceLevel: experienceLevel || null,
      pageSlug, status: "completed", marketplaceListed: true, updatedAt: new Date(),
    }).where(eq(productsTable.id, productId));
    sendEvent(res, { step: 7, status: "done", output: `"${productName}" is now live on the Zniche marketplace!` });

    sendEvent(res, { done: true, product: { id: productId, productName, tagline, headline, salesCopy, socialCaptions, marketResearch, category, status: "completed", price } });
  } catch (err) {
    req.log.error({ err }, "AI build error");
    sendEvent(res, { error: "AI build failed", step: -1 });
  } finally {
    res.end();
  }
});

router.post("/ai/verify-skill", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { skill, experienceLevel } = req.body;
  if (!skill) { res.status(400).json({ error: "Missing skill" }); return; }
  try {
    const response = await callClaude(
      `Generate 3 practical multiple-choice questions that a genuine ${experienceLevel || "experienced"} expert in "${skill}" would easily answer but a beginner would struggle with. Test real applied knowledge, not just definitions. Return ONLY valid JSON: {"questions": [{"question": "...", "options": ["a) ...", "b) ...", "c) ...", "d) ..."], "correct": "a"}]}`
    );
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { res.status(500).json({ error: "Failed to parse quiz" }); return; }
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    req.log.error({ err }, "Skill verification error");
    res.status(500).json({ error: "Failed to generate verification quiz" });
  }
});

export default router;
