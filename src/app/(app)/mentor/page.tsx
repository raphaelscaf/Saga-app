"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Send, Bot, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Hero, ChatMessage, GeneratedMission } from "@/types/database";

const QUICK_ACTIONS = [
  "Missoes de hoje",
  "Sem energia",
  "Ver progresso",
  "Novo sprint",
  "Anti-procrastinacao",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 self-start max-w-[88%]">
      <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-sm shrink-0">
        <Bot className="w-3.5 h-3.5 text-accent" />
      </div>
      <div className="bg-accent/10 border border-accent/20 rounded-[4px_16px_16px_16px] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isSage = message.role === "sage";

  // Strip mission JSON from display
  const displayContent = message.content
    .replace(/\[MISSIONS_JSON\].*?\[\/MISSIONS_JSON\]/s, "")
    .trim();

  return (
    <div
      className={`flex items-end gap-2 ${isSage ? "self-start" : "self-end flex-row-reverse"} max-w-[88%]`}
    >
      {isSage && (
        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-sm shrink-0">
          <Bot className="w-3.5 h-3.5 text-accent" />
        </div>
      )}
      <div
        className={
          isSage
            ? "bg-accent/10 border border-accent/20 rounded-[4px_16px_16px_16px] px-4 py-3"
            : "bg-primary/10 border border-primary/20 rounded-[16px_4px_16px_16px] px-4 py-3"
        }
      >
        <p
          className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${
            isSage ? "text-accent" : "text-primary"
          }`}
        >
          {isSage ? "Sage" : "Voce"}
        </p>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {displayContent}
        </p>
      </div>
    </div>
  );
}

export default function MentorPage() {
  const [hero, setHero] = useState<Hero | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Load hero + chat messages
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/hero");
        const data = await res.json();
        if (!data.hero) return;
        setHero(data.hero);

        const supabase = createClient();
        const { data: chatData } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("hero_id", data.hero.id)
          .order("created_at", { ascending: true });

        if (chatData) setMessages(chatData);
      } catch {
        toast.error("Erro ao carregar mensagens");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || sending || !hero) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        hero_id: hero.id,
        role: "user",
        content: text.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const res = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erro ao enviar mensagem");
          return;
        }

        const sageMsg: ChatMessage = {
          id: crypto.randomUUID(),
          hero_id: hero.id,
          role: "sage",
          content: data.message,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, sageMsg]);

        // If AI generated missions, notify user
        if (data.missions && data.missions.length > 0) {
          toast.success(
            `${data.missions.length} missao(oes) criada(s)! Veja na aba Missoes.`,
            { icon: <Sparkles className="w-4 h-4" /> }
          );
        }
      } catch {
        toast.error("Falha na conexao com o mentor");
      } finally {
        setSending(false);
      }
    },
    [sending, hero]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent neon-border-magenta flex items-center justify-center text-lg">
          <Bot className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Sage</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Mentor Ativo
            </span>
          </div>
        </div>
      </div>

      {/* Quick action chips */}
      <div className="px-4 py-2 border-b border-border/50 overflow-x-auto">
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              disabled={sending}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:text-accent transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {sending && <TypingIndicator />}

        {messages.length === 0 && !sending && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Converse com Sage, seu mentor. Ele pode criar missoes, dar
              conselhos e acompanhar seu progresso.
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Fale com Sage..."
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-30 shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
