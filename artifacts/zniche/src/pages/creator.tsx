import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  Package, Star, Eye, ShoppingBag, Calendar, CheckCircle2,
  ExternalLink, Globe, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCover3D } from "@/components/product-cover-3d";
import { ErrorBoundary } from "@/components/error-boundary";
import { Breadcrumb } from "@/components/breadcrumb";

interface CreatorData {
  creator: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    isVerified: boolean;
    createdAt: string;
  };
  products: any[];
  stats: {
    totalProducts: number;
    totalSales: number;
    totalViews: number;
  };
}

export default function CreatorProfile() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/creator/${params.id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Creator not found</h2>
        <Link href="/marketplace"><Button variant="outline" className="rounded-full gap-2"><ArrowLeft className="w-4 h-4" /> Back to Marketplace</Button></Link>
      </div>
    );
  }

  const { creator, products, stats } = data;
  const memberSince = new Date(creator.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <Breadcrumb items={[{ label: "Marketplace", href: "/marketplace" }, { label: creator.firstName || "Creator" }]} />

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-10"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[#00F0A0] p-0.5">
                <div className="w-full h-full rounded-full bg-[#0E0E1C] flex items-center justify-center overflow-hidden">
                  {creator.profileImageUrl ? (
                    <img src={creator.profileImageUrl} alt={creator.firstName || ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {(creator.firstName || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {creator.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-[#08080F]">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {creator.firstName} {creator.lastName || ""}
                </h1>
                {creator.isVerified && (
                  <span className="text-[10px] font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">Verified</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {memberSince} • {stats.totalProducts} product{stats.totalProducts !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Package, label: "Products", value: stats.totalProducts },
              { icon: ShoppingBag, label: "Sales", value: stats.totalSales },
              { icon: Eye, label: "Views", value: stats.totalViews },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-4 text-center"
              >
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Products grid */}
        <div>
          <h2 className="text-xl font-bold mb-6">Products</h2>
          {products.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No products listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product: any, i: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="glass-card rounded-xl overflow-hidden hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-[#00F0A0]/10 flex items-center justify-center relative overflow-hidden">
                        <ErrorBoundary fallback={<Package className="w-12 h-12 text-muted-foreground" />}>
                          <ProductCover3D product={product} size="sm" />
                        </ErrorBoundary>
                        {product.isFeatured && (
                          <span className="absolute top-2 right-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-semibold">Featured</span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-primary font-medium mb-1">{product.category || product.productFormat}</p>
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {product.productName || product.skill}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-bold text-primary">${product.price}</span>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{product.viewCount || 0}</span>
                            <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{product.totalSales || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
