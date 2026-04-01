import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Zap, Globe, Banknote, Search, Lightbulb, Pen, CreditCard, Share2, CheckCircle2, Star, ChevronLeft, ChevronRight, MessageCircle, Calendar, FileText, Check, X, Shield, Rocket, Clock, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetMarketplaceListings } from "@workspace/api-client-react";
import { ProductCover3D } from "@/components/product-cover-3d";
import { ErrorBoundary } from "@/components/error-boundary";
import { ParticleBackground } from "@/components/particle-background";
import { RippleButton } from "@/components/ripple-button";
import { SocialProofTicker } from "@/components/social-proof-ticker";
import { useState, useEffect, useRef } from "react";

const SKILL_EXAMPLES = [
  "Arabic tutor",
  "Excel expert",
  "Fitness coach",
  "Home cook",
  "Web designer",
  "Resume writer",
  "Guitar teacher",
  "Math tutor",
];

function TypewriterText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = SKILL_EXAMPLES[currentIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText === current) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % SKILL_EXAMPLES.length);
    } else if (isDeleting) {
      timeout = setTimeout(() => setDisplayText(current.slice(0, displayText.length - 1)), 40);
    } else {
      timeout = setTimeout(() => setDisplayText(current.slice(0, displayText.length + 1)), 80);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="text-neon-mint">
      {displayText}
      <span className="inline-block w-[3px] h-[1em] bg-neon-mint ml-1 align-middle" style={{ animation: "typewriter-blink 0.8s step-end infinite" }} />
    </span>
  );
}

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const FEED_STEPS = [
  { icon: Search, label: "Market demand scan", status: "done" as const },
  { icon: Lightbulb, label: "Product concept...", status: "live" as const },
  { icon: Pen, label: "Sales page build", status: "pending" as const },
  { icon: CreditCard, label: "Stripe checkout link", status: "pending" as const },
  { icon: Share2, label: "Social captions", status: "pending" as const },
  { icon: Globe, label: "Marketplace publish", status: "pending" as const },
];

