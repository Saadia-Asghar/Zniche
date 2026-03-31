import { useAuth } from "@workspace/replit-auth-web";
import { useLocation, Link } from "wouter";
import { useGetProducts, useDeleteProduct, getGetProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Package, 
  ExternalLink, 
  Settings, 
  Trash2, 
  Plus,
  BarChart3,
  TrendingUp,
  DollarSign,
  Eye
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/breadcrumb";

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
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function MiniBarChart({ data, color = "bg-primary" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className={`w-2 rounded-full ${color} opacity-70`}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();

  const { data: products = [], isLoading } = useGetProducts();

  if (!user) {
    return (
      <div className="container mx-auto py-24 text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Please log in</h2>
        <p className="text-muted-foreground mb-8">You need to be authenticated to view your dashboard.</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await deleteProduct.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const completedProducts = products.filter(p => p.status === 'completed');
  const totalValue = completedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalViews = completedProducts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const mockWeeklyData = [3, 5, 2, 8, 6, 4, 7];

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground text-lg">Welcome back, {user.firstName || user.username || 'Creator'}</p>
        </div>
        <Button onClick={() => setLocation('/build')} className="gap-2 shadow-md rounded-full px-6">
          <Plus className="w-4 h-4" /> New Product
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          {
            icon: Package,
            label: "Live Products",
            value: completedProducts.length,
            color: "text-primary bg-primary/10",
            barColor: "bg-primary",
          },
          {
            icon: DollarSign,
            label: "Total Value",
            value: totalValue,
            prefix: "$",
            color: "text-neon-mint bg-neon-mint/10",
            barColor: "bg-neon-mint",
          },
          {
            icon: Eye,
            label: "Total Views",
            value: totalViews,
            color: "text-blue-400 bg-blue-500/10",
            barColor: "bg-blue-400",
          },
          {
            icon: TrendingUp,
            label: "Weekly Trend",
            value: products.length,
            suffix: " products",
            color: "text-accent bg-accent/10",
            barColor: "bg-accent",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${stat.color}`}>
                      <stat.icon className="w-3.5 h-3.5" />
                    </div>
                    {stat.label}
                  </span>
                  <MiniBarChart data={mockWeeklyData} color={stat.barColor} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <AnimatedCounter target={stat.value} prefix={stat.prefix || ""} suffix={stat.suffix || ""} />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-6">Your Products</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="glass-card overflow-hidden hover:scale-[1.002] transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          {product.productName || "Draft Product"}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">${product.price}</span>
                          <span>·</span>
                          <span>{product.category || 'Skill'}</span>
                          <span>·</span>
                          <span>Created {format(new Date(product.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {product.status === 'completed' ? (
                          <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase">
                            Live
                          </span>
                        ) : product.status === 'building' ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase animate-pulse">
                            Building
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-3">
                      {product.skill}
                    </p>
                  </div>
                  
                  <div className="p-4 md:p-6 md:border-l border-border/30 bg-muted/10 flex items-center justify-end gap-2 md:w-48">
                    {product.status === 'completed' && (
                      <Button variant="outline" size="sm" asChild className="flex-1 rounded-full">
                        <Link href={`/product/${product.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" /> View
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/product/${product.id}`}>View Sales Page</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
            <Button onClick={() => setLocation('/build')} className="rounded-full px-6">Start Building</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
