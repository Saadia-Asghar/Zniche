import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Lightbulb, Pen, Shield, MessageCircle, Image, CreditCard, Globe,
  CheckCircle2, ArrowRight, Play, Pause, SkipForward, Volume2, VolumeX,
  GraduationCap, Sparkles, Star, ExternalLink, ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCover3D } from "@/components/product-cover-3d";
import confetti from "canvas-confetti";

// ─── Demo configuration ───────────────────────────────────────────────────

const DEMO_CREATOR = {
  role: "Chef & Food",
  roleIcon: ChefHat,
  skill: "Pakistani cooking for diaspora families who miss home-cooked flavors",
  audience: "Pakistani diaspora families — They miss authentic home flavors but struggle with finding the right ingredients abroad",
  experience: "Very experienced (6–10 years)",
  format: "Video Course",
  price: 47,
};

const DEMO_BUILD_STEPS = [
  {
    icon: Search,
    label: "Market Intelligence",
    narration: "Scanning market demand for Pakistani cooking courses... Found 47,200 monthly searches with growing interest in diaspora food culture.",
    output: "🔍 Market Report: \"Pakistani cooking\" has 47,200 monthly searches. Top competitors charge $29–$89. Gap identified: No courses specifically for diaspora families adapting recipes to local ingredients.",
    duration: 3500,
  },
  {
    icon: Lightbulb,
    label: "Buyer Psychology",
    narration: "Analyzing buyer psychology... Your ideal customer is nostalgic for home flavors and willing to pay premium for authentic guidance.",
    output: "🧠 Buyer Persona: 28–45 year old Pakistani diaspora, living in UK/US/Canada. Pain: \"My biryani never tastes like ammi's.\" Willingness to pay: High ($40–$80) for authentic, step-by-step guidance.",
    duration: 3000,
  },
  {
    icon: Pen,
    label: "Product Architecture",
    narration: "Designing your micro-product... Creating a 12-module video course with downloadable recipe cards.",
    output: "📦 Product: \"Ammi's Kitchen: Authentic Pakistani Cooking Masterclass\"\n12 video modules • Downloadable recipe cards • Ingredient substitution guide • Private WhatsApp group access",
    duration: 2500,
  },
  {
    icon: Shield,
    label: "Expertise Verification",
    narration: "Verifying expertise... You scored 3 out of 3. Verified Expert badge earned!",
    output: "✅ Skill Verification: PASSED (3/3)\nQ1: What gives biryani its distinctive aroma? ✓ Correct\nQ2: How do you properly layer dum biryani? ✓ Correct\nQ3: What's the key to perfect nihari? ✓ Correct",
    duration: 2000,
  },
  {
    icon: MessageCircle,
    label: "Sales Page Copy",
    narration: "Writing conversion-optimized sales copy... Headline: Stop Googling recipes that don't taste like home.",
    output: "✍️ Sales Copy Generated:\nHeadline: \"Stop Googling Recipes That Don't Taste Like Home\"\nSubhead: \"12 authentic Pakistani recipes, taught by a chef with 8 years of experience, adapted for ingredients you can find at your local supermarket.\"\nCTA: \"Start Cooking Like Ammi → $47\"",
    duration: 3000,
  },
  {
    icon: Image,
    label: "Visual Build",
    narration: "Assembling your live sales page with trust badges, buyer reviews, and money-back guarantee...",
    output: "🎨 Page Built:\n• Hero section with product cover\n• Feature breakdown with icons\n• 3 trust badges (Verified Creator, Money-Back, Secure Payment)\n• FAQ section (5 questions)\n• WhatsApp chat widget enabled",
    duration: 2000,
  },
  {
    icon: CreditCard,
    label: "Stripe Checkout",
    narration: "Setting up your Stripe payment link... Buyers can pay with card, Apple Pay, or Google Pay.",
    output: "💳 Stripe Checkout Created:\n• Price: $47 USD (PPP: PKR 2,800 in Pakistan, £38 in UK)\n• Payment methods: Card, Apple Pay, Google Pay\n• Instant digital delivery on purchase\n• Your earnings per sale: $44.65 (95%)",
    duration: 1500,
  },
  {
    icon: Globe,
    label: "Launch Kit",
    narration: "Publishing to marketplace and generating your social media starter pack. You're live!",
    output: "🚀 PUBLISHED!\n• Marketplace listing: LIVE\n• Social captions generated for LinkedIn, Twitter, WhatsApp\n• Shareable link: zniche.com/product/ammis-kitchen\n• WhatsApp auto-replies: ACTIVE\n• Google Calendar booking: ENABLED",
    duration: 2000,
  },
];

