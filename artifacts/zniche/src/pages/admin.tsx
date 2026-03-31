import { useState } from "react";
import { useGetMarketplaceStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  
  const { data: stats } = useGetMarketplaceStats({
    query: { enabled: isAuthenticated }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "zniche-admin") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Lock className="w-6 h-6" />
              </div>
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input 
                type="password" 
                placeholder="Enter admin password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">Unlock Dashboard</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Platform Overview</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Generated Products</p>
            <p className="text-4xl font-bold">{stats?.totalProducts || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">Active Creators</p>
            <p className="text-4xl font-bold">{stats?.totalCreators || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">Average Product Price</p>
            <p className="text-4xl font-bold">${stats?.avgPrice?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-6">Top Categories</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.topCategories?.map(cat => (
          <Card key={cat.category}>
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-medium">{cat.category}</span>
              <span className="px-2 py-1 bg-secondary rounded-md text-sm font-bold">{cat.count}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
