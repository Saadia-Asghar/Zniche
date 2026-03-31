import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, AlertCircle, RefreshCcw, ArrowRight, Search, Lightbulb, Pen, Image, CreditCard, Globe, X, Shield, MessageCircle, Twitter, Linkedin } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { useCreateProduct, useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ProductCover3D } from "@/components/product-cover-3d";
import { ErrorBoundary } from "@/components/error-boundary";

const formSchema = z.object({
  skill: z.string().min(10, "Please provide more detail about your skill."),
  hoursPerWeek: z.coerce.number().min(1).max(20),
  price: z.coerce.number().min(5).max(500),
});

type FormValues = z.infer<typeof formSchema>;

const BUILD_STEPS = [
  { icon: Search, label: "Scanning market demand", description: "Researching demand and pricing for your skill" },
  { icon: Lightbulb, label: "Designing your product", description: "Creating a unique micro-product concept" },
  { icon: Pen, label: "Writing your sales page", description: "Crafting conversion-focused sales copy" },
  { icon: Image, label: "Building your sales page", description: "Putting together the live page" },
  { icon: CreditCard, label: "Creating your checkout", description: "Setting up your payment link" },
  { icon: MessageCircle, label: "Writing social captions", description: "Generating share-ready social posts" },
  { icon: Globe, label: "Publishing to marketplace", description: "Going live on Zniche" },
];

type BuildPhase = "input" | "verifying" | "building" | "celebration";
type StepStatus = "pending" | "active" | "done" | "error";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
}

interface StreamEvent {
  step?: number;
  status?: string;
  message?: string;
  output?: string;
  done?: boolean;
  product?: any;
  error?: string;
}

