import { useAuth } from "@workspace/replit-auth-web";
import { useLocation, Link } from "wouter";
import { useGetProducts, useDeleteProduct, getGetProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Package, ExternalLink, Settings, Trash2, Plus, TrendingUp, DollarSign, Eye,
  Sparkles, Globe2, Users, MessageSquare, BarChart3, Tag, Copy, Share2, Award,
  Send, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/breadcrumb";
import { getFlagEmoji } from "@/lib/pricing";

type DashTab = "overview" | "products" | "ai-coach" | "audience" | "referrals" | "settings";

const TABS: { id: DashTab; label: string; Icon: any }[] = [
  { id: "overview", label: "Overview", Icon: BarChart3 },
  { id: "products", label: "Products", Icon: Package },
  { id: "ai-coach", label: "AI Coach", Icon: Sparkles },
  { id: "audience", label: "Audience", Icon: Users },
  { id: "referrals", label: "Referrals", Icon: Share2 },
  { id: "settings", label: "Settings", Icon: Settings },
];

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function MiniBarChart({ data, color = "bg-primary" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <motion.div key={i} className={`w-1.5 rounded-full ${color} opacity-70`}
          initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }} transition={{ duration: 0.4, delay: i * 0.05 }} />
      ))}
    </div>
  );
}

