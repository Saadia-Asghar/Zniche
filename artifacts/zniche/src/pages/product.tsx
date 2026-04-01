import { useParams, Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Check, Shield, Clock, Star, ArrowRight, ChevronDown, Sparkles, Lock, Award,
  Send, Eye, Globe2, Tag, Bell, Users,
} from "lucide-react";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCover3D } from "@/components/product-cover-3d";
import { ErrorBoundary } from "@/components/error-boundary";
import { Breadcrumb } from "@/components/breadcrumb";
import { WhatsAppChatWidget } from "@/components/whatsapp-chat";
import { MeetingBooking } from "@/components/meeting-scheduler";
import { useLocation as useGeoLocation } from "@/hooks/useLocation";
import { convertPrice, getPPPPrice, getFlagEmoji } from "@/lib/pricing";
import { toast } from "sonner";

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
        <Star key={i} className={`${dim} ${i <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
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
          <button className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors" onClick={() => setOpen(open === i ? null : i)}>
            <span className="text-sm font-semibold pr-4">{item.q}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
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

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

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
        setNewReviewText(""); setNewEmail(""); setNewRating(5);
        toast.success("Review submitted!");
      }
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(avgRating)} />
            <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>
      <form onSubmit={submitReview} className="mb-8 glass-card rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold">Leave a review</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} type="button" onClick={() => setNewRating(i)} className="focus:outline-none">
              <Star className={`w-6 h-6 transition-colors ${i <= newRating ? "fill-accent text-accent" : "text-muted-foreground/30 hover:text-accent/50"}`} />
            </button>
          ))}
        </div>
        <input type="email" placeholder="Your email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <textarea placeholder="Share your experience (optional)" value={newReviewText} onChange={e => setNewReviewText(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <Button type="submit" size="sm" className="rounded-full gap-2" disabled={submitting}>
          <Send className="w-3.5 h-3.5" /> {submitting ? "Submitting..." : "Submit review"}
        </Button>
      </form>
      {loading ? (
        <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 glass-card rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{review.buyerEmail.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium">{review.buyerEmail.split("@")[0]}</p>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                {review.isVerifiedPurchase && <span className="text-xs font-semibold text-[#00F0A0] bg-[#00F0A0]/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>}
              </div>
              {review.reviewText && <p className="text-sm text-muted-foreground mt-2">{review.reviewText}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Coupon Box ──
function CouponBox({ productId, onDiscount }: { productId: string; onDiscount: (finalPrice: number, discountAmount: number) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; message?: string; finalPrice?: string; discountAmount?: string } | null>(null);

  const apply = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, code }),
        credentials: "include",
      });
      const data = await res.json();
      setResult(data);
      if (data.valid) {
        onDiscount(parseFloat(data.finalPrice), parseFloat(data.discountAmount));
        toast.success(`Coupon applied! You save $${data.discountAmount}`);
      }
    } catch { setResult({ valid: false, message: "Failed to apply coupon" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="COUPON CODE"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={apply} disabled={!code || loading}>Apply</Button>
      </div>
      {result && (
        <p className={`text-xs mt-2 ${result.valid ? "text-[#00F0A0]" : "text-destructive"}`}>
          {result.valid ? `✓ ${result.message || "Coupon applied!"}` : `✗ ${result.message}`}
        </p>
      )}
    </div>
  );
}

// ── Waitlist Box ──
function WaitlistBox({ productId }: { productId: string }) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const { location } = useGeoLocation();

  useEffect(() => {
    fetch(`/api/waitlist/${productId}/count`).then(r => r.json()).then(d => setCount(d.count)).catch(() => {});
  }, [productId]);

  const join = async () => {
    const res = await fetch("/api/waitlist/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, email, countryCode: location?.countryCode }),
      credentials: "include",
    });
    if (res.ok) { setJoined(true); toast.success("You're on the waitlist!"); }
  };

  if (joined) return <div className="text-center py-3 text-sm text-[#00F0A0] font-medium">✓ You're on the waitlist</div>;

  return (
    <div className="p-4 border border-primary/30 bg-primary/5 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Not available yet — join the waitlist</p>
      </div>
      {count !== null && count > 0 && <p className="text-xs text-muted-foreground mb-3">{count} people waiting</p>}
      <div className="flex gap-2">
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:border-primary focus:outline-none" />
        <Button size="sm" className="rounded-xl" onClick={join} disabled={!email}>Notify me</Button>
      </div>
    </div>
  );
}

export default function Product() {
  const { id } = useParams();
  const [scrollY, setScrollY] = useState(0);
  const { location: geoLocation } = useGeoLocation();
  const [convertedPrice, setConvertedPrice] = useState<string | null>(null);
  const [pppPrice, setPppPrice] = useState<string | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [liveViewers] = useState(() => Math.floor(Math.random() * 11) + 2);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const { data: product, isLoading, error } = useGetProduct(id || "", {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id || ""), retry: false }
  });

  // Currency + PPP conversion when product loads
  useEffect(() => {
    if (!product || !geoLocation) return;
    const base = discountedPrice ?? parseFloat(product.price as string);
    const run = async () => {
      try {
        const ppp = getPPPPrice(base, geoLocation.countryCode);
        const [converted, pppConverted] = await Promise.all([
          convertPrice(base, geoLocation.currency),
          convertPrice(ppp, geoLocation.currency),
        ]);
        if (geoLocation.currency !== "USD") setConvertedPrice(converted.formatted);
        if (geoLocation.countryCode !== "US") setPppPrice(pppConverted.formatted);
      } catch {}
    };
    run();
  }, [product, geoLocation, discountedPrice]);

  // Track page view
  useEffect(() => {
    if (!id || !geoLocation) return;
    fetch("/api/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, countryCode: geoLocation.countryCode, countryName: geoLocation.countryName, city: geoLocation.city }),
      credentials: "include",
    }).catch(() => {});
  }, [id, geoLocation]);

  const displayPrice = discountedPrice ?? (product ? parseFloat(product.price as string) : 0);

  if (isLoading) return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <Skeleton className="w-24 h-8 mb-8" />
      <Skeleton className="w-3/4 h-16 mb-6" />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2"><Skeleton className="w-full h-64 mb-8" /><Skeleton className="w-full h-40" /></div>
        <div><Skeleton className="w-full h-80 rounded-xl" /></div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="container max-w-4xl mx-auto py-32 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Product not found</h1>
      <p className="text-muted-foreground mb-8">This product may have been removed or doesn't exist.</p>
      <Link href="/marketplace"><Button>Back to Marketplace</Button></Link>
    </div>
  );

  const parsedSalesCopy = (() => {
    try { const m = (product.salesCopy || "{}").match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : {}; } catch { return {}; }
  })();

  const faqItems = [
    ...(parsedSalesCopy.faq || []),
    { q: "What exactly do I get?", a: "You receive full access to the digital product, including all materials, guides, and templates. Everything is available immediately after purchase." },
    { q: "Is there a refund policy?", a: "If you're not satisfied, reach out within 7 days and we'll work with you to make it right." },
    { q: "How do I access my purchase?", a: "After checkout, you'll receive instant access via email. No accounts or downloads needed." },
  ].slice(0, 4);

  const whoFor: string[] = parsedSalesCopy.who_for || [];
  const whatYouGet: string[] = parsedSalesCopy.what_you_get || ["Complete access to all materials", "Step-by-step implementation guide", "Actionable frameworks you can use today", "Lifetime updates"];
  const bioHook: string = parsedSalesCopy.bio_hook || "";

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="relative pt-16 pb-24 px-4 border-b overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--muted) / 0.4), hsl(var(--background)))" }}>
        <div className="absolute inset-0 opacity-30" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
          <div className="absolute top-10 left-[10%] w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-[15%] w-40 h-40 bg-accent/5 rounded-full blur-2xl" />
        </div>
        <div className="container max-w-5xl mx-auto relative z-10">
          <Breadcrumb items={[{ label: "Marketplace", href: "/marketplace" }, { label: product.productName || "Product" }]} />
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md">{product.category || "Skill Service"}</span>
                {product.productFormat && <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider rounded-md">{product.productFormat}</span>}
                {product.isVerifiedCreator && <span className="px-3 py-1 bg-[#00F0A0]/10 text-[#00F0A0] text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1"><Award className="w-3 h-3" /> Verified</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">{product.productName}</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-4">{parsedSalesCopy.subheadline || product.headline || product.productDescription}</p>
              {/* Live viewers */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">{liveViewers} people viewing now</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0A0] animate-pulse" />
                </div>
                {product.totalSales !== undefined && product.totalSales > 0 && (
                  <span className="text-muted-foreground"><Users className="w-4 h-4 inline mr-1" />{product.totalSales} buyers</span>
                )}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex justify-center">
              <ErrorBoundary>
                <ProductCover3D productName={product.productName || "Product"} category={product.category} width={340} height={250} />
              </ErrorBoundary>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-12 glass-card p-8 md:p-10 rounded-2xl">
            {/* Headline */}
            {parsedSalesCopy.headline && (
              <section>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">{parsedSalesCopy.headline}</h2>
              </section>
            )}
            {/* Who is this for */}
            {whoFor.length > 0 && (
              <section>
                <h3 className="text-xl font-bold mb-4">Is this for you?</h3>
                <ul className="space-y-3">
                  {whoFor.map((w, i) => <li key={i} className="flex items-start gap-3"><Check className="w-5 h-5 text-[#00F0A0] mt-0.5 flex-shrink-0" /><span className="text-muted-foreground">{w}</span></li>)}
                </ul>
              </section>
            )}
            {/* What you get */}
            <section className="bg-gradient-to-br from-primary/5 to-accent/5 p-8 rounded-xl border border-primary/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> What you'll get</h3>
              <ul className="space-y-4">
                {whatYouGet.map((benefit, i) => <li key={i} className="flex items-start"><Check className="w-6 h-6 text-accent mr-3 shrink-0" /><span className="text-foreground">{benefit}</span></li>)}
              </ul>
            </section>
            <div className="grid grid-cols-3 gap-4">
              {[{ icon: Shield, label: "7-day guarantee", color: "text-[#00F0A0]" }, { icon: Lock, label: "Secure payment", color: "text-primary" }, { icon: Award, label: "Verified creator", color: "text-accent" }].map((badge, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl border border-border/30">
                  <badge.icon className={`w-6 h-6 ${badge.color} mb-2`} />
                  <span className="text-xs text-muted-foreground font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
            {/* Creator bio */}
            <section>
              <h3 className="text-2xl font-bold mb-6">Meet your creator</h3>
              <div className="flex items-center gap-6">
                <div className="w-[88px] h-[88px] rounded-full p-1 bg-gradient-to-br from-primary via-accent to-primary flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-bold text-primary">{product.creatorFirstName?.charAt(0) || "U"}</div>
                </div>
                <div>
                  <h4 className="text-xl font-bold">{product.creatorFirstName || "Expert Creator"}</h4>
                  <p className="text-muted-foreground">{bioHook || `Spends ${product.hoursPerWeek} hrs/week mastering this craft.`}</p>
                  {product.isVerifiedCreator && <div className="flex items-center gap-1 mt-1"><Award className="w-4 h-4 text-accent" /><span className="text-xs text-accent font-semibold">Verified Expert</span></div>}
                  {product.creatorCountry && <p className="text-xs text-muted-foreground mt-1">{getFlagEmoji(product.creatorCountry || "")} {product.creatorCountry}</p>}
                </div>
              </div>
            </section>
            <section><h3 className="text-2xl font-bold mb-6">Frequently Asked</h3><FAQAccordion items={faqItems} /></section>
            <ReviewSection productId={id || ""} />
          </div>

          {/* Sticky sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-24 glass-card rounded-2xl shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent w-full" />
              <div className="p-6">
                {/* Price display */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-2 mb-1">
                    {discountedPrice !== null ? (
                      <>
                        <span className="text-4xl font-extrabold text-primary">${discountedPrice}</span>
                        <span className="text-xl text-muted-foreground line-through">${product.price}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-extrabold">${product.price}</span>
                    )}
                  </div>
                  {convertedPrice && geoLocation?.currency !== "USD" && (
                    <p className="text-sm text-muted-foreground">{getFlagEmoji(geoLocation?.countryCode || "")} {convertedPrice}</p>
                  )}
                  {pppPrice && geoLocation?.countryCode !== "US" && geoLocation?.currency !== "USD" && (
                    <p className="text-xs text-primary/70 mt-0.5">
                      <Globe2 className="w-3 h-3 inline mr-1" />PPP Price {pppPrice}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">One-time payment · Instant delivery</p>
                </div>

                {/* Waitlist mode or buy button */}
                {product.waitlistMode ? (
                  <WaitlistBox productId={id || ""} />
                ) : (
                  <>
                    <Button size="lg" className="w-full h-14 text-lg mb-3 shadow-md hover:shadow-primary/20 transition-all font-bold gap-2 relative overflow-hidden group"
                      onClick={() => { if (product.stripeCheckoutUrl) window.location.href = product.stripeCheckoutUrl; }}
                      disabled={!product.stripeCheckoutUrl}
                    >
                      <span className="relative z-10 flex items-center gap-2">{parsedSalesCopy.cta || "Get Instant Access"} <ArrowRight className="w-5 h-5" /></span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Button>
                    {!product.stripeCheckoutUrl && <p className="text-xs text-center text-destructive mb-3">Checkout not configured yet.</p>}
                    <CouponBox productId={id || ""} onDiscount={(finalPrice) => setDiscountedPrice(finalPrice)} />
                  </>
                )}

                <div className="space-y-2 mt-4 pt-4 border-t border-border/30">
                  {[{ icon: Shield, text: "Secure payment via Stripe" }, { icon: Clock, text: "Instant digital delivery" }, { icon: Globe2, text: "Available worldwide" }].map((b, i) => (
                    <div key={i} className="flex items-center text-xs text-muted-foreground gap-2"><b.icon className="w-3.5 h-3.5 flex-shrink-0" /> {b.text}</div>
                  ))}
                </div>

                {/* V5: Meeting Scheduler for live sessions / coaching */}
                {(product.productFormat === "Live Sessions" || product.productFormat === "Coaching" || product.category?.toLowerCase().includes("coaching") || product.category?.toLowerCase().includes("tutoring")) && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <MeetingBooking
                      creatorName={product.creatorFirstName || "Creator"}
                      productName={product.productName || "Session"}
                      sessionDuration={30}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* V5: WhatsApp Chat Widget */}
      <WhatsAppChatWidget
        creatorName={product.creatorFirstName || "Creator"}
        productName={product.productName || "Product"}
      />
    </div>
  );
}
