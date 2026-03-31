import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Check, Shield, Clock, Star, ArrowRight, ArrowLeft } from "lucide-react";
import { useGetProduct } from "@workspace/api-client-react";
import { getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Product() {
  const { id } = useParams();
  
  const { data: product, isLoading, error } = useGetProduct(id || "", {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id || "") }
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Skeleton className="w-24 h-8 mb-8" />
        <Skeleton className="w-3/4 h-16 mb-6" />
        <Skeleton className="w-full h-8 mb-4" />
        <Skeleton className="w-5/6 h-8 mb-12" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="w-full h-64 mb-8" />
            <Skeleton className="w-full h-40" />
          </div>
          <div>
            <Skeleton className="w-full h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container max-w-4xl mx-auto py-32 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Product not found</h1>
        <p className="text-muted-foreground mb-8">This product may have been removed or doesn't exist.</p>
        <Link href="/marketplace">
          <Button>Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Sales Header */}
      <div className="bg-muted/30 pt-16 pb-24 px-4 border-b">
        <div className="container max-w-5xl mx-auto">
          <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md">
              {product.category || 'Skill Service'}
            </span>
            {product.productFormat && (
              <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider rounded-md">
                {product.productFormat}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground font-serif leading-tight">
            {product.productName}
          </h1>
          
          <h2 className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed mb-10">
            {product.headline || product.productDescription}
          </h2>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-accent text-accent" />
              <Star className="w-5 h-5 fill-accent text-accent" />
              <Star className="w-5 h-5 fill-accent text-accent" />
              <Star className="w-5 h-5 fill-accent text-accent" />
              <Star className="w-5 h-5 fill-accent text-accent" />
            </div>
            <span className="text-muted-foreground">5.0 • Verified Creator</span>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-12 bg-card p-8 md:p-10 rounded-2xl border shadow-sm">
            
            <section>
              <h3 className="text-2xl font-bold mb-6">About this product</h3>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                {product.salesCopy || `Learn the exact systems and workflows I use to master ${product.skill}. In this offering, you'll get direct access to premium knowledge, distilled down so you can implement it immediately.`}
              </div>
            </section>

            <section className="bg-secondary/30 p-8 rounded-xl border border-secondary/50">
              <h3 className="text-xl font-bold mb-6">What you'll get</h3>
              <ul className="space-y-4">
                {[
                  "Complete access to the materials",
                  "Step-by-step implementation guide",
                  "Actionable frameworks",
                  "Lifetime updates"
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="w-6 h-6 text-accent mr-3 shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>
            
            <section>
              <h3 className="text-2xl font-bold mb-6">Meet your creator</h3>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {product.creatorFirstName?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="text-xl font-bold">{product.creatorFirstName || "Expert Creator"}</h4>
                  <p className="text-muted-foreground">Spends {product.hoursPerWeek} hrs/week mastering this craft.</p>
                </div>
              </div>
            </section>

          </div>

          {/* Sidebar / Checkout Card */}
          <div className="md:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent w-full" />
              <div className="p-8">
                <div className="text-4xl font-extrabold mb-2">${product.price}</div>
                <p className="text-sm text-muted-foreground mb-8 pb-8 border-b">One-time payment. Secure checkout.</p>
                
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg mb-4 shadow-md hover:shadow-primary/20 transition-all font-bold gap-2"
                  onClick={() => {
                    if (product.stripeCheckoutUrl) {
                      window.location.href = product.stripeCheckoutUrl;
                    }
                  }}
                  disabled={!product.stripeCheckoutUrl}
                >
                  Buy Now <ArrowRight className="w-5 h-5" />
                </Button>
                
                {!product.stripeCheckoutUrl && (
                  <p className="text-xs text-center text-destructive mb-4">Checkout not configured yet.</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground justify-center">
                    <Shield className="w-4 h-4 mr-2" /> Secure payment via Stripe
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground justify-center">
                    <Clock className="w-4 h-4 mr-2" /> Instant digital delivery
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
