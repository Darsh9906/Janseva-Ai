"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Sparkles, Send, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { listIssues } from "@/services/issues";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Show unresolved issues near me",
  "Which area has the most potholes?",
  "How many issues are resolved?",
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm your JanSeva Assistant. Ask me anything about the issues reported in your community.",
};

let messageSeq = 0;
const nextId = () => `m-${Date.now()}-${messageSeq++}`;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function CivicAssistant() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  const send = React.useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || loading) return;

      const userMsg: ChatMessage = { id: nextId(), role: "user", text: question };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      let issues: unknown[] = [];
      try {
        issues = await listIssues(100);
      } catch {
        issues = [];
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, issues }),
        });
        const data = (await res.json()) as { answer?: string; error?: string };
        const text =
          data.answer ??
          data.error ??
          "Sorry, I couldn't process that right now. Please try again.";
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", text },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            text: "Sorry, I couldn't reach the assistant. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass absolute bottom-16 right-0 flex max-h-[70vh] w-[calc(100vw-2.5rem)] max-w-[360px] flex-col overflow-hidden rounded-3xl border border-white/40 shadow-2xl shadow-primary/10 sm:w-[360px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/40 bg-white/40 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-ink">JanSeva Assistant</p>
                  <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition hover:bg-white/70 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "rounded-br-md bg-primary text-white"
                        : "rounded-bl-md border border-white/50 bg-white/80 text-ink"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-white/50 bg-white/80 shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              {/* Suggestion chips — only before the first user message */}
              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-full border border-primary/30 bg-white/70 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-white/40 bg-white/40 px-3 py-3 backdrop-blur"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about civic issues..."
                aria-label="Message the assistant"
                disabled={loading}
                className="h-10 bg-white/80"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-xl shadow-primary/30 transition hover:scale-105 active:scale-95"
      >
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        )}
        <span className="relative">
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>
    </div>
  );
}
