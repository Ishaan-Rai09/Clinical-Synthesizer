"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface QueryInputProps {
  onSend: (query: string) => Promise<void>;
  isDisabled?: boolean;
  placeholder?: string;
}

export function QueryInput({
  onSend,
  isDisabled = false,
  placeholder = "Ask a clinical question about the uploaded evidence...",
}: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [query]);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || isSending || isDisabled) return;

    setIsSending(true);
    try {
      await onSend(trimmed);
      setQuery("");
    } catch {
      // Error handling is done by the parent
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-black/60 p-2 shadow-sm transition-all focus-within:border-[#39FF14]/30 focus-within:ring-1 focus-within:ring-[#39FF14]/20 backdrop-blur-xl">
      <textarea
        ref={textareaRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled || isSending}
        rows={1}
        className="min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Clinical question input"
      />

      <button
        onClick={handleSubmit}
        disabled={!query.trim() || isSending || isDisabled}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#39FF14] text-black transition-all hover:bg-[#39FF14]/90 disabled:cursor-not-allowed disabled:opacity-30"
        title="Send question"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
