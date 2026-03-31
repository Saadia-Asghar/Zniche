import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Copy, AlertCircle, RefreshCcw, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { useCreateProduct, useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  skill: z.string().min(10, "Please provide more detail about your skill."),
  hoursPerWeek: z.coerce.number().min(1, "Must be at least 1 hour").max(168),
  price: z.coerce.number().min(5, "Minimum price is $5").max(500, "Maximum price is $500"),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  "Researching market demand for your skill",
  "Generating your micro-product concept",
  "Writing your sales copy and pricing",
  "Building your live sales page",
  "Creating your payment setup",
  "Writing 5 social media captions",
  "Adding your product to the Zniche marketplace"
];

type BuildStatus = "idle" | "building" | "completed" | "error";
type StepStatus = "pending" | "active" | "done" | "error";

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
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepOutputs, setStepOutputs] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createProduct = useCreateProduct();
  const { data: finalProduct } = useGetProduct(createdProductId || "", {
    query: { enabled: !!createdProductId, queryKey: getGetProductQueryKey(createdProductId || "") }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skill: "",
      hoursPerWeek: 5,
      price: 49,
    },
  });

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startBuild = async (values: FormValues) => {
    try {
      setStatus("building");
      setCurrentStep(1);
      setStepOutputs({});
      setErrorMessage("");

      // 1. Create product skeleton
      const newProduct = await createProduct.mutateAsync({
        data: values
      });
      
      setCreatedProductId(newProduct.id);

      // 2. Start SSE Stream
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/ai/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: newProduct.id,
          ...values
        }),
        credentials: 'include',
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error("Failed to start build process");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') continue;

            try {
              const event: StreamEvent = JSON.parse(dataStr);

              if (event.error) {
                setStatus("error");
                setErrorMessage(event.error);
                return;
              }

              if (event.step) {
                setCurrentStep(event.step);
                if (event.output) {
                  setStepOutputs(prev => ({
                    ...prev,
                    [event.step!]: event.output || ''
                  }));
                }
              }

              if (event.done) {
                setStatus("completed");
                setCurrentStep(8); // past the end
              }
            } catch (e) {
              console.error("Error parsing SSE JSON", e, dataStr);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      setStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred");
      toast.error("Build process failed");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Caption copied!");
  };

  const getStepStatus = (index: number): StepStatus => {
    const stepNumber = index + 1;
    if (status === "error" && currentStep === stepNumber) return "error";
    if (currentStep > stepNumber) return "done";
    if (currentStep === stepNumber && status === "building") return "active";
    return "pending";
  };

  // Render Form State
  if (status === "idle") {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">What's your skill?</h1>
          <p className="text-muted-foreground text-lg">Tell us what you do. We'll handle the rest.</p>
        </div>

        <Card className="border shadow-lg">
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(startBuild)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="skill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">1. Describe your skill</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">Be specific. e.g., "I help indie founders optimize their PostgreSQL queries"</p>
                      <FormControl>
                        <Textarea 
                          placeholder="I am an expert in..." 
                          className="min-h-[120px] resize-none text-base p-4" 
                          {...field} 
                          data-testid="input-skill"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="hoursPerWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">2. Hours per week available?</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" {...field} className="pl-4 h-12 text-lg" data-testid="input-hours" />
                            <span className="absolute right-4 top-3 text-muted-foreground">hrs</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">3. Target price point</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-4 top-3 text-muted-foreground">$</span>
                            <Input type="number" {...field} className="pl-8 h-12 text-lg" data-testid="input-price" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg mt-4 shadow-xl hover:shadow-primary/20 transition-all rounded-xl gap-2"
                  disabled={createProduct.isPending}
                  data-testid="button-submit-build"
                >
                  {createProduct.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate My Product
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Build Feed State
  if (status === "building" || status === "error") {
    const progress = Math.min(((currentStep - 1) / STEPS.length) * 100, 100);

    return (
      <div className="container max-w-3xl mx-auto py-12 px-4 min-h-[80vh] flex flex-col">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-4"
          >
            Building your empire...
          </motion.h1>
          <Progress value={progress} className="h-2 mb-2 w-full bg-secondary" />
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
            STEP {Math.min(currentStep, 7)} OF 7
          </p>
        </div>

        <div className="space-y-6 flex-1">
          {STEPS.map((stepName, index) => {
            const stepStat = getStepStatus(index);
            const output = stepOutputs[index + 1];

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: stepStat === "pending" ? 0.4 : 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`relative flex gap-4 p-4 rounded-xl border transition-colors ${
                  stepStat === "active" ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : 
                  stepStat === "done" ? "border-border bg-card" : 
                  stepStat === "error" ? "border-destructive bg-destructive/5" : "border-transparent"
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {stepStat === "pending" && <div className="w-6 h-6 rounded-full border-2 border-muted" />}
                  {stepStat === "active" && (
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      <span className="absolute w-full h-full rounded-full bg-primary/30 animate-ping" />
                      <div className="w-3 h-3 rounded-full bg-primary relative z-10" />
                    </div>
                  )}
                  {stepStat === "done" && <CheckCircle2 className="w-6 h-6 text-accent" />}
                  {stepStat === "error" && <AlertCircle className="w-6 h-6 text-destructive" />}
                </div>
                
                <div className="flex-1">
                  <h3 className={`text-lg font-medium ${stepStat === "active" ? "text-primary font-bold" : ""}`}>
                    {stepName}
                  </h3>
                  
                  <AnimatePresence>
                    {output && (stepStat === "done" || stepStat === "active") && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-3 overflow-hidden text-sm"
                      >
                        <div className="p-4 bg-muted/50 rounded-lg border font-mono text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {output}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {status === "error" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-6 bg-destructive/10 border border-destructive rounded-xl text-center"
          >
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-destructive mb-2">Build Failed</h3>
            <p className="text-destructive/80 mb-6">{errorMessage}</p>
            <Button 
              variant="destructive" 
              onClick={() => startBuild(form.getValues())}
              className="gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Retry Build
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // Render Completed State
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none flex justify-center z-0 overflow-hidden text-accent">
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0 }}
          animate={{ opacity: [0, 1, 0], y: -500, scale: [0, 1.5, 2] }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute bottom-0 text-6xl"
        >
          <Sparkles className="w-16 h-16" />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0 }}
          animate={{ opacity: [0, 1, 0], y: -400, x: -200, scale: [0, 1, 1.5] }}
          transition={{ duration: 1.8, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-0 text-5xl"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0 }}
          animate={{ opacity: [0, 1, 0], y: -450, x: 200, scale: [0, 1, 1.5] }}
          transition={{ duration: 1.9, delay: 0.1, ease: "easeOut" }}
          className="absolute bottom-0 text-5xl"
        >
          <Sparkles className="w-14 h-14 text-primary" />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 text-accent mb-6 shadow-xl shadow-accent/10">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-5xl font-extrabold mb-4 text-foreground">Your product is live!</h1>
        <p className="text-xl text-muted-foreground">
          Your skill has been successfully converted into a monetizable product.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mb-12 relative z-10">
        <Card className="border-primary/20 shadow-lg bg-card/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-2">Your Sales Page</h3>
            <p className="text-muted-foreground text-sm mb-6">Share this link to start getting sales instantly.</p>
            
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between mb-6 border font-mono text-sm">
              <span className="truncate mr-4 flex-1">zniche.app/product/{createdProductId}</span>
              <Button size="sm" variant="ghost" className="shrink-0" onClick={() => copyToClipboard(`https://zniche.app/product/${createdProductId}`)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <Link href={`/product/${createdProductId}`}>
              <Button className="w-full gap-2 text-md h-12 shadow-md">
                View Live Page <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border shadow-md bg-card/50 relative z-10">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-2">Marketplace Listing</h3>
            <p className="text-muted-foreground text-sm mb-6">Your product is now indexed in the global marketplace.</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Product Name</span>
                <span className="font-medium text-right max-w-[200px] truncate">{finalProduct?.productName || "Loading..."}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-accent">${finalProduct?.price || form.getValues().price}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" /> Live
                </span>
              </div>
            </div>

            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-12">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-md relative z-10">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShareIcon className="w-6 h-6 text-primary" /> Social Captions
          </h3>
          <p className="text-muted-foreground mb-8">
            We generated 5 optimized captions to help you promote your new product. Post them today!
          </p>

          <div className="space-y-4">
            {finalProduct?.socialCaptions ? 
              finalProduct.socialCaptions.split(/(?=\d+\.)/).map((caption: string, i: number) => {
                const text = caption.replace(/^\d+\.\s*/, '').trim();
                if (!text) return null;
                return (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="flex-1 text-sm md:text-base">{text}</div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(text)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
              : <div className="text-center p-8 text-muted-foreground">Loading captions...</div>
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  )
}
