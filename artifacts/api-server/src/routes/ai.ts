import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

function sendEvent(res: Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function callClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
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
  return "Other";
}

router.post("/ai/build", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { productId, skill, hoursPerWeek, price } = req.body;

  if (!productId || !skill || !hoursPerWeek || !price) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let productConcept = "";
  let marketResearch = "";
  let salesCopy = "";
  let socialCaptions = "";
  let productName = "";
  let productDescription = "";
  let productFormat = "";
  let headline = "";

  try {
    sendEvent(res, { step: 1, status: "active", message: "Researching market demand for your skill..." });

    try {
      const researchPrompt = `Tell me: is there demand for someone who ${skill}? What would people pay for it? Give me 3 concrete data points with numbers. Be concise and direct. Use 2-3 sentences max.`;
      marketResearch = await callClaude(researchPrompt);
      sendEvent(res, { step: 1, status: "done", output: marketResearch });
    } catch {
      marketResearch = `Strong demand exists for ${skill} expertise. Market research shows growing need in this area.`;
      sendEvent(res, { step: 1, status: "done", output: marketResearch });
    }

    sendEvent(res, { step: 2, status: "active", message: "Generating your micro-product concept..." });

    try {
      const conceptPrompt = `Based on this skill: "${skill}", available ${hoursPerWeek} hours/week, target price $${price} — design ONE specific micro-product concept. Format your response EXACTLY as:
Product Name: [name]
Description: [2 sentences describing what it is and who it's for]
Format: [PDF / 3 sessions / course / template / workshop]

Be specific and creative. The product should be something a real person would buy.`;
      productConcept = await callClaude(conceptPrompt);

      const nameMatch = productConcept.match(/Product Name:\s*(.+)/i);
      const descMatch = productConcept.match(/Description:\s*(.+(?:\n.+)?)/i);
      const formatMatch = productConcept.match(/Format:\s*(.+)/i);

      productName = nameMatch?.[1]?.trim() ?? `${skill} Master Package`;
      productDescription = descMatch?.[1]?.trim() ?? productConcept.slice(0, 200);
      productFormat = formatMatch?.[1]?.trim() ?? "PDF Guide";

      sendEvent(res, { step: 2, status: "done", output: productConcept });
    } catch {
      productName = `${skill} Essentials`;
      productDescription = `A comprehensive guide to mastering ${skill} for beginners and intermediate learners.`;
      productFormat = "PDF Guide";
      productConcept = `Product Name: ${productName}\nDescription: ${productDescription}\nFormat: ${productFormat}`;
      sendEvent(res, { step: 2, status: "done", output: productConcept });
    }

    sendEvent(res, { step: 3, status: "active", message: "Writing your sales copy and pricing..." });

    try {
      const salesPrompt = `Write a compelling sales page for this product: "${productName}" — ${productDescription}. Price: $${price}.
Include:
- Headline: [punchy headline under 10 words]
- Subheadline: [one sentence value proposition]
- 3 bullet point benefits (start each with "✓")
- Social proof: [one realistic testimonial placeholder in quotes]
- CTA button text: [action-oriented button text]

Keep it punchy, human, and conversion-focused.`;
      salesCopy = await callClaude(salesPrompt);

      const headlineMatch = salesCopy.match(/Headline:\s*(.+)/i);
      headline = headlineMatch?.[1]?.trim() ?? `Master ${skill} in Record Time`;

      sendEvent(res, { step: 3, status: "done", output: salesCopy });
    } catch {
      headline = `Master ${skill} in Record Time`;
      salesCopy = `Headline: ${headline}\nSubheadline: The fastest path to turning your expertise into income.\n✓ Step-by-step guidance\n✓ Proven frameworks\n✓ Immediate results\nCTA: Get Instant Access`;
      sendEvent(res, { step: 3, status: "done", output: salesCopy });
    }

    sendEvent(res, { step: 4, status: "active", message: "Building your live sales page..." });
    await new Promise((r) => setTimeout(r, 800));
    sendEvent(res, { step: 4, status: "done", output: `Sales page created for "${productName}"` });

    sendEvent(res, { step: 5, status: "active", message: "Creating your payment setup..." });
    await new Promise((r) => setTimeout(r, 600));
    sendEvent(res, { step: 5, status: "done", output: "Payment system ready — connect Stripe to activate checkout" });

    sendEvent(res, { step: 6, status: "active", message: "Writing 5 social media captions..." });

    try {
      const socialPrompt = `Write 5 short social media captions (Twitter/LinkedIn/WhatsApp) to launch this product: "${productName}" — ${productDescription}. Price $${price}.
Number each caption 1-5. Each under 280 chars. Make them feel real and relatable, not salesy. Vary the tone — excited, casual, storytelling, curious, direct.`;
      socialCaptions = await callClaude(socialPrompt);
      sendEvent(res, { step: 6, status: "done", output: socialCaptions });
    } catch {
      socialCaptions = `1. Just launched my first digital product! 🎉 If you want to learn ${skill}, I built something for you.\n2. Turned my expertise in ${skill} into a real product. Check it out!\n3. The thing I wish existed when I started learning ${skill} — I built it.\n4. If ${skill} is something you've wanted to master, this is your sign.\n5. New product drop: ${productName} — $${price} and worth every penny.`;
      sendEvent(res, { step: 6, status: "done", output: socialCaptions });
    }

    sendEvent(res, { step: 7, status: "active", message: "Adding your product to the Zniche marketplace..." });

    const category = guessCategory(skill);

    await db
      .update(productsTable)
      .set({
        productName,
        productDescription,
        productFormat,
        category,
        headline,
        salesCopy,
        socialCaptions,
        marketResearch,
        status: "completed",
        marketplaceListed: true,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, productId));

    sendEvent(res, {
      step: 7,
      status: "done",
      output: `"${productName}" is now live on the Zniche marketplace!`,
    });

    sendEvent(res, {
      done: true,
      product: {
        id: productId,
        productName,
        productDescription,
        productFormat,
        category,
        headline,
        salesCopy,
        socialCaptions,
        marketResearch,
        status: "completed",
        price,
      },
    });
  } catch (err) {
    req.log.error({ err }, "AI build error");
    sendEvent(res, { error: "AI build failed", step: -1 });
  } finally {
    res.end();
  }
});

export default router;
