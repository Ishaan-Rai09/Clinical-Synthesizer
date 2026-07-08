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
    <div className="flex items-end gap-1.5 rounded-xl border border-white/[0.08] bg-black/60 p-1.5 shadow-sm transition-all focus-within:border-[#39FF14]/30 focus-within:ring-1 focus-within:ring-[#39FF14]/20 backdrop-blur-xl sm:gap-2 sm:p-2">
      <textarea
        ref={textareaRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled || isSending}
        rows={1}
        className="min-h-[36px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-xs text-gray-200 outline-none placeholder:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[40px] sm:px-2 sm:py-2 sm:text-sm"
        aria-label="Clinical question input"
      />

      <button
        onClick={handleSubmit}
        disabled={!query.trim() || isSending || isDisabled}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#39FF14] text-black transition-all hover:bg-[#39FF14]/90 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9"
        title="Send question"
      >
        {isSending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
        ) : (
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        )}
      </button>
    </div>
  );
}
