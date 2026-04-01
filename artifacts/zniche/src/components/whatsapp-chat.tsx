import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "bot" | "system";
  text: string;
  time: string;
}

const AUTO_REPLIES: Record<string, string> = {
  price: "The product is priced at a competitive rate with PPP-adjusted pricing for your country. You can see the exact price on the product page!",
  refund: "We offer a 7-day satisfaction guarantee. If you're not happy, just reach out and we'll make it right.",
  access: "After purchasing, you'll receive instant access via email. No downloads or accounts needed!",
  support: "Our creator is usually responsive within a few hours. You can also use the review section to share feedback.",
  demo: "Unfortunately demos aren't available for digital products, but we offer a 7-day money-back guarantee so you can try risk-free!",
  hello: "Hey there! 👋 Thanks for your interest. How can I help you today?",
  hi: "Hello! 👋 Welcome! Ask me anything about this product.",
};

function getAutoReply(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(key)) return reply;
  }
  return "Thanks for your message! The creator will get back to you soon. In the meantime, feel free to check out the FAQ section below. 🙂";
}

function getTimeString() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface WhatsAppChatProps {
  creatorName: string;
  productName: string;
  creatorPhone?: string;
}

export function WhatsAppChatWidget({ creatorName, productName, creatorPhone }: WhatsAppChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: `Hi! 👋 I'm ${creatorName}'s assistant. Ask me anything about "${productName}" and I'll help you out!`,
      time: getTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      time: getTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setIsTyping(true);

    // Simulate AI reply delay
    setTimeout(() => {
      setIsTyping(false);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: getAutoReply(userInput),
        time: getTimeString(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1200 + Math.random() * 800);
  };

  const openWhatsApp = () => {
    const phone = creatorPhone || "";
    const text = encodeURIComponent(`Hi! I'm interested in "${productName}" on Zniche.`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <>
      {/* Floating WhatsApp button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full whatsapp-btn shadow-2xl flex items-center justify-center whatsapp-pulse cursor-pointer"
            aria-label="Open WhatsApp Chat"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-background flex flex-col"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                {creatorName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{creatorName}'s Assistant</p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" /> Online now
                </p>
              </div>
              {creatorPhone && (
                <button onClick={openWhatsApp} className="text-white/80 hover:text-white text-xs underline mr-2 transition-colors">
                  WhatsApp ↗
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#0a0a14]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-white msg-bubble-out"
                      : "bg-[#1a1a2e] border border-white/10 text-foreground msg-bubble-in"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {m.role === "bot" && <Bot className="w-3 h-3 text-[#25D366]" />}
                      {m.role === "user" && <User className="w-3 h-3 text-white/60" />}
                      <span className={`text-[10px] ${m.role === "user" ? "text-white/50" : "text-muted-foreground"}`}>
                        {m.time}
                      </span>
                    </div>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a2e] border border-white/10 msg-bubble-in px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-[#25D366]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border/30 flex gap-2 bg-background">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-full bg-[#0a0a14] border border-white/10 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
              />
              <Button
                size="icon"
                className="rounded-full w-10 h-10 whatsapp-btn flex-shrink-0"
                onClick={sendMessage}
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
