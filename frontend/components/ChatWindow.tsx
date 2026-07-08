"use client";

import React, { useRef, useEffect } from "react";
import { Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourceBadge } from "./SourceBadge";
import type { SourceCitation } from "@/lib/api";
import type { Components } from "react-markdown";

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

// ---------------------------------------------------------------------------
// Styled markdown components
// ---------------------------------------------------------------------------
const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mb-2 mt-4 text-base font-bold text-white first:mt-0 sm:text-lg" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-2 mt-3 text-sm font-semibold text-white sm:text-base" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-1 mt-3 text-xs font-semibold text-[#39FF14] sm:text-sm" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 leading-relaxed text-gray-200 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 text-gray-200 last:mb-0 sm:pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 text-gray-200 last:mb-0 sm:pl-5" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-xs leading-relaxed sm:text-sm" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-gray-300" {...props}>
      {children}
    </em>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    return (
      <code
        className={
          isInline
            ? "rounded bg-white/[0.08] px-1 py-0.5 text-xs font-mono text-[#39FF14] sm:text-sm"
            : "text-xs font-mono text-gray-200 sm:text-sm"
        }
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-white/[0.06] bg-black/60 p-3 text-xs last:mb-0 sm:p-4 sm:text-sm">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="min-w-full border-collapse rounded-lg border border-white/[0.08] text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-white/[0.04]" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-white/[0.06]" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="transition-colors hover:bg-white/[0.02]" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-b border-white/[0.08] px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-3 sm:py-2 sm:text-xs"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-2 py-1.5 text-xs text-gray-200 sm:px-3 sm:py-2 sm:text-sm" {...props}>
      {children}
    </td>
  ),
  hr: ({ ...props }) => (
    <hr className="my-3 border-white/[0.06]" {...props} />
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-2 border-l-2 border-[#39FF14]/30 pl-3 italic text-gray-400 last:mb-0 sm:pl-4"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-[#39FF14] underline underline-offset-2 transition-colors hover:text-[#39FF14]/80"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

// ---------------------------------------------------------------------------
// MarkdownRenderer
// ---------------------------------------------------------------------------
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// ChatWindow
// ---------------------------------------------------------------------------
export function ChatWindow({ messages, isLoading = false }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Empty state ──
  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] sm:h-14 sm:w-14">
          <FlaskIcon />
        </div>
        <h3 className="mt-4 text-base font-semibold text-white sm:text-lg">
          Clinical Evidence Synthesizer
        </h3>
        <p className="mt-1.5 max-w-[280px] text-center text-xs text-gray-500 sm:max-w-sm sm:text-sm">
          Upload clinical trial PDFs, then ask complex comparative clinical
          questions. The AI will answer using retrieved evidence with citations.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-[#39FF14]/20 bg-[#39FF14]/5 px-3 py-1 text-[11px] font-medium text-[#39FF14]/80 sm:text-xs">
            Upload PDFs
          </span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-[11px] font-medium text-emerald-400/80 sm:text-xs">
            Ask questions
          </span>
          <span className="rounded-full border border-purple-400/20 bg-purple-400/5 px-3 py-1 text-[11px] font-medium text-purple-400/80 sm:text-xs">
            Compare treatments
          </span>
        </div>
      </div>
    );
  }

  // ── Messages ──
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex flex-col gap-4 sm:gap-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full gap-2 sm:gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar — hidden on mobile for cleaner look */}
            <div
              className={`hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-full sm:flex ${
                message.role === "user"
                  ? "border border-[#39FF14]/30 bg-[#39FF14]/10"
                  : "border border-white/[0.08] bg-white/[0.04]"
              }`}
            >
              {message.role === "user" ? (
                <User className="h-3.5 w-3.5 text-[#39FF14]" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-gray-400" />
              )}
            </div>

            {/* Message bubble — full width on mobile */}
            <div
              className={`min-w-0 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:px-4 sm:py-3 ${
                message.role === "user"
                  ? "border border-[#39FF14]/20 bg-[#39FF14]/10 text-white sm:max-w-[75%]"
                  : "w-full border border-white/[0.06] bg-white/[0.02] text-gray-200 sm:max-w-[85%] sm:w-auto"
              }`}
            >
              {message.role === "user" ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  <MarkdownRenderer content={message.content} />
                  {message.isStreaming && (
                    <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-[#39FF14]" />
                  )}
                </div>
              )}

              {/* Source citations */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-2 sm:mt-3 sm:pt-2.5">
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

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex w-full gap-2 sm:gap-3">
            <div className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] sm:flex">
              <Bot className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
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

// Small Flask icon for the empty state
function FlaskIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#39FF14"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 sm:h-7 sm:w-7"
    >
      <path d="M9 2v7.5l-4.21 4.99A2 2 0 0 0 6.34 18h11.32a2 2 0 0 0 1.55-3.51L15 9.5V2" />
      <path d="M9 2h6" />
      <path d="M7.5 13.5h9" />
    </svg>
  );
}
