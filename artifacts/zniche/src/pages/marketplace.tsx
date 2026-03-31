import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ArrowDownUp, TrendingUp, Users, DollarSign } from "lucide-react";
import { 
  useGetMarketplaceListings, 
  useGetMarketplaceStats 
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");

  const { data: stats, isLoading: isLoadingStats } = useGetMarketplaceStats();
  
  const queryParams: any = {};
  if (category !== "all") queryParams.category = category;
  if (sort !== "newest") queryParams.sort = sort;

  const { data: listings = [], isLoading: isLoadingListings } = useGetMarketplaceListings({
    params: queryParams
  });

  const filteredListings = listings.filter(l => 
    l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.headline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Marketplace</h1>
        <p className="text-xl text-muted-foreground">Discover skills and micro-products from top creators.</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <div className="text-3xl font-bold">
                {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : stats?.totalProducts || 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Creators</p>
              <div className="text-3xl font-bold">
                {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : stats?.totalCreators || 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Price</p>
              <div className="text-3xl font-bold">
                {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : `$${stats?.avgPrice?.toFixed(2) || '0.00'}`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-muted/30 p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-10 h-11 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="w-40">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 bg-background">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {stats?.topCategories?.map(c => (
                  <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 bg-background">
                <ArrowDownUp className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Listings */}
      {isLoadingListings ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardContent className="p-6">
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Card className="h-full flex flex-col overflow-hidden group hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer bg-card">
                <Link href={`/product/${listing.id}`}>
                  <div className="h-40 bg-muted relative flex items-center justify-center overflow-hidden border-b">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h3 className="text-xl font-bold px-4 text-center text-foreground z-10 font-serif">
                      {listing.productName}
                    </h3>
                  </div>
                </Link>
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md uppercase tracking-wider">
                      {listing.category || 'Skill'}
                    </span>
                    <span className="font-bold text-lg text-accent">${listing.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                    {listing.headline || listing.productDescription}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2">
                        {listing.creatorFirstName?.charAt(0) || "U"}
                      </div>
                      {listing.creatorFirstName || "Creator"}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => window.location.href = `/product/${listing.id}`}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-muted/20 rounded-2xl border border-dashed">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => { setSearchTerm(""); setCategory("all"); setSort("newest"); }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
