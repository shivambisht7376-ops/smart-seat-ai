"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot, Send, Sparkles, Clock, Database, Loader2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIQuery, useAISuggestions } from "@/hooks/useAnalytics";
import { cn, formatDateTime } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  rows?: Record<string, unknown>[];
  columns?: string[];
  summary?: string;
  provider?: "mock" | "openai";
  executionMs?: number;
  isError?: boolean;
  timestamp: Date;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="p-1.5 rounded hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ResultTable({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-[var(--color-muted-foreground)]">No rows returned.</p>;
  return (
    <div className="overflow-auto max-h-64 rounded-lg border border-[var(--color-border)] text-xs">
      <table className="w-full">
        <thead className="bg-[color-mix(in_srgb,var(--color-muted)_50%,transparent)] sticky top-0">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-semibold text-[var(--color-muted-foreground)] whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, ri) => (
            <tr key={ri} className={cn(
              "border-t border-[var(--color-border)]",
              ri % 2 === 0 ? "" : "bg-[color-mix(in_srgb,var(--color-muted)_20%,transparent)]"
            )}>
              {columns.map((c) => (
                <td key={c} className="px-3 py-1.5 text-[var(--color-foreground)] whitespace-nowrap">
                  {String(row[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <p className="text-center py-2 text-xs text-[var(--color-muted-foreground)] border-t border-[var(--color-border)]">
          Showing 50 of {rows.length} rows
        </p>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser
          ? "bg-gradient-brand text-white text-xs font-bold"
          : "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]"
      )}>
        {isUser ? "U" : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 max-w-[85%] space-y-2", isUser && "flex flex-col items-end")}>
        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-gradient-brand text-white rounded-tr-sm"
            : "bg-[color-mix(in_srgb,var(--color-muted)_40%,transparent)] text-[var(--color-foreground)] rounded-tl-sm border border-[var(--color-border)]"
        )}>
          {msg.content}
        </div>

        {/* SQL block */}
        {msg.sql && (
          <div className="w-full rounded-xl overflow-hidden border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[color-mix(in_srgb,var(--color-muted)_50%,transparent)]">
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <Database className="w-3.5 h-3.5" />
                Generated SQL
                {msg.provider && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                    msg.provider === "mock"
                      ? "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]"
                      : "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]"
                  )}>
                    {msg.provider === "mock" ? "Mock AI" : "GPT-4o"}
                  </span>
                )}
                {msg.executionMs != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{msg.executionMs}ms
                  </span>
                )}
              </div>
              <CopyButton text={msg.sql} />
            </div>
            <pre className="px-3 py-2 text-xs font-mono text-[var(--color-foreground)] overflow-auto max-h-32 bg-[color-mix(in_srgb,var(--color-background)_80%,transparent)]">
              {msg.sql}
            </pre>
          </div>
        )}

        {/* Results table */}
        {msg.rows && msg.columns && (
          <div className="w-full space-y-1.5">
            {msg.summary && (
              <p className="text-xs text-[var(--color-muted-foreground)] italic px-1">{msg.summary}</p>
            )}
            <ResultTable columns={msg.columns} rows={msg.rows} />
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-[var(--color-muted-foreground)] px-1">
          {formatDateTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm SmartSeat AI Assistant. Ask me anything about your workforce — employees, seats, projects, or utilization. I'll translate your question into a database query and show you the results.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aiMutation = useAIQuery();
  const { data: suggestionsData } = useAISuggestions();
  const suggestions = suggestionsData?.suggestions ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const res = await aiMutation.mutateAsync(question);
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: res.error
          ? `⚠️ ${res.error}`
          : res.query_result?.summary ?? "Here are the results:",
        sql: res.generated_sql,
        rows: res.query_result?.rows,
        columns: res.query_result?.columns,
        summary: res.query_result?.summary,
        provider: res.provider,
        executionMs: res.execution_time_ms,
        isError: !!res.error || !res.is_safe,
        timestamp: new Date(),
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [...m, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process that query. Please try again.",
        isError: true,
        timestamp: new Date(),
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="page-header shrink-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="page-title">AI Assistant</h1>
            <p className="page-subtitle">Ask questions in plain English — powered by SmartSeat AI</p>
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && suggestions.length > 0 && (
        <div className="shrink-0 flex flex-wrap gap-2 mb-4">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              id={`suggestion-${s.slice(0, 10).replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => sendMessage(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)]",
                "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                "hover:bg-[var(--color-accent)] hover:border-[var(--color-primary)]",
                "transition-all duration-150"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {aiMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div className="glass-card px-4 py-3 flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysing your question…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 glass-card p-3 flex items-center gap-3 mt-2">
        <Bot className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
        <input
          id="ai-query-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything… e.g. 'Show all employees without a seat'"
          className={cn(
            "flex-1 bg-transparent text-sm text-[var(--color-foreground)]",
            "placeholder:text-[var(--color-muted-foreground)]",
            "focus:outline-none"
          )}
          disabled={aiMutation.isPending}
        />
        <Button
          id="ai-send-btn"
          variant="brand"
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || aiMutation.isPending}
          aria-label="Send"
        >
          {aiMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