export default function Build() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<BuildPhase>("input");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepOutputs, setStepOutputs] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const outputPanelRef = useRef<HTMLDivElement>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizQ, setCurrentQuizQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const createProduct = useCreateProduct();
  const { data: finalProduct } = useGetProduct(createdProductId || "", {
    query: { enabled: !!createdProductId && phase === "celebration", queryKey: getGetProductQueryKey(createdProductId || "") }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { skill: "", hoursPerWeek: 5, price: 49 },
  });

  const hoursValue = form.watch("hoursPerWeek");
  const priceValue = form.watch("price");

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (outputPanelRef.current) {
      outputPanelRef.current.scrollTop = outputPanelRef.current.scrollHeight;
    }
  }, [stepOutputs, currentStep]);

  const fireStepBurst = useCallback(() => {
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { x: 0.15, y: 0.5 },
      colors: ["#5B2EFF", "#00F0A0"],
      scalar: 0.6,
      gravity: 0.8,
      ticks: 60,
    });
  }, []);

  const fireCelebration = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#5B2EFF", "#00F0A0", "#FF5A70"] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#5B2EFF", "#00F0A0", "#FF5A70"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.4 }, colors: ["#5B2EFF", "#00F0A0", "#FFD700"] });
    }, 500);
  }, []);

  const onFormSubmit = async (values: FormValues) => {
    setPhase("verifying");
    setQuizLoading(true);
    setQuizQuestions([]);
    setCurrentQuizQ(0);
    setQuizAnswers([]);
    setQuizScore(null);

    try {
      const resp = await fetch("/api/ai/verify-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: values.skill }),
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed to load quiz");
      const data = await resp.json();
      setQuizQuestions(data.questions || []);
    } catch {
      toast.error("Could not load verification quiz. Starting build directly.");
      startBuild(values);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    const newAnswers = [...quizAnswers, answer];
    setQuizAnswers(newAnswers);

    if (currentQuizQ < quizQuestions.length - 1) {
      setCurrentQuizQ(prev => prev + 1);
    } else {
      let score = 0;
      quizQuestions.forEach((q, i) => {
        if (newAnswers[i]?.charAt(0) === q.correct) score++;
      });
      setQuizScore(score);

      if (score >= 2) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#5B2EFF", "#00F0A0"] });
        setTimeout(() => startBuild(form.getValues()), 1500);
      }
    }
  };

  const startBuild = async (values: FormValues) => {
    try {
      setPhase("building");
      setCurrentStep(1);
      setStepOutputs({});
      setErrorMessage("");
      setErrorStep(null);

      const newProduct = await createProduct.mutateAsync({ data: values });
      setCreatedProductId(newProduct.id);

      abortControllerRef.current = new AbortController();
      const response = await fetch("/api/ai/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: newProduct.id, ...values }),
        credentials: "include",
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("Failed to start build process");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr === "[DONE]") continue;

            try {
              const event: StreamEvent = JSON.parse(dataStr);

              if (event.error) {
                setErrorMessage(event.error);
                setErrorStep(currentStep);
                return;
              }

              if (event.step) {
                if (event.step > currentStep) {
                  fireStepBurst();
                }
                setCurrentStep(event.step);
                if (event.output) {
                  setStepOutputs(prev => ({ ...prev, [event.step!]: event.output || "" }));
                }
              }

              if (event.done) {
                setPhase("celebration");
                fireCelebration();
              }
            } catch (e) {
              console.error("SSE parse error", e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      setErrorMessage(error.message || "An unexpected error occurred");
      setErrorStep(currentStep);
      toast.error("Build failed");
    }
  };

  const copyToClipboard = (text: string, label = "Copied!") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const getStepStatus = (index: number): StepStatus => {
    const stepNum = index + 1;
    if (errorStep === stepNum) return "error";
    if (currentStep > stepNum) return "done";
    if (currentStep === stepNum && phase === "building") return "active";
    return "pending";
  };

  const getShareUrl = () => `${window.location.origin}/product/${createdProductId}`;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just built "${finalProduct?.productName}" on Zniche! Check it out:`)}&url=${encodeURIComponent(getShareUrl())}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out my new product: ${finalProduct?.productName} — ${finalProduct?.headline || "Built with AI on Zniche"}. Get it here: ${getShareUrl()}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`,
  };

  if (phase === "input") {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-[-0.04em] text-center mb-3">
            What are you great at?
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-10">
            Describe your skill in one sentence. We'll build everything else.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="skill"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you're good at in one sentence..."
                        className="min-h-[130px] resize-none text-lg p-5 rounded-2xl border-border/50 bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        {...field}
                        data-testid="input-skill"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="hoursPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Hours/week</span>
                        <span className="text-2xl font-bold text-primary">{hoursValue}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1} max={20} step={1}
                          value={[field.value]}
                          onValueChange={([v]) => field.onChange(v)}
                          className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                          data-testid="input-hours"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Your price</span>
                        <span className="text-2xl font-bold text-primary">${priceValue}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={5} max={500} step={5}
                          value={[field.value]}
                          onValueChange={([v]) => field.onChange(v)}
                          className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                          data-testid="input-price"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all gap-2"
                disabled={createProduct.isPending}
                data-testid="button-submit-build"
              >
                {createProduct.isPending ? (
                  <span className="animate-pulse">Starting...</span>
                ) : (
                  <>Build my product <ArrowRight className="w-5 h-5" /></>
                )}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    );
  }

  if (phase === "verifying") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full shadow-2xl relative"
        >
          <button
            onClick={() => setPhase("input")}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Quick expertise check</h2>
              <p className="text-sm text-muted-foreground">Takes 60 seconds. We verify creators to protect buyers.</p>
            </div>
          </div>

          {quizLoading ? (
            <div className="space-y-4 py-8">
              <div className="animate-shimmer h-6 rounded-lg w-3/4" />
              <div className="animate-shimmer h-10 rounded-lg" />
              <div className="animate-shimmer h-10 rounded-lg" />
              <div className="animate-shimmer h-10 rounded-lg" />
            </div>
          ) : quizScore !== null ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              {quizScore >= 2 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-neon-mint/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-neon-mint" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Verified!</h3>
                  <p className="text-muted-foreground mb-4">
                    You scored {quizScore}/3. Starting your build now...
                  </p>
                  <div className="flex gap-1 justify-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < quizScore ? "bg-neon-mint" : "bg-muted"}`} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-zniche-red/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-zniche-red" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Not quite</h3>
                  <p className="text-muted-foreground mb-6">
                    You scored {quizScore}/3. Want to try again or refine your skill?
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setPhase("input");
                        setQuizScore(null);
                      }}
                    >
                      Edit skill
                    </Button>
                    <Button
                      className="rounded-full"
                      onClick={() => onFormSubmit(form.getValues())}
                    >
                      Try again
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ) : quizQuestions.length > 0 ? (
            <div>
              <div className="flex gap-1 mb-6">
                {quizQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i < currentQuizQ ? "bg-neon-mint" : i === currentQuizQ ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuizQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Question {currentQuizQ + 1} of {quizQuestions.length}
                  </p>
                  <h3 className="text-lg font-semibold mb-5">
                    {quizQuestions[currentQuizQ].question}
                  </h3>
                  <div className="space-y-2.5">
                    {quizQuestions[currentQuizQ].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(opt)}
                        className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : null}
        </motion.div>
      </div>
    );
  }

  if (phase === "building") {
    const completedSteps = BUILD_STEPS.filter((_, i) => getStepStatus(i) === "done").length;
    const progressPct = (completedSteps / BUILD_STEPS.length) * 100;
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (progressPct / 100) * circumference;

    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
        <div className="w-full lg:w-80 xl:w-96 border-r border-border/50 bg-card/30 p-6 lg:p-8 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Build Progress</p>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {Math.round(progressPct)}%
              </span>
            </div>
          </div>
          <div className="space-y-1">
            {BUILD_STEPS.map((step, i) => {
              const stepStat = getStepStatus(i);
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-300 ${
                    stepStat === "active" ? "bg-primary/10" : ""
                  } ${stepStat === "pending" ? "opacity-35" : ""}`}
                >
                  <div className="relative flex-shrink-0">
                    {stepStat === "done" && (
                      <div className="w-8 h-8 rounded-full bg-neon-mint flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-black" />
                      </div>
                    )}
                    {stepStat === "active" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse-ring">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {stepStat === "pending" && (
                      <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                    {stepStat === "error" && (
                      <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {i < BUILD_STEPS.length - 1 && (
                      <div className={`absolute left-1/2 top-full w-0.5 h-4 -translate-x-1/2 ${
                        stepStat === "done" ? "bg-neon-mint" : "bg-border"
                      }`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${stepStat === "active" ? "text-primary font-semibold" : "text-foreground"}`}>
                      {step.label}
                    </p>
                    {stepStat === "active" && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                    {stepStat === "done" && (
                      <p className="text-xs text-neon-mint font-semibold">done</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {errorStep && (
            <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-3">{errorMessage}</p>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-full gap-2 w-full"
                onClick={() => {
                  setErrorStep(null);
                  setErrorMessage("");
                  startBuild(form.getValues());
                }}
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between bg-card/20">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-mint animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Live output</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              STEP {Math.min(currentStep, BUILD_STEPS.length)} / {BUILD_STEPS.length}
            </span>
          </div>

          <div ref={outputPanelRef} className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {BUILD_STEPS.map((step, i) => {
                const stepNum = i + 1;
                const output = stepOutputs[stepNum];
                const stepStat = getStepStatus(i);
                if (stepStat === "pending") return null;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <step.icon className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-primary">{step.label}</h3>
                      {stepStat === "active" && (
                        <div className="flex gap-1 ml-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                        </div>
                      )}
                    </div>
                    {output && (
                      <div className="bg-card border border-border/50 rounded-xl p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                        {output}
                      </div>
                    )}
                    {stepStat === "active" && !output && (
                      <div className="animate-shimmer h-24 rounded-xl border border-border/30" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon-mint/20 text-neon-mint mb-6"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] mb-3">You're live!</h1>
          <p className="text-lg text-muted-foreground">Your product is built and ready to sell.</p>
        </div>

        {finalProduct?.productName && (
          <div className="flex justify-center mb-8">
            <ErrorBoundary>
              <ProductCover3D
                productName={finalProduct.productName}
                category={finalProduct.category}
                width={300}
                height={220}
              />
            </ErrorBoundary>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your sales page</p>
              <p className="font-mono text-sm truncate">/product/{createdProductId}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => copyToClipboard(getShareUrl(), "Link copied!")}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Link href={`/product/${createdProductId}`}>
                <Button size="sm" className="rounded-full gap-1">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Share your product</p>
            </div>
            <div className="flex gap-2">
              <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full rounded-full gap-2 h-11">
                  <Twitter className="w-4 h-4" /> X / Twitter
                </Button>
              </a>
              <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full rounded-full gap-2 h-11">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
              </a>
              <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full rounded-full gap-2 h-11">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Product details</p>
              <span className="inline-flex items-center text-xs font-semibold text-neon-mint bg-neon-mint/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-mint mr-1.5 animate-pulse" /> Live
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-right max-w-[250px] truncate">{finalProduct?.productName || "Loading..."}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="font-medium">{finalProduct?.productFormat || "..."}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-primary">${finalProduct?.price || form.getValues().price}</span>
              </div>
            </div>
          </div>
        </div>

        {finalProduct?.socialCaptions && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 mb-8">
            <p className="text-sm font-semibold mb-4">Pre-written social captions</p>
            <div className="space-y-3">
              {finalProduct.socialCaptions.split(/(?=\d+\.)/).map((caption: string, i: number) => {
                const text = caption.replace(/^\d+\.\s*/, "").trim();
                if (!text) return null;
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <p className="flex-1 text-sm">{text}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                      onClick={() => copyToClipboard(text, "Caption copied!")}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/product/${createdProductId}`} className="flex-1">
            <Button className="w-full rounded-full h-12 gap-2">
              View live page <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full rounded-full h-12">
              Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
