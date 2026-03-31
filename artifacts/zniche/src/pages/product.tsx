import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Clock, Star, ArrowRight, ArrowLeft, Send } from "lucide-react";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCover3D } from "@/components/product-cover-3d";

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

      <form onSubmit={submitReview} className="mb-8 bg-muted/20 rounded-xl border border-border/50 p-5 space-y-4">
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
            <div key={review.id} className="p-4 bg-card rounded-xl border border-border/50">
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

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-muted/30 pt-16 pb-24 px-4 border-b">
        <div className="container max-w-5xl mx-auto">
          <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
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
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <Star className="w-5 h-5 fill-accent text-accent" />
                </div>
                <span className="text-muted-foreground">5.0 · Verified Creator</span>
              </div>
            </div>

            <div className="flex justify-center">
              <ProductCover3D
                productName={product.productName || "Product"}
                category={product.category}
                width={340}
                height={250}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">

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

            <ReviewSection productId={id || ""} />
          </div>

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
