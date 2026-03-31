import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Clock, Star, ArrowRight, ArrowLeft, Send, ChevronDown, Sparkles, Lock, Award } from "lucide-react";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCover3D } from "@/components/product-cover-3d";
import { ErrorBoundary } from "@/components/error-boundary";
import { Breadcrumb } from "@/components/breadcrumb";

interface Review {
  id: string;
  buyerEmail: string;
  rating: number;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${dim} ${i <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function FAQAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-border/50 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm font-semibold pr-4">{item.q}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews/${productId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerEmail: newEmail, rating: newRating, reviewText: newReviewText }),
        credentials: "include",
      });
      if (res.ok) {
        const review = await res.json();
        setReviews(prev => [review, ...prev]);
        setNewReviewText("");
        setNewEmail("");
        setNewRating(5);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(avgRating)} size="sm" />
            <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      <form onSubmit={submitReview} className="mb-8 glass-card rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold">Leave a review</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setNewRating(i)}
              className="focus:outline-none"
            >
              <Star className={`w-6 h-6 transition-colors ${i <= newRating ? "fill-accent text-accent" : "text-muted-foreground/30 hover:text-accent/50"}`} />
            </button>
          ))}
        </div>
        <input
          type="email"
          placeholder="Your email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <textarea
          placeholder="Share your experience (optional)"
          value={newReviewText}
          onChange={e => setNewReviewText(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button type="submit" size="sm" className="rounded-full gap-2" disabled={submitting}>
          <Send className="w-3.5 h-3.5" /> {submitting ? "Submitting..." : "Submit review"}
        </Button>
      </form>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 glass-card rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {review.buyerEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.buyerEmail.split("@")[0]}</p>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                {review.isVerifiedPurchase && (
                  <span className="text-xs font-semibold text-neon-mint bg-neon-mint/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              {review.reviewText && (
                <p className="text-sm text-muted-foreground mt-2">{review.reviewText}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Product() {
  const { id } = useParams();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const { data: product, isLoading, error } = useGetProduct(id || "", {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id || ""), retry: false }
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

  const faqItems = [
    { q: "What exactly do I get?", a: "You receive full access to the digital product, including all materials, guides, and templates. Everything is available immediately after purchase." },
    { q: "Is there a refund policy?", a: "If you're not satisfied, reach out within 7 days and we'll work with you to make it right." },
    { q: "How do I access my purchase?", a: "After checkout via Stripe, you'll receive instant access via email. No accounts or downloads needed." },
    { q: "Who created this?", a: `This was created by ${product.creatorFirstName || "a verified creator"} who spends ${product.hoursPerWeek || "several"} hours per week mastering this craft.` },
  ];

  return (
    <div className="bg-background min-h-screen pb-20">
      <div
        className="relative pt-16 pb-24 px-4 border-b overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--muted) / 0.4), hsl(var(--background)))",
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <div className="absolute top-10 left-[10%] w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-[15%] w-40 h-40 bg-accent/5 rounded-full blur-2xl" />
        </div>

        <div className="container max-w-5xl mx-auto relative z-10">
          <Breadcrumb items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: product.productName || "Product" },
          ]} />

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">
                {product.productName}
              </h1>

              <h2 className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-6">
                {product.headline || product.productDescription}
              </h2>

              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-muted-foreground">5.0 · Verified Creator</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <ErrorBoundary>
                <ProductCover3D
                  productName={product.productName || "Product"}
                  category={product.category}
                  width={340}
                  height={250}
                />
              </ErrorBoundary>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">

          <div className="md:col-span-2 space-y-12 glass-card p-8 md:p-10 rounded-2xl">

            <section>
              <h3 className="text-2xl font-bold mb-6">About this product</h3>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                {product.salesCopy || `Learn the exact systems and workflows I use to master ${product.skill}. In this offering, you'll get direct access to premium knowledge, distilled down so you can implement it immediately.`}
              </div>
            </section>

            <section className="bg-gradient-to-br from-primary/5 to-accent/5 p-8 rounded-xl border border-primary/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> What you'll get
              </h3>
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

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: "Money-back guarantee", color: "text-neon-mint" },
                { icon: Lock, label: "Secure payment", color: "text-primary" },
                { icon: Award, label: "Verified creator", color: "text-accent" },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl border border-border/30">
                  <badge.icon className={`w-6 h-6 ${badge.color} mb-2`} />
                  <span className="text-xs text-muted-foreground font-medium">{badge.label}</span>
                </div>
              ))}
            </div>

            <section>
              <h3 className="text-2xl font-bold mb-6">Meet your creator</h3>
              <div className="flex items-center gap-6">
                <div className="w-[88px] h-[88px] rounded-full p-1 bg-gradient-to-br from-primary via-accent to-primary flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-bold text-primary">
                    {product.creatorFirstName?.charAt(0) || "U"}
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold">{product.creatorFirstName || "Expert Creator"}</h4>
                  <p className="text-muted-foreground">Spends {product.hoursPerWeek} hrs/week mastering this craft.</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="text-xs text-accent font-semibold">Verified Creator</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-6">Frequently Asked</h3>
              <FAQAccordion items={faqItems} />
            </section>

            <ReviewSection productId={id || ""} />
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-24 glass-card rounded-2xl shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent w-full" />
              <div className="p-8">
                <div className="text-4xl font-extrabold mb-2">${product.price}</div>
                <p className="text-sm text-muted-foreground mb-8 pb-8 border-b border-border/30">One-time payment. Secure checkout.</p>

                <Button
                  size="lg"
                  className="w-full h-14 text-lg mb-4 shadow-md hover:shadow-primary/20 transition-all font-bold gap-2 relative overflow-hidden group"
                  onClick={() => {
                    if (product.stripeCheckoutUrl) {
                      window.location.href = product.stripeCheckoutUrl;
                    }
                  }}
                  disabled={!product.stripeCheckoutUrl}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Buy Now <ArrowRight className="w-5 h-5" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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
