import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  Search, Lightbulb, Pen, Image, CreditCard, Globe,
  Shield, MessageCircle, Twitter, Linkedin, Copy, ExternalLink,
  GraduationCap, Briefcase, Palette, Dumbbell, ChefHat, Code2,
  FileText, Video, Wrench, Package, Users, Sparkles, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { useCreateProduct, useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ProductCover3D } from "@/components/product-cover-3d";
import { ErrorBoundary } from "@/components/error-boundary";
import { useLocation as useGeoLocation } from "@/hooks/useLocation";
import { convertPrice, getPPPPrice, getFlagEmoji } from "@/lib/pricing";

// ─── Types ───────────────────────────────────────────────────────────────────

type BuildPhase = "onboarding" | "verifying" | "building" | "celebration";
type StepStatus = "pending" | "active" | "done" | "error";

interface QuizQuestion { question: string; options: string[]; correct: string; }
interface AudienceCard { title: string; pain: string; context: string; }
interface FormatCard { id: string; name: string; desc: string; time_to_create: string; }
interface FormatRec { recommended: string; reason: string; price_usd: number; formats: FormatCard[]; }
interface StreamEvent { step?: number; status?: string; message?: string; output?: string; done?: boolean; product?: any; error?: string; productName?: string; tagline?: string; launchKit?: string; }

const ONBOARDING_ROLES = [
  { id: "teacher", label: "Teacher / Tutor", desc: "You love explaining things clearly", Icon: GraduationCap },
  { id: "freelancer", label: "Freelancer / Consultant", desc: "You sell your time and expertise", Icon: Briefcase },
  { id: "professional", label: "Professional / Expert", desc: "Years of experience in your field", Icon: BookOpen },
  { id: "health", label: "Health & Fitness", desc: "You help people feel their best", Icon: Dumbbell },
  { id: "chef", label: "Chef & Food", desc: "You make amazing things happen in the kitchen", Icon: ChefHat },
  { id: "tech", label: "Tech & Developer", desc: "You build things with code", Icon: Code2 },
];

const EXPERIENCE_LEVELS = [
  { id: "learning", label: "I'm still learning", range: "$9–$19", sub: "1–2 years" },
  { id: "confident", label: "Getting more confident", range: "$19–$47", sub: "3–5 years" },
  { id: "experienced", label: "Very experienced", range: "$47–$97", sub: "6–10 years" },
  { id: "profession", label: "This is my profession", range: "$97–$297", sub: "10+ years" },
];

