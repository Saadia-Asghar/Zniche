import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, Zap, ArrowRight, Bell, LayoutDashboard, LogOut, Twitter, Github, Linkedin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, login, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <Link href="/marketplace" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/marketplace" ? "text-primary" : "text-muted-foreground"}`}>
                Marketplace
              </Link>
              {user && (
                <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/dashboard" ? "text-primary" : "text-muted-foreground"}`}>
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
                  <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer" data-testid="button-user-menu">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                          {user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}
                        </div>
                        <span className="text-sm font-medium">{user.firstName || user.username}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 cursor-pointer" data-testid="button-logout">
                        <LogOut className="w-4 h-4" /> Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Link href="/build">
                    <Button className="rounded-full px-6 gap-1" data-testid="button-start-building">
                      <Zap className="w-4 h-4" /> Build
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="rounded-full" onClick={() => login()} data-testid="button-login">
                    Log in
                  </Button>
                  <Link href="/build">
                    <Button className="rounded-full px-6 gap-1" data-testid="button-start-building">
                      <Zap className="w-4 h-4" /> Start Building
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="md:hidden border-t border-border/50 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 bg-card/80 backdrop-blur-lg">
                <Link href="/marketplace" onClick={() => setMobileOpen(false)}>
                  <div className="px-4 py-3 rounded-xl hover:bg-muted/50 text-sm font-medium transition-colors">
                    Marketplace
                  </div>
                </Link>
                {user && (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <div className="px-4 py-3 rounded-xl hover:bg-muted/50 text-sm font-medium transition-colors">
                      Dashboard
                    </div>
                  </Link>
                )}
                <Link href="/build" onClick={() => setMobileOpen(false)}>
                  <div className="px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Start Building <ArrowRight className="w-4 h-4 ml-auto" />
                  </div>
                </Link>
                <div className="pt-2 border-t border-border/30">
                  {user ? (
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-muted/50 text-sm text-muted-foreground transition-colors"
                    >
                      Log out
                    </button>
                  ) : (
                    <button
                      onClick={() => { login(); setMobileOpen(false); }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-muted/50 text-sm font-medium transition-colors"
                    >
                      Log in
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col relative w-full h-full">
        {children}
      </main>

      <footer className="border-t border-border/50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-2">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
                  Z
                </div>
                <span className="font-bold text-lg tracking-[-0.04em]">
                  Zni<span className="text-primary">che</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
                Turn your skills into income. AI builds your product, page, and payment in 20 minutes.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                  <Github className="w-3.5 h-3.5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Product</p>
              <div className="space-y-3">
                <Link href="/build" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Start Building</Link>
                <Link href="/marketplace" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Company</p>
              <div className="space-y-3">
                {user ? (
                  <>
                    <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                    <button onClick={() => logout()} className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Log out</button>
                  </>
                ) : (
                  <button onClick={() => login()} className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Log in</button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Legal</p>
              <div className="space-y-3">
                <span className="block text-sm text-muted-foreground">Privacy Policy</span>
                <span className="block text-sm text-muted-foreground">Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Built by AI. Owned by you.
            </p>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Zniche. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
