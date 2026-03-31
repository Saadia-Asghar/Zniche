import { useAuth } from "@workspace/replit-auth-web";
import { useLocation, Link } from "wouter";
import { useGetProducts, useDeleteProduct, getGetProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Package, 
  ExternalLink, 
  Settings, 
  Trash2, 
  Plus,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground text-lg">Welcome back, {user.firstName || user.username || 'Creator'}</p>
        </div>
        <Button onClick={() => setLocation('/build')} className="gap-2 shadow-md rounded-full px-6">
          <Plus className="w-4 h-4" /> New Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Package className="w-4 h-4 mr-2" /> Live Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : completedProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" /> Total Potential Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-24" /> : `$${totalValue}`}</div>
          </CardContent>
        </Card>
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
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {product.productName || "Draft Product"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">${product.price}</span>
                        <span>•</span>
                        <span>{product.category || 'Skill'}</span>
                        <span>•</span>
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
                
                <div className="p-4 md:p-6 md:border-l bg-muted/20 flex items-center justify-end gap-2 md:w-48">
                  {product.status === 'completed' && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/product/${product.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" /> View
                      </Link>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
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
