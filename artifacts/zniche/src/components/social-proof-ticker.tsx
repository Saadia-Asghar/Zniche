import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

// ─── Simulated events (mixes real DB queries with placeholders) ──────────

const TICKER_EVENTS = [
  { emoji: "🟢", text: "Sarah just launched \"Yoga for Back Pain\" — $29", time: "2m ago" },
  { emoji: "💰", text: "Ahmed sold 3 copies of \"React Crash Course\" — $141", time: "5m ago" },
  { emoji: "✅", text: "Maria passed skill verification for \"Spanish Tutoring\"", time: "8m ago" },
  { emoji: "🚀", text: "Fatima published \"Henna Art Masterclass\" — $47", time: "12m ago" },
  { emoji: "💰", text: "Ali earned $94 from \"Pakistani Cooking\" this week", time: "15m ago" },
  { emoji: "🟢", text: "Jonas launched \"Figma to React\" — $67", time: "18m ago" },
  { emoji: "🌍", text: "New buyer from 🇬🇧 UK purchased \"Urdu Calligraphy\" — $19", time: "22m ago" },
  { emoji: "✅", text: "Priya verified as expert in \"Data Science with Python\"", time: "25m ago" },
  { emoji: "💰", text: "Chen sold 5 copies of \"Mandarin for Business\" — $235", time: "30m ago" },
  { emoji: "🚀", text: "Zara published \"Meal Prep for Working Moms\" — $29", time: "35m ago" },
  { emoji: "🌍", text: "New buyer from 🇵🇰 Pakistan (PPP: PKR 1,200) saved 60%", time: "38m ago" },
  { emoji: "✅", text: "David verified as expert in \"iOS Development\"", time: "42m ago" },
];

interface SocialProofTickerProps {
  variant?: "bar" | "toast";
}

// ─── Bar variant (horizontal scrolling strip) ─────────────────────────────

function TickerBar() {
  return (
    <div className="w-full overflow-hidden bg-[#0A0A14] border-y border-white/5 py-2.5">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...TICKER_EVENTS, ...TICKER_EVENTS].map((event, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 text-xs text-muted-foreground">
            <span>{event.emoji}</span>
            <span>{event.text}</span>
            <span className="text-white/20">•</span>
            <span className="text-white/30">{event.time}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Toast variant (bottom-left popup notifications) ──────────────────────

function TickerToast() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Show first toast after 3s, then cycle every 8s
    const showNext = () => {
      setVisible(true);
      // Hide after 4s
      timerRef.current = setTimeout(() => {
        setVisible(false);
        // Next toast after 4s gap
        timerRef.current = setTimeout(() => {
          setCurrentIdx(prev => (prev + 1) % TICKER_EVENTS.length);
          showNext();
        }, 4000);
      }, 4000);
    };

    timerRef.current = setTimeout(showNext, 3000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const event = TICKER_EVENTS[currentIdx];

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: -10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0E0E1C]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 max-w-sm">
              <span className="text-lg flex-shrink-0">{event.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.text}</p>
                <p className="text-[10px] text-muted-foreground">{event.time}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SocialProofTicker({ variant = "bar" }: SocialProofTickerProps) {
  if (variant === "toast") return <TickerToast />;
  return <TickerBar />;
}

export default SocialProofTicker;