const DEMO_PRODUCT_PREVIEW = {
  name: "Ammi's Kitchen: Pakistani Cooking Masterclass",
  tagline: "Stop Googling recipes that don't taste like home",
  price: "$47",
  pppPrice: "PKR 2,800",
  category: "Food & Cooking",
  format: "Video Course",
  features: [
    "12 authentic recipe video modules",
    "Downloadable recipe cards (PDF)",
    "Ingredient substitution guide for abroad",
    "Private WhatsApp community access",
    "Lifetime updates + new recipes monthly",
  ],
  stats: { searches: "47.2K", competitors: 12, avgPrice: "$59" },
};

// ─── Voice Narration Hook ─────────────────────────────────────────────────

function useVoiceNarration() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => { synthRef.current?.cancel(); };
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    // Try to find a natural-sounding voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel")
    ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) synthRef.current?.cancel();
      return !prev;
    });
  }, []);

  return { speak, stop, isSpeaking, voiceEnabled, toggleVoice };
}

// ─── Component ────────────────────────────────────────────────────────────

type DemoPhase = "intro" | "onboarding" | "building" | "celebration";

export default function Demo() {
  const [phase, setPhase] = useState<DemoPhase>("intro");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [buildStep, setBuildStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentOutput, setCurrentOutput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x
  const timerRef = useRef<any>(null);
  const { speak, stop, isSpeaking, voiceEnabled, toggleVoice } = useVoiceNarration();

  const totalSteps = DEMO_BUILD_STEPS.length;
  const progressPct = phase === "celebration" ? 100 : (completedSteps.length / totalSteps) * 100;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  // Cleanup on unmount
  useEffect(() => {
    return () => { clearTimeout(timerRef.current); stop(); };
  }, []);

  // ── Auto-play engine ──
  const runOnboarding = useCallback(() => {
    setPhase("onboarding");
    setIsPlaying(true);
    speak("Let's watch Zniche build a product from scratch. Our creator is a Pakistani cooking expert.");

    const steps = [
      { delay: 2500, action: () => setOnboardingStep(1) },
      { delay: 2000, action: () => { setOnboardingStep(2); speak("They teach authentic home recipes to diaspora families."); } },
      { delay: 2500, action: () => setOnboardingStep(3) },
      { delay: 2000, action: () => { setOnboardingStep(4); speak("6 to 10 years of experience. AI recommends a video course at 47 dollars."); } },
      { delay: 3000, action: () => startBuildPhase() },
    ];

    let elapsed = 0;
    steps.forEach((step) => {
      elapsed += step.delay / speed;
      timerRef.current = setTimeout(step.action, elapsed);
    });
  }, [speak, speed]);

  const startBuildPhase = useCallback(() => {
    setPhase("building");
    setBuildStep(0);
    setCompletedSteps([]);
    setCurrentOutput("");

    let elapsed = 0;
    DEMO_BUILD_STEPS.forEach((step, i) => {
      // Start step
      timerRef.current = setTimeout(() => {
        setBuildStep(i);
        setCurrentOutput("");
        speak(step.narration);

        // Typewriter effect for output
        let charIdx = 0;
        const typeInterval = setInterval(() => {
          charIdx += 3;
          setCurrentOutput(step.output.substring(0, charIdx));
          if (charIdx >= step.output.length) clearInterval(typeInterval);
        }, 20 / speed);
      }, elapsed);

      // Complete step
      elapsed += step.duration / speed;
      timerRef.current = setTimeout(() => {
        setCompletedSteps(prev => [...prev, i]);
        // Mini confetti on each step
        confetti({ particleCount: 12, spread: 35, origin: { x: 0.15, y: 0.5 }, colors: ["#5B2EFF", "#00F0A0"], scalar: 0.5, ticks: 40 });
      }, elapsed);
    });

    // Celebration
    elapsed += 500;
    timerRef.current = setTimeout(() => {
      setPhase("celebration");
      setIsPlaying(false);
      speak("Done! In under 2 minutes, Zniche created a complete product with payments, marketplace listing, WhatsApp messaging, and calendar booking. All powered by AI.");
      // Big confetti
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#5B2EFF", "#00F0A0", "#FF5A70"] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#5B2EFF", "#00F0A0", "#FF5A70"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.4 }, colors: ["#5B2EFF", "#00F0A0", "#FFD700"] }), 500);
    }, elapsed);
  }, [speak, speed]);

  const handleStart = () => {
    runOnboarding();
  };

  const handleSkip = () => {
    clearTimeout(timerRef.current);
    stop();
    setPhase("celebration");
    setCompletedSteps(DEMO_BUILD_STEPS.map((_, i) => i));
    setBuildStep(totalSteps - 1);
    setIsPlaying(false);
  };

  // ══════════════════════════════════════════════════════
  // INTRO SCREEN
  // ══════════════════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div className="fixed inset-0 bg-[#08080F] flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-morph-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00F0A0]/8 rounded-full blur-[100px] animate-morph-blob-alt" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-2xl px-6"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-[#00F0A0] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] mb-4">
            Watch Zniche Build a Product
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#00F0A0] to-primary"> in Real Time</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-3 max-w-lg mx-auto">
            See how AI turns a cooking skill into a complete business — with payments, marketplace listing, and client tools — in under 2 minutes.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-8">
            <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Voice narration</span>
            <span>•</span>
            <span>~90 seconds</span>
            <span>•</span>
            <span>No signup needed</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={handleStart}
              size="lg"
              className="rounded-full h-14 px-10 text-lg gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-shadow magnetic-btn"
            >
              <Play className="w-5 h-5" /> Start Demo
            </Button>

            <button
              onClick={toggleVoice}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-colors"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {voiceEnabled ? "Voice On" : "Voice Off"}
            </button>
          </div>

          <p className="text-xs text-muted-foreground/50 mt-6">
            Built on Replit with Claude AI • React • Express 5 • Drizzle ORM • Stripe
          </p>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // ONBOARDING AUTO-PLAY
  // ══════════════════════════════════════════════════════
  if (phase === "onboarding") {
    const onboardingScreens = [
      { title: "What best describes you?", value: DEMO_CREATOR.role, sub: "Chef & food expert" },
      { title: "What do people come to you for?", value: DEMO_CREATOR.skill, sub: "Specific skill description" },
      { title: "Who would benefit most?", value: DEMO_CREATOR.audience, sub: "Target audience identified" },
      { title: "How long have you been doing this?", value: DEMO_CREATOR.experience, sub: "6–10 years experience" },
      { title: "Product format & price", value: `${DEMO_CREATOR.format} — $${DEMO_CREATOR.price}`, sub: "AI recommended" },
    ];

    return (
      <div className="fixed inset-0 bg-[#08080F] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#00F0A0] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Demo Mode — Onboarding</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleVoice} className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={handleSkip} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20">
              <SkipForward className="w-3 h-3" /> Skip
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-6">
          {onboardingScreens.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-500 ${i === onboardingStep ? "w-6 h-2 bg-primary" : i < onboardingStep ? "w-2 h-2 bg-primary/60" : "w-2 h-2 bg-white/20"}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={onboardingStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="max-w-lg w-full text-center"
            >
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-[-0.03em] mb-6">
                {onboardingScreens[onboardingStep]?.title}
              </h2>

              <div className="bg-[#0E0E1C] border-2 border-primary rounded-2xl p-5 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-left text-sm font-medium">
                    {onboardingScreens[onboardingStep]?.value}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                {onboardingScreens[onboardingStep]?.sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // BUILD PHASE
  // ══════════════════════════════════════════════════════
  if (phase === "building") {
    return (
      <div className="fixed inset-0 bg-[#08080F] flex flex-col lg:flex-row">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00F0A0] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Building...</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleVoice} className="p-1.5 rounded text-muted-foreground hover:text-foreground">
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button onClick={handleSkip} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-muted-foreground border border-white/10">
              <SkipForward className="w-3 h-3" /> Skip
            </button>
          </div>
        </div>

        {/* Left: Timeline */}
        <div className="w-full lg:w-80 xl:w-96 border-r border-white/5 bg-[#0A0A14] p-6 lg:p-8 flex-shrink-0">
          <div className="hidden lg:flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00F0A0] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Demo Mode</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleVoice} className="p-1.5 rounded text-muted-foreground hover:text-foreground">
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button onClick={handleSkip} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-muted-foreground border border-white/10 hover:border-white/20">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Build Progress</p>
              <p className="text-sm font-medium text-primary mt-1 truncate">{DEMO_PRODUCT_PREVIEW.name}</p>
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
            {DEMO_BUILD_STEPS.map((step, i) => {
              const isDone = completedSteps.includes(i);
              const isActive = buildStep === i && !isDone;
              const isPending = buildStep < i;
              const Icon = step.icon;
              return (
                <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-300 ${isActive ? "bg-primary/10" : ""} ${isPending ? "opacity-35" : ""}`}>
                  <div className="relative flex-shrink-0">
                    {isDone && <div className="w-8 h-8 rounded-full bg-[#00F0A0] flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-black" /></div>}
                    {isActive && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse"><Icon className="w-4 h-4 text-white" /></div>}
                    {isPending && <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-muted-foreground" /></div>}
                    {i < totalSteps - 1 && <div className={`absolute left-1/2 top-full w-0.5 h-3 -translate-x-1/2 ${isDone ? "bg-[#00F0A0]" : "bg-white/10"}`} />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>{step.label}</p>
                    {isActive && <p className="text-xs text-muted-foreground animate-pulse">Processing...</p>}
                    {isDone && <p className="text-xs text-[#00F0A0]">✓ Complete</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live output + Product preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Output panel */}
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={buildStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {buildStep >= 0 && (
                  <div className="bg-[#0E0E1C] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {(() => { const Icon = DEMO_BUILD_STEPS[buildStep]?.icon || Search; return <Icon className="w-4 h-4 text-primary" />; })()}
                      <h3 className="text-sm font-semibold">{DEMO_BUILD_STEPS[buildStep]?.label}</h3>
                      {completedSteps.includes(buildStep) && <CheckCircle2 className="w-4 h-4 text-[#00F0A0] ml-auto" />}
                    </div>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {currentOutput}
                      {!completedSteps.includes(buildStep) && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
                    </pre>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Voice indicator */}
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mt-4 text-xs text-primary"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-0.5 bg-primary rounded-full" style={{
                      height: `${8 + Math.random() * 8}px`,
                      animation: `pulse ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
                    }} />
                  ))}
                </div>
                AI Narrating...
              </motion.div>
            )}
          </div>

          {/* Product preview (desktop) */}
          <div className="hidden xl:block w-80 border-l border-white/5 bg-[#0A0A14] p-6 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Live Preview</p>

            <motion.div
              animate={{ opacity: completedSteps.length >= 3 ? 1 : 0.3 }}
              className="space-y-4"
            >
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/10 flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-orange-400/50" />
              </div>

              <div>
                <h4 className="text-sm font-bold leading-tight">{DEMO_PRODUCT_PREVIEW.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{DEMO_PRODUCT_PREVIEW.tagline}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{DEMO_PRODUCT_PREVIEW.price}</span>
                <span className="text-xs text-muted-foreground">USD</span>
              </div>

              {completedSteps.length >= 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                  {DEMO_PRODUCT_PREVIEW.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-[#00F0A0] mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {completedSteps.length >= 7 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button className="w-full py-2.5 rounded-full bg-primary text-white text-sm font-semibold">
                    Buy Now — {DEMO_PRODUCT_PREVIEW.price}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // CELEBRATION
  // ══════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-[#08080F] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-morph-blob" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#00F0A0]/8 rounded-full blur-[120px] animate-morph-blob-alt" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 text-center max-w-2xl px-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00F0A0] to-primary flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#00F0A0]/30">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] mb-3">
          Product Built! 🎉
        </h1>

        <p className="text-lg text-muted-foreground mb-2">
          <strong className="text-foreground">{DEMO_PRODUCT_PREVIEW.name}</strong>
        </p>
        <p className="text-muted-foreground mb-6">
          Complete business created in under 2 minutes — with AI-powered market research, sales copy, Stripe payments, WhatsApp messaging, and Google Calendar booking.
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {[
            { label: "Market Demand", value: DEMO_PRODUCT_PREVIEW.stats.searches, sub: "monthly searches" },
            { label: "Competitors", value: DEMO_PRODUCT_PREVIEW.stats.competitors, sub: "in this niche" },
            { label: "Price Point", value: DEMO_PRODUCT_PREVIEW.price, sub: "AI optimized" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* What was created */}
        <div className="glass-card rounded-2xl p-5 mb-6 text-left max-w-md mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">What AI Created</p>
          {[
            "Market research report",
            "Buyer psychology analysis",
            "Product concept & architecture",
            "Skill verification (3/3 passed)",
            "Conversion-optimized sales page",
            "Stripe payment checkout",
            "WhatsApp auto-reply chatbot",
            "Google Calendar booking",
            "Social media launch kit",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0A0] flex-shrink-0" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/build">
            <Button size="lg" className="rounded-full h-14 px-8 text-lg gap-2 shadow-xl shadow-primary/20 magnetic-btn">
              <Sparkles className="w-5 h-5" /> Build Your Own — Free
            </Button>
          </a>
          <a href="/marketplace">
            <Button variant="outline" size="lg" className="rounded-full h-12 px-6 gap-2">
              <ExternalLink className="w-4 h-4" /> Browse Marketplace
            </Button>
          </a>
        </div>

        <p className="text-xs text-muted-foreground/50 mt-6">
          No credit card needed • No monthly fees • Keep 95% of every sale
        </p>
      </motion.div>
    </div>
  );
}
