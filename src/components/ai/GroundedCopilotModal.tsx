"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GroundedAnswerCard } from "./GroundedAnswerCard";
import { useGenerateAnswer } from "@/lib/queries";
import type { GroundedAnswerResult } from "@/lib/api/rag";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/cn";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: GroundedAnswerResult;
  error?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "What is our subscription refund policy?",
  "What are our SLA response times by priority?",
  "What is the hardware replacement warranty?",
  "How are API 429 rate limits handled?",
];

export function GroundedCopilotModal({
  open,
  onClose,
  initialQuestion,
  onInsertReply,
}: {
  open: boolean;
  onClose: () => void;
  initialQuestion?: string;
  onInsertReply?: (text: string) => void;
}) {
  const generate = useGenerateAnswer();
  const [question, setQuestion] = useState(initialQuestion || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<"hybrid" | "semantic" | "keyword">("hybrid");
  const [topK, setTopK] = useState<number>(5);
  const [validationError, setValidationError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialQuestion && open) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, generate.isPending]);

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();

    const trimmed = question.trim();
    if (!trimmed) {
      setValidationError("Please enter a question to ask the knowledge base.");
      return;
    }

    if (generate.isPending) return; // Prevent duplicate submission

    setValidationError(null);
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    try {
      const result = await generate.mutateAsync({
        question: trimmed,
        mode,
        topK,
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        result,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      let errorMsg =
        "An unexpected error occurred while communicating with the AI service.";
      if (err instanceof ApiRequestError) {
        errorMsg = err.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      const errorAssistantMsg: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        role: "assistant",
        content: "",
        error: errorMsg,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, errorAssistantMsg]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  function clearChat() {
    setMessages([]);
    setValidationError(null);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="SupportSense AI Copilot"
      description="Grounded knowledge base assistant. Every answer is retrieved from verified tenant documentation."
    >
      <div className="flex flex-col h-[650px] max-h-[80vh]">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 text-[12px]">
          <div className="flex items-center gap-2">
            <Badge tone="accent" icon={<Sparkles className="size-3" />}>
              Tenant Isolated
            </Badge>

            <label className="flex items-center gap-1.5 text-fg-muted">
              <span>Mode:</span>
              <select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "hybrid" | "semantic" | "keyword")
                }
                disabled={generate.isPending}
                className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-fg focus:outline-accent"
              >
                <option value="hybrid">Hybrid (RRF)</option>
                <option value="semantic">Semantic (pgvector)</option>
                <option value="keyword">Keyword (Full-Text)</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-fg-muted">
              <span>Top K:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                disabled={generate.isPending}
                className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-fg focus:outline-accent"
              >
                <option value={3}>3 chunks</option>
                <option value={5}>5 chunks</option>
                <option value={8}>8 chunks</option>
              </select>
            </label>
          </div>

          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearChat}
              disabled={generate.isPending}
            >
              <Trash2 className="size-3 text-fg-muted" />
              <span className="text-[11px]">Clear conversation</span>
            </Button>
          )}
        </div>

        {/* Messages Scroll Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-4 space-y-4 pr-1"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent-subtle text-accent mb-3">
                <Sparkles className="size-6" />
              </div>
              <h3 className="text-[14px] font-semibold text-fg">
                Ask anything about your tenant policies & documents
              </h3>
              <p className="mt-1 text-[12px] text-fg-muted max-w-md">
                SupportSense retrieves the most relevant chunks using pgvector &
                RRF, and answers strictly from verified evidence without
                fabrication.
              </p>

              <div className="mt-6 w-full max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">
                  Suggested inquiries
                </p>
                <div className="flex flex-col gap-1.5 text-left">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setQuestion(prompt)}
                      className="rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-fg hover:border-accent hover:bg-subtle transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-lg bg-accent text-accent-fg px-3.5 py-2.5 text-[13px]">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="mt-1 block text-right text-[10px] text-accent-fg/80">
                      {msg.timestamp}
                    </span>
                  </div>
                ) : msg.result ? (
                  <div className="w-full">
                    <GroundedAnswerCard
                      result={msg.result}
                      onInsertReply={onInsertReply}
                    />
                  </div>
                ) : msg.error ? (
                  <div className="w-full rounded-lg border border-danger-border bg-danger-subtle p-3.5 text-[12px]">
                    <div className="flex items-center gap-2 font-semibold text-danger">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>Generation Error</span>
                    </div>
                    <p className="mt-1 text-fg">{msg.error}</p>
                  </div>
                ) : null}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {generate.isPending && (
            <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-accent">
                <Loader2 className="size-4 animate-spin" />
                <span>
                  Retrieving documentation and generating grounded answer...
                </span>
              </div>
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-subtle rounded w-3/4" />
                <div className="h-3 bg-subtle rounded w-5/6" />
                <div className="h-3 bg-subtle rounded w-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="border-t border-line pt-3">
          {validationError && (
            <p className="mb-1.5 text-[11px] font-medium text-danger flex items-center gap-1">
              <AlertCircle className="size-3" />
              {validationError}
            </p>
          )}

          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask a support question (e.g., 'What is the refund window?')..."
                rows={2}
                disabled={generate.isPending}
                className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-fg-subtle hidden sm:inline">
                Enter ↵ to submit · Shift+Enter for new line
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={generate.isPending || !question.trim()}
              className="h-10 px-4"
            >
              {generate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              <span className="hidden sm:inline">Ask</span>
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