const BUILD_STEPS = [
  { icon: Search, label: "Market Intelligence", description: "Researching demand for your skill" },
  { icon: Lightbulb, label: "Buyer Psychology", description: "Understanding what makes buyers click" },
  { icon: Pen, label: "Product Architecture", description: "Designing your micro-product" },
  { icon: Shield, label: "Expertise Verification", description: "Verifying your knowledge" },
  { icon: MessageCircle, label: "Sales Page Copy", description: "Writing conversion-focused copy" },
  { icon: Image, label: "Visual Build", description: "Assembling your live page" },
  { icon: CreditCard, label: "Stripe Checkout", description: "Setting up your payment link" },
  { icon: Globe, label: "Launch Kit", description: "Your social media starter pack" },
];

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Build() {
  const [, setLocation] = useLocation();
  const { location: geoLocation } = useGeoLocation();

  // Onboarding state
  const [phase, setPhase] = useState<BuildPhase>("onboarding");
  const [screen, setScreen] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [userType, setUserType] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [audienceCards, setAudienceCards] = useState<AudienceCard[]>([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState("");
  const [customAudience, setCustomAudience] = useState("");
  const [showCustomAudience, setShowCustomAudience] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [formatRec, setFormatRec] = useState<FormatRec | null>(null);
  const [formatLoading, setFormatLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [price, setPrice] = useState(29);
  const [pppPrice, setPppPrice] = useState<{ country: string; flag: string; amount: string } | null>(null);
  const [gbpPrice, setGbpPrice] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizQ, setCurrentQuizQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "wrong" | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Build state
  const [currentStep, setCurrentStep] = useState(0);
  const [stepOutputs, setStepOutputs] = useState<Record<number, string>>({});
  const [stepTimes, setStepTimes] = useState<Record<number, number>>({});
  const [activeStepStart, setActiveStepStart] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [productNameBuilt, setProductNameBuilt] = useState("");
  const [launchKitData, setLaunchKitData] = useState<any>(null);
  const [launchKitTab, setLaunchKitTab] = useState<"linkedin" | "twitter" | "whatsapp" | "email">("linkedin");
  const abortControllerRef = useRef<AbortController | null>(null);
  const outputPanelRef = useRef<HTMLDivElement>(null);

  const createProduct = useCreateProduct();
  const { data: finalProduct } = useGetProduct(createdProductId || "", {
    query: { enabled: !!createdProductId && phase === "celebration", queryKey: getGetProductQueryKey(createdProductId || "") },
  });

  // ── Timer for active step ──
  useEffect(() => {
    if (activeStepStart === null) { setElapsedTime(0); return; }
    const interval = setInterval(() => setElapsedTime((Date.now() - activeStepStart) / 1000), 100);
    return () => clearInterval(interval);
  }, [activeStepStart]);

  // ── Auto-scroll output ──
  useEffect(() => {
    if (outputPanelRef.current) outputPanelRef.current.scrollTop = outputPanelRef.current.scrollHeight;
  }, [stepOutputs, currentStep]);

  // ── PPP + currency display ──
  useEffect(() => {
    if (!geoLocation) return;
    const updatePrices = async () => {
      const ppp = getPPPPrice(price, geoLocation.countryCode);
      const converted = await convertPrice(ppp, geoLocation.currency);
      setPppPrice({ country: geoLocation.countryName, flag: getFlagEmoji(geoLocation.countryCode), amount: converted.formatted });
      const gbp = await convertPrice(price, "GBP");
      setGbpPrice(gbp.formatted);
    };
    updatePrices();
  }, [price, geoLocation]);

  // ── AI autocomplete for skill ──
  useEffect(() => {
    if (skillInput.length < 10) { setSkillSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch("/api/suggest-skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: skillInput, userType, countryName: geoLocation?.countryName }),
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSkillSuggestions(data.suggestions || []);
        }
      } catch { /* fail silently */ } finally { setSuggestLoading(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [skillInput, userType, geoLocation]);

  // ── Load audience cards when hitting screen 2 ──
  useEffect(() => {
    if (screen !== 2 || audienceCards.length > 0 || !skillInput) return;
    setAudienceLoading(true);
    fetch("/api/suggest-audiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillDescription: skillInput, userType, countryName: geoLocation?.countryName }),
      credentials: "include",
    }).then(r => r.ok ? r.json() : { audiences: [] })
      .then(data => setAudienceCards(data.audiences || []))
      .catch(() => {})
      .finally(() => setAudienceLoading(false));
  }, [screen]);

  // ── Load format recommendation when hitting screen 4 ──
  useEffect(() => {
    if (screen !== 4 || formatRec) return;
    setFormatLoading(true);
    fetch("/api/recommend-format", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: skillInput, audience: selectedAudience || customAudience, experience: experienceLevel, userType, countryName: geoLocation?.countryName }),
      credentials: "include",
    }).then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setFormatRec(data);
          setSelectedFormat(data.recommended || "pdf_guide");
          setPrice(data.price_usd || 29);
        }
      })
      .catch(() => {})
      .finally(() => setFormatLoading(false));
  }, [screen]);

  const goNext = (dir = 1) => {
    setSlideDir(dir);
    setScreen(s => s + dir);
  };

  const goBack = () => {
    setSlideDir(-1);
    setScreen(s => Math.max(0, s - 1));
  };

  // ── Confetti helpers ──
  const fireStepBurst = useCallback(() => {
    confetti({ particleCount: 15, spread: 40, origin: { x: 0.15, y: 0.5 }, colors: ["#5B2EFF", "#00F0A0"], scalar: 0.6, gravity: 0.8, ticks: 60 });
  }, []);

  const fireCelebration = useCallback(() => {
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#5B2EFF", "#00F0A0", "#FF5A70"] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#5B2EFF", "#00F0A0", "#FF5A70"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.4 }, colors: ["#5B2EFF", "#00F0A0", "#FFD700"] }), 500);
  }, []);

  // ── Start the build (after format + price chosen) ──
  const startBuild = async () => {
    setQuizLoading(true);
    try {
      const resp = await fetch("/api/ai/verify-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: skillInput, experienceLevel }),
        credentials: "include",
      });
      if (resp.ok) {
        const data = await resp.json();
        setQuizQuestions(data.questions || []);
      }
    } catch { /* fail silently */ } finally { setQuizLoading(false); }

    // Create product record
    try {
      const newProduct = await createProduct.mutateAsync({
        data: { skill: skillInput, hoursPerWeek: 5, price: price.toString() },
      });
      setCreatedProductId(newProduct.id);

      // Start Phase 1 (steps 1–3) in the background immediately
      setPhase("verifying");
      setCurrentStep(4); // Show step 4 (verification) as active
      setActiveStepStart(Date.now());

      // Run phase 1 in parallel with quiz
      runPhase1(newProduct.id);
    } catch (err) {
      toast.error("Failed to start. Please try again.");
    }
  };

  // ── Phase 1: stream steps 1–3 ──
  const runPhase1 = async (productId: string) => {
    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch("/api/ai/build/phase1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          skill: skillInput,
          price,
          userType,
          targetAudience: selectedAudience || customAudience,
          experienceLevel,
          productFormat: formatRec?.formats.find(f => f.id === selectedFormat)?.name || "PDF Guide",
        }),
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Phase 1 failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: StreamEvent = JSON.parse(line.substring(6));
            if (event.error) { setErrorMessage(event.error); return; }
            if (event.productName) setProductNameBuilt(event.productName);
            if (event.step && event.step < 4) {
              setCurrentStep(event.step);
              setActiveStepStart(Date.now());
              if (event.output) setStepOutputs(prev => ({ ...prev, [event.step!]: event.output! }));
              if (event.status === "done") {
                setStepTimes(prev => ({ ...prev, [event.step!]: elapsedTime }));
                fireStepBurst();
              }
            }
          } catch { /* parse error */ }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") console.error("Phase 1 error", err);
    }
  };

  // ── Quiz answer handler ──
  const handleQuizAnswer = (answer: string, idx: number) => {
    const correct = answer.charAt(0) === quizQuestions[currentQuizQ]?.correct;
    setQuizFeedback(correct ? "correct" : "wrong");
    setQuizAnswers(prev => ({ ...prev, [currentQuizQ]: answer }));

    setTimeout(() => {
      setQuizFeedback(null);
      if (currentQuizQ < quizQuestions.length - 1) {
        setCurrentQuizQ(prev => prev + 1);
      } else {
        const allAnswers = { ...quizAnswers, [currentQuizQ]: answer };
        let score = 0;
        quizQuestions.forEach((q, i) => { if (allAnswers[i]?.charAt(0) === q.correct) score++; });
        setQuizScore(score);
        if (score >= 2) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#5B2EFF", "#00F0A0"] });
      }
    }, 700);
  };

  // ── After quiz: run phase 2 ──
  const runPhase2 = async (score: number) => {
    if (!createdProductId) return;
    setPhase("building");
    setCurrentStep(4);
    setActiveStepStart(Date.now());

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch("/api/ai/build/phase2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: createdProductId, quizScore: score, isVerified: score >= 2 }),
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Phase 2 failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: StreamEvent = JSON.parse(line.substring(6));
            if (event.error) { setErrorMessage(event.error); setErrorStep(currentStep); return; }
            if (event.step) {
              if (event.step > currentStep) fireStepBurst();
              setCurrentStep(event.step);
              setActiveStepStart(Date.now());
              if (event.output) setStepOutputs(prev => ({ ...prev, [event.step!]: event.output! }));
              if (event.status === "done") setStepTimes(prev => ({ ...prev, [event.step!]: elapsedTime }));
            }
            if (event.launchKit) {
              try { setLaunchKitData(JSON.parse(event.launchKit.match(/\{[\s\S]*\}/)?.[0] || "{}")); } catch { /* ignore */ }
            }
            if (event.done) { setPhase("celebration"); fireCelebration(); }
          } catch { /* parse error */ }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setErrorMessage("Build failed. Please retry.");
        setErrorStep(currentStep);
      }
    }
  };

  const getStepStatus = (index: number): StepStatus => {
    const stepNum = index + 1;
    if (errorStep === stepNum) return "error";
    if (currentStep > stepNum) return "done";
    if (currentStep === stepNum && (phase === "verifying" || phase === "building")) return "active";
    return "pending";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const getShareUrl = () => `${window.location.origin}/product/${createdProductId}`;

  const parsedSalesCopy = (() => {
    try {
      const raw = finalProduct?.salesCopy || "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch { return {}; }
  })();

  const parsedLaunchKit = launchKitData || (() => {
    try {
      const raw = finalProduct?.launchKit || "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch { return {}; }
  })();

  // ══════════════════════════════════════════════════════
  // PHASE: ONBOARDING (5 screens)
  // ══════════════════════════════════════════════════════
  if (phase === "onboarding") {
    return (
      <div className="fixed inset-0 bg-[#08080F] flex flex-col overflow-hidden" style={{ top: 0 }}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-8 pb-4 flex-shrink-0">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === screen ? "w-6 h-2 bg-primary" : i < screen ? "w-2 h-2 bg-primary/60" : "w-2 h-2 bg-white/20"}`} />
          ))}
        </div>

        {/* Back arrow */}
        {screen > 0 && (
          <button onClick={goBack} className="absolute top-6 left-6 p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={slideDir}>
            {/* ── Screen 0: Role ── */}
            {screen === 0 && (
              <motion.div key="s0" custom={slideDir} variants={SLIDE_VARIANTS} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }} className="absolute inset-0 flex flex-col items-center justify-center px-6 py-4">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-center mb-2">Hey! What best describes you?</h1>
                <p className="text-muted-foreground text-center mb-8 text-sm">This helps us understand your style — takes 5 minutes total.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                  {ONBOARDING_ROLES.map(role => (
                    <button
                      key={role.id}
                      onClick={() => { setUserType(role.id); setTimeout(() => goNext(), 350); }}
                      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] ${userType === role.id ? "border-primary bg-primary/10 scale-[1.02]" : "border-white/10 bg-[#0E0E1C]"}`}
                    >
                      <role.Icon className={`w-7 h-7 ${userType === role.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-sm">{role.label}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{role.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Screen 1: Skill ── */}
            {screen === 1 && (
              <motion.div key="s1" custom={slideDir} variants={SLIDE_VARIANTS} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }} className="absolute inset-0 flex flex-col items-center justify-center px-6 py-4">
                <div className="w-full max-w-xl">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-center mb-2">What do people come to you for?</h1>
                  <p className="text-muted-foreground text-center mb-8 text-sm">"Urdu calligraphy for beginners" sells better than "art"</p>
                  <div className="relative mb-3">
                    <textarea
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      placeholder="e.g. I teach Pakistani cooking to diaspora families..."
                      className="w-full min-h-[120px] resize-none p-4 rounded-2xl bg-[#0E0E1C] border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 text-base outline-none transition-all placeholder:text-muted-foreground/50"
                    />
                    <span className={`absolute bottom-3 right-3 text-xs ${skillInput.length > 150 ? "text-red-400" : "text-muted-foreground"}`}>{skillInput.length}/150</span>
                  </div>
                  {(skillSuggestions.length > 0 || suggestLoading) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {suggestLoading ? [1, 2, 3, 4].map(i => <div key={i} className="h-8 w-40 rounded-full bg-white/5 animate-pulse" />) :
                        skillSuggestions.map((s, i) => (
                          <button key={i} onClick={() => setSkillInput(s)} className="px-3 py-1.5 rounded-full text-xs bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors text-left">
                            {s}
                          </button>
                        ))}
                    </div>
                  )}
                  <Button
                    onClick={() => goNext()}
                    disabled={skillInput.length < 15}
                    className="w-full rounded-full h-12 gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Screen 2: Audience ── */}
            {screen === 2 && (
              <motion.div key="s2" custom={slideDir} variants={SLIDE_VARIANTS} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }} className="absolute inset-0 flex flex-col items-center justify-center px-6 py-4">
                <div className="w-full max-w-xl">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-center mb-2">Who would benefit most?</h1>
                  <p className="text-muted-foreground text-center mb-8 text-sm">We'll use this to write your sales page exactly for them.</p>
                  {audienceLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {audienceCards.map((a, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedAudience(a.title + " — " + a.pain); setTimeout(() => goNext(), 350); }}
                          className={`w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] ${selectedAudience.startsWith(a.title) ? "border-primary bg-primary/10" : "border-white/10 bg-[#0E0E1C]"}`}
                        >
                          <p className="font-semibold text-sm">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{a.pain}</p>
                          {a.context && <p className="text-xs text-primary/70 mt-1">{a.context}</p>}
                        </button>
                      ))}
                      {!showCustomAudience ? (
                        <button
                          onClick={() => setShowCustomAudience(true)}
                          className="w-full text-left p-4 rounded-2xl border border-white/10 bg-[#0E0E1C] text-muted-foreground text-sm hover:border-white/20"
                        >
                          Someone else (I'll describe them) →
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input
                            value={customAudience}
                            onChange={e => setCustomAudience(e.target.value)}
                            placeholder="Describe your ideal buyer..."
                            className="w-full p-3 rounded-xl bg-[#0E0E1C] border border-white/10 focus:border-primary outline-none text-sm"
                          />
                          <Button onClick={() => { setSelectedAudience(customAudience); goNext(); }} disabled={!customAudience} className="w-full rounded-full h-10">
                            Continue <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Screen 3: Experience ── */}
            {screen === 3 && (
              <motion.div key="s3" custom={slideDir} variants={SLIDE_VARIANTS} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }} className="absolute inset-0 flex flex-col items-center justify-center px-6 py-4">
                <div className="w-full max-w-xl">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-center mb-2">How long have you been doing this?</h1>
                  <p className="text-muted-foreground text-center mb-8 text-sm">All levels sell — this helps us price your product fairly.</p>
                  <div className="space-y-3">
                    {EXPERIENCE_LEVELS.map(e => (
                      <button
                        key={e.id}
                        onClick={() => { setExperienceLevel(e.id); setTimeout(() => goNext(), 350); }}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] ${experienceLevel === e.id ? "border-primary bg-primary/10" : "border-white/10 bg-[#0E0E1C]"}`}
                      >
                        <div>
                          <p className="font-semibold">{e.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{e.sub}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{e.range}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Screen 4: Format + Price ── */}
            {screen === 4 && (
              <motion.div key="s4" custom={slideDir} variants={SLIDE_VARIANTS} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }} className="absolute inset-0 flex flex-col items-center justify-center px-6 py-4 overflow-y-auto">
                <div className="w-full max-w-xl py-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-center mb-2">How should we package your knowledge?</h1>
                  <p className="text-muted-foreground text-center mb-6 text-sm">AI picked a format based on your answers. You can change it.</p>

                  {formatLoading ? (
                    <div className="space-y-3 mb-6">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="space-y-2 mb-6">
                      {(formatRec?.formats || [
                        { id: "pdf_guide", name: "PDF Guide", desc: "Downloadable guide they read at their own pace", time_to_create: "2-4 hours" },
                        { id: "live_sessions", name: "Live Sessions", desc: "1-on-1 or group calls, scheduled in advance", time_to_create: "Ready now" },
                        { id: "video_course", name: "Video Course", desc: "Pre-recorded lessons they watch anytime", time_to_create: "1-2 weeks" },
                        { id: "template_pack", name: "Template Pack", desc: "Ready-to-use files they can copy and adapt", time_to_create: "3-6 hours" },
                        { id: "toolkit", name: "Toolkit", desc: "Bundle of tools, checklists and resources", time_to_create: "4-8 hours" },
                      ]).map(f => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFormat(f.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] relative ${selectedFormat === f.id ? "border-primary bg-primary/10" : "border-white/10 bg-[#0E0E1C]"}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{f.name}</span>
                              {f.id === formatRec?.recommended && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">Recommended</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                          </div>
                          <span className="text-xs text-muted-foreground/70 ml-3 flex-shrink-0">{f.time_to_create}</span>
                        </button>
                      ))}
                      {formatRec?.reason && (
                        <p className="text-xs text-primary/70 text-center mt-1">
                          <Sparkles className="w-3 h-3 inline mr-1" />{formatRec.reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Price slider */}
                  <div className="bg-[#0E0E1C] border border-white/10 rounded-2xl p-4 mb-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Your price</span>
                      <span className="text-3xl font-bold text-primary">${price}</span>
                    </div>
                    <input
                      type="range" min={9} max={497} step={1} value={price}
                      onChange={e => setPrice(Number(e.target.value))}
                      className="w-full accent-primary mb-4"
                    />
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">🇺🇸 USA</span>
                        <span className="font-medium">${price} USD</span>
                      </div>
                      {pppPrice && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{pppPrice.flag} {pppPrice.country} (PPP)</span>
                          <span className="font-medium">{pppPrice.amount}</span>
                        </div>
                      )}
                      {gbpPrice && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">🇬🇧 United Kingdom</span>
                          <span className="font-medium">{gbpPrice}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-white/10 mt-1">
                        <span className="text-muted-foreground">Your earnings per sale</span>
                        <span className="font-semibold text-green-400">${(price * 0.95).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={startBuild}
                    disabled={createProduct.isPending || quizLoading}
                    className="w-full rounded-full h-14 text-lg gap-2 shadow-lg hover:shadow-primary/25"
                  >
                    {quizLoading ? <span className="animate-pulse">Starting...</span> : <>Build my product <ArrowRight className="w-5 h-5" /></>}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // BUILD FEED LAYOUT (verifying + building)
  // ══════════════════════════════════════════════════════
  if (phase === "verifying" || phase === "building") {
    const completedSteps = BUILD_STEPS.filter((_, i) => getStepStatus(i) === "done").length;
    const progressPct = (completedSteps / BUILD_STEPS.length) * 100;
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (progressPct / 100) * circumference;

    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
        {/* Left: Timeline */}
        <div className="w-full lg:w-80 xl:w-96 border-r border-border/50 bg-card/30 p-6 lg:p-8 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Build Progress</p>
              {productNameBuilt && <p className="text-sm font-medium text-primary mt-1 truncate">{productNameBuilt}</p>}
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-700 ease-out" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{Math.round(progressPct)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            {BUILD_STEPS.map((step, i) => {
              const stepStat = getStepStatus(i);
              const Icon = step.icon;
              return (
                <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-300 ${stepStat === "active" ? "bg-primary/10" : ""} ${stepStat === "pending" ? "opacity-35" : ""}`}>
                  <div className="relative flex-shrink-0">
                    {stepStat === "done" && <div className="w-8 h-8 rounded-full bg-[#00F0A0] flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-black" /></div>}
                    {stepStat === "active" && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse"><Icon className="w-4 h-4 text-white" /></div>}
                    {stepStat === "pending" && <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-muted-foreground" /></div>}
                    {stepStat === "error" && <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center"><AlertCircle className="w-4 h-4 text-white" /></div>}
                    {i < BUILD_STEPS.length - 1 && <div className={`absolute left-1/2 top-full w-0.5 h-3 -translate-x-1/2 ${stepStat === "done" ? "bg-[#00F0A0]" : "bg-border"}`} />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${stepStat === "active" ? "text-primary" : ""}`}>{step.label}</p>
                    {stepStat === "active" && <p className="text-xs text-muted-foreground">{elapsedTime.toFixed(1)}s...</p>}
                    {stepStat === "done" && stepOutputs[i + 1] && <p className="text-xs text-[#00F0A0] truncate">{stepOutputs[i + 1].substring(0, 40)}...</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live output / Quiz */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 4: Skill Verification Quiz */}
            {phase === "verifying" && (
              <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1">
                <div className="bg-card border border-border rounded-2xl p-6 max-w-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h2 className="text-lg font-bold">Quick check — 60 seconds</h2>
                      <p className="text-xs text-muted-foreground">We verify creators so buyers trust your product.</p>
                    </div>
                  </div>

                  {quizLoading ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3, 4].map(i => <div key={i} className={`h-${i === 1 ? "5" : "10"} rounded-lg bg-muted/30 animate-pulse`} />)}
                    </div>
                  ) : quizScore !== null ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                      {quizScore >= 2 ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-[#00F0A0]/20 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-7 h-7 text-[#00F0A0]" /></div>
                          <h3 className="text-xl font-bold mb-1">Verified Expert!</h3>
                          <p className="text-muted-foreground text-sm mb-4">You scored {quizScore}/3. Building your product now...</p>
                          <Button onClick={() => runPhase2(quizScore)} className="rounded-full gap-2">Continue building <ArrowRight className="w-4 h-4" /></Button>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-7 h-7 text-yellow-400" /></div>
                          <h3 className="text-xl font-bold mb-1">Score: {quizScore}/3</h3>
                          <p className="text-muted-foreground text-sm mb-2">Want to tweak your skill description? We'll adjust it to match your actual expertise level.</p>
                          <p className="text-xs text-muted-foreground mb-4">Or continue anyway — your product will get a "New Creator" badge.</p>
                          <div className="flex gap-2 justify-center">
                            <Button variant="outline" className="rounded-full text-sm" onClick={() => { setPhase("onboarding"); setScreen(1); }}>Edit skill</Button>
                            <Button className="rounded-full text-sm" onClick={() => runPhase2(quizScore)}>Continue anyway</Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : quizQuestions.length > 0 ? (
                    <>
                      <div className="flex gap-1 mb-4">
                        {quizQuestions.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < currentQuizQ ? "bg-[#00F0A0]" : i === currentQuizQ ? "bg-primary" : "bg-muted"}`} />)}
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div key={currentQuizQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Question {currentQuizQ + 1} of {quizQuestions.length}</p>
                          <h3 className="text-base font-semibold mb-4">{quizQuestions[currentQuizQ].question}</h3>
                          <div className="space-y-2">
                            {quizQuestions[currentQuizQ].options.map((opt, i) => {
                              const answered = quizAnswers[currentQuizQ];
                              const isSelected = answered === opt;
                              const isCorrect = opt.charAt(0) === quizQuestions[currentQuizQ].correct;
                              return (
                                <button
                                  key={i}
                                  onClick={() => !answered && handleQuizAnswer(opt, i)}
                                  disabled={!!answered}
                                  className={`w-full text-left p-3 rounded-xl border text-sm font-medium transition-all ${answered ? (isSelected ? (isCorrect ? "border-[#00F0A0] bg-[#00F0A0]/10 text-[#00F0A0]" : "border-red-500 bg-red-500/10 text-red-400") : (isCorrect ? "border-[#00F0A0]/50 bg-[#00F0A0]/5" : "border-border opacity-50")) : "border-border hover:border-primary hover:bg-primary/5"}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground text-sm mb-4">Preparing verification questions...</p>
                      <Button onClick={() => runPhase2(3)} className="rounded-full">Skip verification</Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Building output panel */}
            {phase === "building" && (
              <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Output</p>
                  {phase === "building" && <div className="w-1.5 h-1.5 rounded-full bg-[#00F0A0] animate-pulse" />}
                </div>
                <div
                  ref={outputPanelRef}
                  className="flex-1 bg-[#0A0A17] border border-border/50 rounded-2xl p-5 overflow-y-auto min-h-[300px] max-h-[calc(100vh-12rem)]"
                  style={{ fontFamily: "'Fira Code', 'Courier New', monospace" }}
                >
                  {errorMessage ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{errorMessage}</span>
                    </div>
                  ) : (
                    Object.entries(stepOutputs).map(([stepNum, output]) => (
                      <div key={stepNum} className="mb-4">
                        <p className="text-xs text-primary/60 mb-1">// Step {stepNum}: {BUILD_STEPS[Number(stepNum) - 1]?.label}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{output.substring(0, 600)}{output.length > 600 ? "..." : ""}</p>
                      </div>
                    ))
                  )}
                  {phase === "building" && !errorMessage && (
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // PHASE: CELEBRATION
  // ══════════════════════════════════════════════════════
  if (phase === "celebration") {
    const pageUrl = getShareUrl();
    const productName = finalProduct?.productName || productNameBuilt || "Your Product";
    const productTagline = finalProduct?.tagline || "";

    const shareLinks = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just built "${productName}" on @Zniche! ${productTagline}`)}&url=${encodeURIComponent(pageUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Hey! I just launched something — "${productName}". ${productTagline} Check it out: ${pageUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    };

    return (
      <div className="min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-[#00F0A0]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#00F0A0]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] mb-2">You're live! 🎉</h1>
            <p className="text-muted-foreground">"{productName}" is now on the Zniche marketplace.</p>
          </motion.div>

          <div className="space-y-4">
            {/* Card 1: Live page */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Your live page</h3>
              <p className="text-sm text-muted-foreground font-mono mb-3 break-all">{pageUrl}</p>
              {finalProduct && (
                <div className="mb-3">
                  <ErrorBoundary>
                    <ProductCover3D productName={productName} category={finalProduct.category || "Other"} className="w-40 h-28 mx-auto" />
                  </ErrorBoundary>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full flex-1 gap-2" onClick={() => copyToClipboard(pageUrl)}><Copy className="w-4 h-4" /> Copy link</Button>
                <Button className="rounded-full flex-1 gap-2" onClick={() => window.open(pageUrl, "_blank")}><ExternalLink className="w-4 h-4" /> Open page</Button>
              </div>
            </motion.div>

            {/* Card 2: Share */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Share & get buyers</h3>
              <div className="grid grid-cols-3 gap-2">
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:bg-blue-600/10 hover:border-blue-500 transition-colors text-sm font-medium">
                  <Linkedin className="w-4 h-4 text-blue-400" /> LinkedIn
                </a>
                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:bg-green-600/10 hover:border-green-500 transition-colors text-sm font-medium">
                  <MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp
                </a>
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:bg-sky-600/10 hover:border-sky-500 transition-colors text-sm font-medium">
                  <Twitter className="w-4 h-4 text-sky-400" /> Twitter
                </a>
              </div>
            </motion.div>

            {/* Card 3: Launch Kit */}
            {(parsedLaunchKit.linkedin || parsedLaunchKit.twitter || parsedLaunchKit.whatsapp) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Launch kit</h3>
                <div className="flex gap-2 mb-4 border-b border-border pb-3">
                  {(["linkedin", "twitter", "whatsapp", "email"] as const).filter(t => parsedLaunchKit[t] || parsedLaunchKit.email_subject).map(tab => (
                    <button key={tab} onClick={() => setLaunchKitTab(tab as any)} className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${launchKitTab === tab ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                      {tab === "email" ? "Email" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pr-8">
                    {launchKitTab === "email" ? `Subject: ${parsedLaunchKit.email_subject || ""}\n\n${parsedLaunchKit.email_body || ""}` : parsedLaunchKit[launchKitTab] || ""}
                  </p>
                  <button
                    onClick={() => copyToClipboard(launchKitTab === "email" ? `Subject: ${parsedLaunchKit.email_subject || ""}\n\n${parsedLaunchKit.email_body || ""}` : parsedLaunchKit[launchKitTab] || "")}
                    className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center pt-2">
              <Link href="/marketplace">
                <Button variant="outline" className="rounded-full gap-2">See your product in the marketplace <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