function MiniBuildFeed() {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FEED_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card rounded-2xl p-5 w-full max-w-sm shadow-xl glow-pulse">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">Live Build Feed</p>
      <div className="space-y-3">
        {FEED_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={isActive ? { scale: 1.02, x: 4 } : { scale: 1, x: 0 }}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 ${
                isActive ? "bg-primary/10 border border-primary/20" : isDone ? "opacity-80" : "opacity-40"
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDone ? "bg-neon-mint text-black" : isActive ? "bg-primary text-white animate-pulse-ring" : "bg-muted text-muted-foreground"
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-sm font-medium ${isDone || isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {isDone && <span className="ml-auto text-xs font-semibold text-neon-mint">done</span>}
              {isActive && <span className="ml-auto text-xs font-semibold text-primary">live</span>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Fitness Coach", text: "Built my meal plan product in 15 minutes. Made my first sale the same day.", rating: 5 },
  { name: "Marcus T.", role: "Excel Tutor", text: "I was skeptical, but the AI nailed my sales page. Way better than I could write.", rating: 5 },
  { name: "Priya D.", role: "Designer", text: "The verification quiz was surprisingly smart. Felt like the platform actually cares about quality.", rating: 5 },
  { name: "Alex R.", role: "Business Coach", text: "The WhatsApp integration lets me talk to clients directly. Way better than email.", rating: 5 },
  { name: "Luna M.", role: "Language Tutor", text: "Google Calendar scheduling saved me hours. My students book sessions themselves!", rating: 5 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

function TestimonialsCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 px-4 border-t border-border/30">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-3">Loved by creators</h2>
          <p className="text-muted-foreground text-lg">Join hundreds of experts already earning with Zniche.</p>
        </div>
        <div className="relative overflow-hidden">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="flex justify-center gap-0.5 mb-5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-5 h-5 ${s <= TESTIMONIALS[active].rating ? "fill-accent text-accent" : "text-muted-foreground/20"}`} />
                ))}
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
                "{TESTIMONIALS[active].text}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {TESTIMONIALS[active].name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{TESTIMONIALS[active].name}</p>
                  <p className="text-xs text-muted-foreground">{TESTIMONIALS[active].role}</p>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setActive((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === active ? "bg-primary w-6" : "bg-muted-foreground/30"}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActive((prev) => (prev + 1) % TESTIMONIALS.length)}
              className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Why Zniche Section (Competitive Comparison) ── */
function WhyZnicheSection() {
  const COMPARISON = [
    { feature: "Time to revenue", zniche: "20 minutes", others: "Days to weeks", znicheWin: true },
    { feature: "AI skill verification", zniche: true, others: false, znicheWin: true },
    { feature: "Built-in marketplace", zniche: true, others: false, znicheWin: true },
    { feature: "WhatsApp messaging", zniche: true, others: false, znicheWin: true },
    { feature: "Meeting scheduler", zniche: true, others: false, znicheWin: true },
    { feature: "PPP pricing", zniche: true, others: false, znicheWin: true },
    { feature: "Monthly hosting fees", zniche: false, others: true, znicheWin: true },
    { feature: "Code/design required", zniche: false, others: true, znicheWin: true },
  ];

  return (
    <section className="py-20 px-4 border-t border-border/30 aurora-bg relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-[5%] w-64 h-64 bg-primary/5 rounded-full blur-3xl morph-blob" />
      <div className="absolute bottom-10 right-[5%] w-48 h-48 bg-accent/5 rounded-full blur-3xl morph-blob-fast" />
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 bg-card/50 border border-border/50 rounded-full px-4 py-2">
            <Rocket className="w-3 h-3 text-primary" /> Why creators choose Zniche
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.04em] mb-4">
            Not another <span className="gradient-text-animated">website builder</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Hostinger, Wix, and Squarespace build websites. Zniche builds your <strong className="text-foreground">business</strong> — from market research to first sale, in 20 minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <table className="comparison-table w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-4 px-6">Feature</th>
                <th className="py-4 px-6 text-center">
                  <span className="gradient-text font-bold text-sm">Zniche</span>
                </th>
                <th className="py-4 px-6 text-center text-xs">Hostinger / Wix / Others</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <td className="py-3 px-6 text-sm font-medium">{row.feature}</td>
                  <td className="py-3 px-6 text-center">
                    {typeof row.zniche === "boolean" ? (
                      row.zniche ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/10"><Check className="w-4 h-4 text-accent" /></span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10"><X className="w-4 h-4 text-destructive" /></span>
                      )
                    ) : (
                      <span className="text-sm font-semibold text-accent">{row.zniche}</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {typeof row.others === "boolean" ? (
                      row.others ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/10"><Check className="w-4 h-4 text-accent" /></span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10"><X className="w-4 h-4 text-destructive" /></span>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">{row.others}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

/* ── New Features Showcase ── */
function FeaturesShowcase() {
  const FEATURES = [
    {
      icon: MessageCircle,
      title: "WhatsApp Client Agent",
      desc: "Built-in WhatsApp chat on every product page. Auto-replies powered by AI. Never miss a client message.",
      color: "from-[#25D366] to-[#128C7E]",
      iconColor: "text-[#25D366]",
    },
    {
      icon: Calendar,
      title: "Google Calendar Meetings",
      desc: "Let clients book sessions directly. One-click Google Calendar integration with automated scheduling.",
      color: "from-[#4285F4] to-[#0D47A1]",
      iconColor: "text-[#4285F4]",
    },
    {
      icon: FileText,
      title: "Meeting Notes",
      desc: "Keep track of every client session. Write, edit, and organize meeting notes right in your dashboard.",
      color: "from-primary to-[#8B6FFF]",
      iconColor: "text-primary",
    },
    {
      icon: Brain,
      title: "AI Business Coach",
      desc: "Claude-powered coaching right in your dashboard. Get advice on pricing, marketing, and growth strategies.",
      color: "from-accent to-[#00C080]",
      iconColor: "text-accent",
    },
    {
      icon: Shield,
      title: "Skill Verification",
      desc: "AI-generated quiz proves your expertise. Get a verified badge that builds buyer trust.",
      color: "from-[#FF5A70] to-[#FF8FA0]",
      iconColor: "text-zniche-red",
    },
    {
      icon: Globe,
      title: "Global PPP Pricing",
      desc: "Auto-detect buyer location. Adjust pricing for 30+ countries with purchasing power parity.",
      color: "from-[#0099FF] to-[#33BBFF]",
      iconColor: "text-blue-400",
    },
  ];

  return (
    <section className="py-20 px-4 border-t border-border/30 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-3">
            Everything you need. <span className="gradient-text">Nothing you don't.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built-in tools that other platforms charge extra for.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="glass-card h-full group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardContent className="pt-7 pb-6 px-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${feature.color} bg-opacity-10 flex items-center justify-center mb-5`}
                    style={{ background: `linear-gradient(135deg, hsl(var(--card)), hsl(var(--card)))` }}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: listings = [] } = useGetMarketplaceListings();
  const previewListings = listings.slice(0, 6);

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* ── HERO SECTION with Particles ── */}
      <section className="relative pt-24 pb-16 md:pt-36 md:pb-28 overflow-hidden px-4">
        <ParticleBackground particleCount={40} />
        
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
          {/* Morphing blobs */}
          <div className="absolute top-20 left-[10%] w-20 h-20 bg-primary/8 morph-blob opacity-20" />
          <div className="absolute top-40 right-[15%] w-16 h-16 bg-neon-mint/8 morph-blob-fast opacity-20" />
          <div className="absolute bottom-20 left-[20%] w-14 h-14 bg-zniche-red/8 morph-blob opacity-15" />
          {/* Orbiting dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-primary/20 orbit" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/20 orbit-reverse" />
          </div>
        </div>
        <div className="container relative z-10 mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 bg-card/50 border border-border/50 rounded-full px-4 py-2 w-fit">
                <span className="w-2 h-2 rounded-full bg-neon-mint notification-dot" />
                AI-powered skill monetization
              </motion.div>

              <motion.h1 
                variants={fadeUp}
                className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] mb-6 leading-[1.1]"
              >
                Turn what you know<br />
                into what you <span className="gradient-text-animated">earn</span>.
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-3 max-w-lg">
                No website. No agency. No months of work. AI builds your product, page, and payment in 20 minutes.
              </motion.p>

              <motion.div variants={fadeUp} className="text-xl md:text-2xl font-semibold mb-8">
                I am a <TypewriterText />
              </motion.div>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Link href="/build">
                  <RippleButton>
                    <Button size="lg" className="h-13 px-8 text-base rounded-full shadow-lg hover:shadow-primary/25 transition-all magnetic-btn btn-shine" data-testid="hero-start-building">
                      Start building free <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </RippleButton>
                </Link>
                <Link href="/demo">
                  <RippleButton>
                    <Button size="lg" variant="outline" className="h-13 px-8 text-base rounded-full magnetic-btn gap-2" data-testid="hero-watch-demo">
                      ▶ Watch demo (90s)
                    </Button>
                  </RippleButton>
                </Link>
                <Link href="/marketplace">
                  <RippleButton>
                    <Button size="lg" variant="ghost" className="h-13 px-6 text-base rounded-full" data-testid="hero-view-marketplace">
                      Browse marketplace
                    </Button>
                  </RippleButton>
                </Link>
              </motion.div>

              {/* V5: New feature pills */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-6">
                {[
                  { icon: MessageCircle, label: "WhatsApp Chat", color: "text-[#25D366]" },
                  { icon: Calendar, label: "Google Calendar", color: "text-[#4285F4]" },
                  { icon: Brain, label: "AI Coach", color: "text-primary" },
                ].map((pill, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-card/50 border border-border/30 rounded-full px-3 py-1.5">
                    <pill.icon className={`w-3 h-3 ${pill.color}`} />
                    {pill.label}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:flex justify-center"
            >
              <MiniBuildFeed />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF TICKER ── */}
      <SocialProofTicker variant="bar" />

      {/* ── STATS BAR ── */}
      <section className="py-4 border-t border-b border-border/30 bg-card/30">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-4 gap-6 py-4">
            {[
              { label: "Products Built", target: 1200, suffix: "+" },
              { label: "Creators", target: 500, suffix: "+" },
              { label: "Earned", target: 45, suffix: "K+", prefix: "$" },
              { label: "Countries", target: 30, suffix: "+" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-foreground">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} prefix={stat.prefix || ""} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 STEPS SECTION ── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-3">Three steps. Twenty minutes.</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From idea to income in one sitting.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-1/2 left-[33%] right-[33%] -translate-y-1/2 z-0">
              <div className="flex items-center justify-between px-4">
                <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-accent/40" />
                <ArrowRight className="w-4 h-4 text-accent/40 mx-1" />
                <div className="flex-1 h-px bg-gradient-to-r from-accent/40 to-green-400/40" />
              </div>
            </div>
            {[
              {
                icon: <Zap className="w-7 h-7" />,
                color: "text-primary bg-primary/10",
                title: "Describe your skill",
                desc: "Tell us what you know in one sentence. Set your hours and price.",
                step: "01"
              },
              {
                icon: <Globe className="w-7 h-7" />,
                color: "text-neon-mint bg-neon-mint/10",
                title: "Watch AI build it live",
                desc: "Our engine researches the market, writes copy, and builds your sales page.",
                step: "02"
              },
              {
                icon: <Banknote className="w-7 h-7" />,
                color: "text-green-400 bg-green-500/10",
                title: "Launch & earn",
                desc: "Get a Stripe checkout link and marketplace listing instantly.",
                step: "03"
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative z-10"
              >
                <Card className="glass-card h-full group hover:scale-[1.02] transition-all duration-300">
                  <CardContent className="pt-7 pb-6 flex flex-col items-center text-center relative">
                    <span className="absolute top-4 right-4 text-5xl font-extrabold text-muted-foreground/5">{step.step}</span>
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-5 ${step.color}`}>
                      {step.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-2 tracking-tight">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ZNICHE (Competitive Comparison) ── */}
      <WhyZnicheSection />

      {/* ── FEATURES SHOWCASE (V5 new features) ── */}
      <FeaturesShowcase />

      {/* ── LIVE PRODUCTS ── */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-2">Live on Zniche</h2>
              <p className="text-muted-foreground text-lg">Real products created by real experts.</p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" className="gap-2 group rounded-full">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {previewListings.length > 0 ? (
              previewListings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card className="glass-card overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300">
                    <Link href={`/product/${listing.id}`}>
                      <CardContent className="p-0">
                        <div className="flex items-center justify-center py-3 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
                          <ErrorBoundary>
                            <ProductCover3D
                              productName={listing.productName || "Product"}
                              category={listing.category}
                              width={200}
                              height={140}
                            />
                          </ErrorBoundary>
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                              {listing.category || 'Skill'}
                            </span>
                            <span className="font-bold text-lg">${listing.price}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {listing.headline || listing.productDescription || "An amazing micro-product."}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-xs font-bold text-primary">
                              {listing.creatorFirstName?.charAt(0) || "U"}
                            </div>
                            {listing.creatorFirstName || "Creator"}
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-2xl">
                <p className="text-lg font-medium mb-2">No products yet</p>
                <p className="text-sm">Be the first to build something amazing.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <TestimonialsCarousel />

      {/* ── BOTTOM CTA ── */}
      <section className="py-20 px-4 border-t border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg" />
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.04em] mb-4">Ready to turn your skill into income?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              It's free to start. No credit card required. Build your first product in under 20 minutes.
            </p>
            <Link href="/build">
              <RippleButton>
                <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all magnetic-btn btn-shine">
                  Start building now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </RippleButton>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
