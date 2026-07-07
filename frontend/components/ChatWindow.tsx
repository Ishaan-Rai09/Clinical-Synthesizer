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
    <h1 className="mb-2 mt-4 text-lg font-bold text-white first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-2 mt-3 text-base font-semibold text-white" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-1 mt-3 text-sm font-semibold text-[#39FF14]" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 leading-relaxed text-gray-200 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-gray-200 last:mb-0" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-gray-200 last:mb-0" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-sm leading-relaxed" {...props}>
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
            ? "rounded bg-white/[0.08] px-1.5 py-0.5 text-sm font-mono text-[#39FF14]"
            : "text-sm font-mono text-gray-200"
        }
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-white/[0.06] bg-black/60 p-4 last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="min-w-full border-collapse rounded-lg border border-white/[0.08] text-sm">
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
      className="border-b border-white/[0.08] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-3 py-2 text-sm text-gray-200" {...props}>
      {children}
    </td>
  ),
  hr: ({ ...props }) => (
    <hr className="my-3 border-white/[0.06]" {...props} />
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-2 border-l-2 border-[#39FF14]/30 pl-4 italic text-gray-400 last:mb-0"
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
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
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
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "border border-[#39FF14]/20 bg-[#39FF14]/10 text-white"
                  : "border border-white/[0.06] bg-white/[0.03] text-gray-200 backdrop-blur-sm"
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
                    <span className="inline-block h-[1.1em] w-[2px] animate-pulse bg-[#39FF14] ml-0.5" />
                  )}
                </div>
              )}

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
