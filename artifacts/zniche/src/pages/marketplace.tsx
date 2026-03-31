import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, TrendingUp, Users, DollarSign, LayoutGrid, LayoutList } from "lucide-react";
import { useGetMarketplaceListings, useGetMarketplaceStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCover3D } from "@/components/product-cover-3d";
import { ErrorBoundary } from "@/components/error-boundary";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["All", "Featured", "Digital guides", "Live sessions", "Templates", "Courses", "Consulting", "Coaching"];

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
  };
  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
}

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: listings = [], isLoading } = useGetMarketplaceListings();
  const { data: stats, isLoading: isLoadingStats } = useGetMarketplaceStats();

  const filtered = listings.filter(listing => {
    const matchesSearch = !searchTerm ||
      listing.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All"
      || (selectedCategory === "Featured" && listing.isFeatured)
      || (selectedCategory !== "Featured" && listing.category?.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
    if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <Breadcrumb items={[{ label: "Marketplace" }]} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.04em] mb-2">Marketplace</h1>
        <p className="text-muted-foreground text-lg">Discover skills and micro-products from top creators.</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: TrendingUp, label: "Products", value: stats?.totalProducts || 0, color: "text-primary bg-primary/10" },
          { icon: Users, label: "Creators", value: stats?.totalCreators || 0, color: "text-neon-mint bg-neon-mint/10" },
          { icon: DollarSign, label: "Avg Price", value: `$${Math.round(Number(stats?.avgPrice) || 0)}`, color: "text-green-500 bg-green-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <div className="text-2xl font-bold">
                {isLoadingStats ? <Skeleton className="h-7 w-12 mt-1" /> : stat.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            className="pl-10 h-11 rounded-full bg-card border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] h-11 rounded-full bg-card border-border/50">
            <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low</SelectItem>
            <SelectItem value="price-desc">Price: High</SelectItem>
          </SelectContent>
        </Select>
        <div className="hidden md:flex border border-border/50 rounded-full overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="rounded-none h-11 w-11"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="rounded-none h-11 w-11"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "secondary"}
            size="sm"
            className="rounded-full text-xs h-8 px-4"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
          <Link href="/build">
            <Button className="rounded-full px-6">Create the first one</Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link href={`/product/${listing.id}`}>
                <TiltCard>
                  <div className={`glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 ${listing.isFeatured ? "ring-2 ring-accent/40" : ""}`}>
                    {listing.isFeatured && (
                      <div className="bg-gradient-to-r from-accent/20 to-primary/20 px-3 py-1 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Featured</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center py-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
                      <ErrorBoundary>
                        <ProductCover3D
                          productName={listing.productName || "Product"}
                          category={listing.category}
                          width={220}
                          height={160}
                        />
                      </ErrorBoundary>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {listing.category || 'Skill'}
                        </span>
                        <span className="font-bold">${listing.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {listing.headline || listing.productDescription || "A unique micro-product."}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-1.5 text-[10px] font-bold text-primary">
                          {listing.creatorFirstName?.charAt(0) || "U"}
                        </div>
                        {listing.creatorFirstName || "Creator"}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <Link href={`/product/${listing.id}`}>
                <div className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:scale-[1.005] transition-all duration-300 flex items-center gap-4 p-4">
                  <div className="flex-shrink-0">
                    <ErrorBoundary>
                      <ProductCover3D
                        productName={listing.productName || "Product"}
                        category={listing.category}
                        width={120}
                        height={80}
                      />
                    </ErrorBoundary>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {listing.category || 'Skill'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate">{listing.productName}</p>
                    <p className="text-xs text-muted-foreground truncate">{listing.headline || listing.productDescription}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold">${listing.price}</p>
                    <p className="text-xs text-muted-foreground">{listing.creatorFirstName || "Creator"}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
