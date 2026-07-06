"use client";

import React, { useRef, useEffect } from "react";
import { Bot, User, Loader2 } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import type { SourceCitation } from "@/lib/api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  isStreaming?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatWindow({ messages, isLoading = false }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <Bot className="h-7 w-7 text-[#39FF14]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">
          Clinical Evidence Synthesizer
        </h3>
        <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
          Upload clinical trial PDFs, then ask complex comparative clinical
          questions. The AI agent will answer using retrieved evidence with
          source citations.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-[#39FF14]/20 bg-[#39FF14]/5 px-3 py-1 text-xs font-medium text-[#39FF14]/80">
            Upload PDFs above
          </span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs font-medium text-emerald-400/80">
            Ask clinical questions
          </span>
          <span className="rounded-full border border-purple-400/20 bg-purple-400/5 px-3 py-1 text-xs font-medium text-purple-400/80">
            Compare treatments
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                message.role === "user"
                  ? "border border-[#39FF14]/30 bg-[#39FF14]/10"
                  : "border border-white/[0.08] bg-white/[0.04]"
              }`}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4 text-[#39FF14]" />
              ) : (
                <Bot className="h-4 w-4 text-gray-400" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                message.role === "user"
                  ? "border border-[#39FF14]/20 bg-[#39FF14]/10 text-white"
                  : "border border-white/[0.06] bg-white/[0.03] text-gray-200 backdrop-blur-sm"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-[2px] h-[1.1em] bg-[#39FF14] ml-0.5 animate-pulse" />
                )}
              </div>

              {/* Source Citations */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-2">
                  {message.sources.map((source, idx) => (
                    <SourceBadge
                      key={idx}
                      document={source.document}
                      page={source.page}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-row gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
              <Bot className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#39FF14]" />
              <span className="text-sm text-gray-500">
                Analyzing evidence...
              </span>
            </div>
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
