import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, TrendingUp, Users, DollarSign } from "lucide-react";
import { useGetMarketplaceListings, useGetMarketplaceStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["All", "Digital guides", "Live sessions", "Templates", "Courses", "Consulting", "Coaching"];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  
  const { data: listings = [], isLoading } = useGetMarketplaceListings();
  const { data: stats, isLoading: isLoadingStats } = useGetMarketplaceStats();

  const filtered = listings.filter(listing => {
    const matchesSearch = !searchTerm || 
      listing.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || listing.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
    if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.04em] mb-2">Marketplace</h1>
        <p className="text-muted-foreground text-lg">Discover skills and micro-products from top creators.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Products</p>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Skeleton className="h-7 w-12 mt-1" /> : stats?.totalProducts || 0}
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-neon-mint/10 rounded-xl text-neon-mint">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Creators</p>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Skeleton className="h-7 w-12 mt-1" /> : stats?.totalCreators || 0}
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Price</p>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Skeleton className="h-7 w-12 mt-1" /> : `$${stats?.avgPrice?.toFixed(0) || '0'}`}
            </div>
          </div>
        </div>
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
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid">
              <Skeleton className={`w-full rounded-2xl ${i % 3 === 0 ? 'h-72' : i % 3 === 1 ? 'h-56' : 'h-64'}`} />
            </div>
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
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="break-inside-avoid"
            >
              <Link href={`/product/${listing.id}`}>
                <Card className="overflow-hidden group hover:border-primary/30 transition-all cursor-pointer border-border/30 bg-card/50">
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center relative overflow-hidden ${
                      i % 3 === 0 ? 'h-40' : i % 3 === 1 ? 'h-28' : 'h-32'
                    }`}>
                      <h3 className="text-lg font-bold text-foreground/70 px-4 text-center">
                        {listing.productName}
                      </h3>
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
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
