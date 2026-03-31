import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Globe, Banknote, Search, Lightbulb, Pen, CreditCard, Share2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetMarketplaceListings } from "@workspace/api-client-react";
import { ProductCover3D } from "@/components/product-cover-3d";
import { useState, useEffect } from "react";

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
    <div className="bg-card border border-border/50 rounded-2xl p-5 w-full max-w-sm shadow-xl">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">Live Build Feed</p>
      <div className="space-y-3">
        {FEED_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <div
              key={i}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

export default function Home() {
  const { data: listings = [] } = useGetMarketplaceListings();
  const previewListings = listings.slice(0, 6);

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <section className="relative pt-24 pb-16 md:pt-36 md:pb-28 overflow-hidden px-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col"
            >
              <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Skill &rarr; Product &rarr; Income
              </motion.p>

              <motion.h1 
                variants={fadeUp}
                className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] mb-6 leading-[1.1]"
              >
                Turn what you know<br />
                into what you earn.
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-3">
                No website. No agency. No months of work. AI builds your product, page, and payment in 20 minutes &mdash; live, in front of you.
              </motion.p>

              <motion.div variants={fadeUp} className="text-xl md:text-2xl font-semibold mb-8">
                I am a <TypewriterText />
              </motion.div>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Link href="/build">
                  <Button size="lg" className="h-13 px-8 text-base rounded-full shadow-lg hover:shadow-primary/25 transition-all" data-testid="hero-start-building">
                    Start building free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="outline" className="h-13 px-8 text-base rounded-full" data-testid="hero-view-marketplace">
                    Browse marketplace
                  </Button>
                </Link>
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

      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-3">Three steps. Twenty minutes.</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From idea to income in one sitting.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-7 h-7" />,
                color: "text-primary bg-primary/10",
                title: "Describe your skill",
                desc: "Tell us what you know in one sentence. Set your hours and price."
              },
              {
                icon: <Globe className="w-7 h-7" />,
                color: "text-neon-mint bg-neon-mint/10",
                title: "Watch AI build it live",
                desc: "Our engine researches the market, writes copy, and builds your sales page."
              },
              {
                icon: <Banknote className="w-7 h-7" />,
                color: "text-green-400 bg-green-500/10",
                title: "Launch & earn",
                desc: "Get a Stripe checkout link and marketplace listing instantly."
              }
            ].map((step, i) => (
              <Card key={i} className="border-border/30 bg-card/50 backdrop-blur hover:border-primary/20 transition-all group">
                <CardContent className="pt-7 pb-6 flex flex-col items-center text-center">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-5 ${step.color}`}>
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
              previewListings.map(listing => (
                <Card key={listing.id} className="overflow-hidden group hover:border-primary/30 transition-all cursor-pointer border-border/30">
                  <Link href={`/product/${listing.id}`}>
                    <CardContent className="p-0">
                      <div className="flex items-center justify-center py-3 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
                        <ProductCover3D
                          productName={listing.productName || "Product"}
                          category={listing.category}
                          width={200}
                          height={140}
                        />
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
    </div>
  );
}
