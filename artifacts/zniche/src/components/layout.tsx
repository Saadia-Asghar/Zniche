import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, login, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const isProductPage = location.startsWith("/product/");

  if (isProductPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="glass-navbar sticky top-0 z-50 w-full border-b border-border/50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-md transition-transform group-hover:scale-105">
                Z
                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-neon-mint border-2 border-background"></span>
              </div>
              <span className="inline-block font-bold text-xl tracking-[-0.04em] text-foreground">
                Zni<span className="text-primary">che</span>
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/marketplace" className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                Marketplace
              </Link>
              {user && (
                <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="ghost" className="rounded-full" onClick={() => logout()} data-testid="button-logout">
                    Log out
                  </Button>
                  <Link href="/build">
                    <Button className="rounded-full px-6" data-testid="button-start-building">Build Product</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="rounded-full" onClick={() => login()} data-testid="button-login">
                    Log in
                  </Button>
                  <Link href="/build">
                    <Button className="rounded-full px-6" data-testid="button-start-building">Start Building</Button>
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <Link href="/marketplace">
                    <DropdownMenuItem>Marketplace</DropdownMenuItem>
                  </Link>
                  {user && (
                    <Link href="/dashboard">
                      <DropdownMenuItem>Dashboard</DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/build">
                    <DropdownMenuItem className="font-semibold text-primary">Start Building</DropdownMenuItem>
                  </Link>
                  {user ? (
                    <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => login()}>Log in</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full h-full">
        {children}
      </main>

      <footer className="border-t border-border/50 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-8 mx-auto">
          <p className="text-sm leading-loose text-center text-muted-foreground md:text-left">
            Built by AI. Owned by you.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:underline">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