// ── World Map (SVG dot grid — lightweight, no D3 needed) ──
function WorldMapDots({ countryMap }: { countryMap: Record<string, number> }) {
  const hasSales = Object.keys(countryMap).length > 0;
  return (
    <div className="relative w-full h-36 bg-[#070712] rounded-xl overflow-hidden border border-white/5">
      <div className="absolute inset-0 flex items-center justify-center">
        {!hasSales ? (
          <p className="text-xs text-muted-foreground">Sales will appear here from your first buyer</p>
        ) : (
          <div className="flex flex-wrap gap-3 p-4 justify-center">
            {Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([cc, count]) => (
              <div key={cc} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                <span className="text-base">{getFlagEmoji(cc)}</span>
                <span className="text-xs font-medium text-primary">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Coach Tab ──
function AICoach({ products }: { products: any[] }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AI business coach. Ask me about pricing, growing your audience, creating new products, or how to market your skills. What's on your mind?" }
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt.trim();
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `As a creator on Zniche with ${products.length} products, I have this question: ${userMsg}`,
          userType: "creator",
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const aiText = data.suggestions?.length > 0
        ? data.suggestions.join("\n\n")
        : "Great question! Based on what successful creators do: focus on solving one specific, urgent problem for your audience. The more specific you are, the easier it is to market.";
      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Happy to help! Try asking me about pricing strategies, content ideas, or how to grow your first 100 buyers." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="glass-card rounded-2xl p-5 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary" /></div>
        <div>
          <h3 className="font-bold">AI Business Coach</h3>
          <p className="text-xs text-muted-foreground">Powered by Claude — your personal creator strategist</p>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-5 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "ai" && <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Sparkles className="w-3.5 h-3.5 text-primary" /></div>}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-white" : "bg-[#0E0E1C] border border-white/10"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Sparkles className="w-3.5 h-3.5 text-primary" /></div>
            <div className="bg-[#0E0E1C] border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask your AI coach anything..." className="flex-1 px-4 py-3 rounded-xl bg-[#0E0E1C] border border-white/10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
        <Button size="sm" className="rounded-xl px-4" onClick={send} disabled={loading || !prompt.trim()}><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

// ── Referrals Tab ──
function Referrals({ userId }: { userId: string }) {
  const [data, setData] = useState<{ referrals: any[]; totalEarned: number } | null>(null);
  const refLink = `${window.location.origin}?ref=${userId}`;

  useEffect(() => {
    fetch(`/api/referral/${userId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null).then(setData).catch(() => {});
  }, [userId]);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold mb-1">Your Referral Link</h3>
        <p className="text-xs text-muted-foreground mb-3">Earn 10% of every product sale made by creators you refer.</p>
        <div className="flex gap-2">
          <input readOnly value={refLink} className="flex-1 px-3 py-2.5 rounded-xl bg-[#0E0E1C] border border-white/10 text-sm font-mono text-muted-foreground" />
          <Button size="sm" variant="outline" className="rounded-xl gap-2" onClick={() => { navigator.clipboard.writeText(refLink); toast.success("Copied!"); }}>
            <Copy className="w-4 h-4" /> Copy
          </Button>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-bold">Earnings</h3>
          <span className="text-2xl font-bold text-primary">${data?.totalEarned?.toFixed(2) || "0.00"}</span>
        </div>
        {data?.referrals?.length === 0 || !data ? (
          <p className="text-sm text-muted-foreground text-center py-4">No referrals yet. Share your link to start earning!</p>
        ) : (
          <div className="space-y-2">
            {data.referrals.map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                <span className="text-sm">{r.referredUserId?.slice(0, 8)}...</span>
                <span className="text-sm font-medium text-[#00F0A0]">+${r.totalEarnedUsd || "0.00"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coupon Manager ──
function CouponManager({ productId, productName }: { productId: string; productName: string }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(20);
  const [type, setType] = useState("percent");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/coupons/${productId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : []).then(setCoupons).catch(() => {});
  }, [productId]);

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/coupons/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, code, discountType: type, discountValue: discount }),
        credentials: "include",
      });
      if (res.ok) {
        const c = await res.json();
        setCoupons(prev => [...prev, c]);
        setCode(""); toast.success("Coupon created!");
      }
    } finally { setCreating(false); }
  };

  return (
    <div className="border border-border/30 rounded-xl p-4">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Coupons for {productName}</h4>
      <div className="flex gap-2 mb-3 flex-wrap">
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="flex-1 min-w-[100px] px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono focus:border-primary focus:outline-none" />
        <select value={type} onChange={e => setType(e.target.value)} className="px-2 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
          <option value="percent">%</option>
          <option value="fixed">$</option>
        </select>
        <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={1} max={100} className="w-16 px-2 py-2 rounded-xl border border-border bg-background text-sm text-center focus:border-primary focus:outline-none" />
        <Button size="sm" className="rounded-xl" onClick={create} disabled={!code || creating}>Create</Button>
      </div>
      {coupons.length > 0 && (
        <div className="space-y-1">
          {coupons.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-white/5 text-xs">
              <span className="font-mono font-bold">{c.code}</span>
              <span className="text-muted-foreground">{c.discountValue}{c.discountType === "percent" ? "%" : "$"} off · {c.usedCount || 0} uses</span>
              <span className={c.isActive ? "text-[#00F0A0]" : "text-muted-foreground"}>{c.isActive ? "Active" : "Disabled"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [worldMap, setWorldMap] = useState<Record<string, number>>({});
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const { data: products = [], isLoading } = useGetProducts();

  useEffect(() => {
    fetch("/api/analytics/world-map", { credentials: "include" })
      .then(r => r.ok ? r.json() : {}).then(setWorldMap).catch(() => {});
  }, []);

  if (!user) return (
    <div className="container mx-auto py-24 text-center max-w-md">
      <h2 className="text-2xl font-bold mb-4">Please log in</h2>
      <p className="text-muted-foreground mb-8">You need to be authenticated to view your dashboard.</p>
    </div>
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
      toast.success("Product deleted");
    } catch { toast.error("Failed to delete product"); }
  };

  const completedProducts = products.filter(p => p.status === "completed");
  const totalRevenue = completedProducts.reduce((sum, p) => sum + Number(p.totalRevenue || 0), 0);
  const totalViews = completedProducts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const totalSales = completedProducts.reduce((sum, p) => sum + (p.totalSales || 0), 0);
  const mockWeeklyData = [3, 5, 2, 8, 6, 4, 7];

  const stats = [
    { icon: Package, label: "Live Products", value: completedProducts.length, color: "text-primary bg-primary/10", barColor: "bg-primary" },
    { icon: DollarSign, label: "Total Revenue", value: totalRevenue, prefix: "$", color: "text-[#00F0A0] bg-[#00F0A0]/10", barColor: "bg-[#00F0A0]" },
    { icon: Eye, label: "Total Views", value: totalViews, color: "text-blue-400 bg-blue-500/10", barColor: "bg-blue-400" },
    { icon: TrendingUp, label: "Total Sales", value: totalSales, color: "text-accent bg-accent/10", barColor: "bg-accent" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName || user.username || "Creator"} 👋</p>
        </div>
        <Button onClick={() => setLocation("/build")} className="gap-2 rounded-full px-6">
          <Plus className="w-4 h-4" /> New Product
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1 border-b border-border/40">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.Icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <Card className="glass-card">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><div className={`p-1 rounded-lg ${stat.color}`}><stat.icon className="w-3.5 h-3.5" /></div>{stat.label}</span>
                      <MiniBarChart data={mockWeeklyData} color={stat.barColor} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : <AnimatedCounter target={stat.value} prefix={stat.prefix || ""} />}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* World Map */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Globe2 className="w-4 h-4 text-primary" /> Buyer Countries</h2>
            <WorldMapDots countryMap={worldMap} />
          </div>

          {/* Quick product list */}
          {completedProducts.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3">Recent Products</h2>
              <div className="space-y-3">
                {completedProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 glass-card rounded-xl">
                    <div>
                      <p className="font-medium text-sm">{p.productName || p.skill}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · ${p.price}</p>
                    </div>
                    <Link href={`/product/${p.id}`}>
                      <Button size="sm" variant="ghost" className="rounded-full gap-1 text-xs"><ExternalLink className="w-3 h-3" /> View</Button>
                    </Link>
                  </div>
                ))}
                {completedProducts.length > 3 && (
                  <button onClick={() => setActiveTab("products")} className="text-xs text-primary hover:underline">View all {completedProducts.length} products →</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Products Tab ── */}
      {activeTab === "products" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">All Products ({products.length})</h2>
            <Button size="sm" onClick={() => setLocation("/build")} className="rounded-full gap-2"><Plus className="w-4 h-4" /> New</Button>
          </div>
          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
          ) : products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                  <Card className="glass-card overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-3">
                          <h3 className="font-bold truncate">{product.productName || "Draft Product"}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="font-medium text-foreground">${product.price}</span>
                            <span>·</span>
                            <span>{product.category || "Skill"}</span>
                            <span>·</span>
                            <span>{format(new Date(product.createdAt), "MMM d, yyyy")}</span>
                            {product.viewCount && product.viewCount > 0 && <><span>·</span><span className="flex items-center gap-1"><Eye className="w-3 h-3" />{product.viewCount} views</span></>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${product.status === "completed" ? "bg-green-500/10 text-green-500" : product.status === "building" ? "bg-primary/10 text-primary animate-pulse" : "bg-destructive/10 text-destructive"}`}>
                            {product.status === "completed" ? "Live" : product.status === "building" ? "Building" : "Failed"}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><Settings className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild><Link href={`/product/${product.id}`}>View Sales Page</Link></DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {product.status === "completed" && (
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" asChild className="rounded-full text-xs">
                            <Link href={`/product/${product.id}`}><ExternalLink className="w-3 h-3 mr-1" /> View page</Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}>
                            <Tag className="w-3 h-3 mr-1" /> Coupons <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${expandedProduct === product.id ? "rotate-90" : ""}`} />
                          </Button>
                        </div>
                      )}
                      {expandedProduct === product.id && (
                        <div className="mt-3">
                          <CouponManager productId={product.id} productName={product.productName || product.skill} />
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed glass-card">
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-6">Create your first product to start earning.</p>
                <Button onClick={() => setLocation("/build")} className="rounded-full px-6">Start Building</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── AI Coach Tab ── */}
      {activeTab === "ai-coach" && <AICoach products={products} />}

      {/* ── Audience Tab ── */}
      {activeTab === "audience" && (
        <div className="max-w-xl mx-auto">
          <div className="glass-card rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
              <div>
                <h3 className="font-bold">Your Buyers</h3>
                <p className="text-xs text-muted-foreground">People who purchased your products</p>
              </div>
            </div>
            {completedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Complete a product to start building your audience.</p>
            ) : (
              <div className="space-y-3">
                {completedProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">{p.totalSales || 0} buyers</p>
                    </div>
                    <Button size="sm" variant="ghost" className="rounded-full text-xs gap-1">
                      <MessageSquare className="w-3 h-3" /> Email list
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Send Email to Buyers</h3>
            <p className="text-xs text-muted-foreground mb-3">Connect your email provider to send messages to buyers.</p>
            <Button variant="outline" className="rounded-full gap-2 w-full" disabled>
              <Send className="w-4 h-4" /> Configure email sender
            </Button>
          </div>
        </div>
      )}

      {/* ── Referrals Tab ── */}
      {activeTab === "referrals" && <Referrals userId={user.id || user.username || ""} />}

      {/* ── Settings Tab ── */}
      {activeTab === "settings" && (
        <div className="max-w-xl mx-auto space-y-5">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Creator Profile</h3>
            <div className="space-y-3">
              {[{ label: "Display name", value: user.firstName || user.username || "Creator" }, { label: "Email", value: user.email || "—" }].map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                  <p className="text-sm font-medium bg-[#0E0E1C] border border-white/10 rounded-xl px-3 py-2.5">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-3">Stripe Payments</h3>
            <p className="text-xs text-muted-foreground mb-3">Connect Stripe to receive payments from buyers.</p>
            <Button variant="outline" className="rounded-full gap-2 w-full">
              <ExternalLink className="w-4 h-4" /> Connect Stripe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
