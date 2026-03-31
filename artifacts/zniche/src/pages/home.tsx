import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Globe, Banknote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetMarketplaceListings } from "@workspace/api-client-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Home() {
  const { data: listings = [] } = useGetMarketplaceListings();
  const previewListings = listings.slice(0, 3);

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20 shadow-2xs">
              <Sparkles className="w-4 h-4" />
              <span>The #1 AI-Powered Skill Marketplace</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeUp}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-foreground"
            >
              Your skill. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Your product.
              </span> <br className="hidden md:block" />
              Your income.
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12">
              Describe what you know. Watch AI build your micro-product, sales page, and checkout in 20 minutes.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/build">
                <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-xl hover:shadow-primary/20 transition-all rounded-xl" data-testid="hero-start-building">
                  Start Building <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto rounded-xl" data-testid="hero-view-marketplace">
                  Explore Marketplace
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-muted/30 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Zniche Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From idea to income in three simple steps.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-primary" />,
                title: "1. Tell us your skill",
                desc: "Answer three questions about what you're good at, how much time you have, and your pricing goal."
              },
              {
                icon: <Globe className="w-8 h-8 text-accent" />,
                title: "2. Watch AI build it live",
                desc: "Sit back as our cinematic AI engine researches the market, writes copy, and builds your sales page."
              },
              {
                icon: <Banknote className="w-8 h-8 text-green-500" />,
                title: "3. Launch & Earn",
                desc: "Get an instant Stripe checkout link and start selling on the Zniche marketplace immediately."
              }
            ].map((step, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all">
                <CardContent className="pt-8 text-center flex flex-col items-center">
                  <div className="h-16 w-16 rounded-2xl bg-background shadow-sm flex items-center justify-center mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Marketplace */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Live on Zniche</h2>
              <p className="text-muted-foreground text-lg">Real products created by experts like you.</p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" className="gap-2 group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {previewListings.length > 0 ? (
              previewListings.map(listing => (
                <Card key={listing.id} className="overflow-hidden group hover:border-primary/30 transition-colors cursor-pointer">
                  <Link href={`/product/${listing.id}`}>
                    <CardContent className="p-0">
                      <div className="h-40 bg-muted flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-2xl font-bold text-foreground/80 px-6 text-center z-10">
                          {listing.productName}
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                            {listing.category || 'Skill'}
                          </span>
                          <span className="font-bold text-lg">${listing.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {listing.headline || listing.productDescription || "An amazing new product."}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mr-2 text-xs font-bold">
                            {listing.creatorFirstName?.charAt(0) || "U"}
                          </div>
                          By {listing.creatorFirstName || "Creator"}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                No products listed yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
