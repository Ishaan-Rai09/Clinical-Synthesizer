"use client";

import React, { useState, useCallback, useEffect } from "react";
import { FlaskConical, Loader2, Menu, X, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { UploadZone } from "@/components/UploadZone";
import { DocumentList } from "@/components/DocumentList";
import { ChatWindow, Message } from "@/components/ChatWindow";
import { QueryInput } from "@/components/QueryInput";
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  queryEvidence,
  compareDrugs,
  type DocumentInfo,
} from "@/lib/api";

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load documents on mount
  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch {
      // Backend may not be ready yet
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        await uploadDocument(file);
        await fetchDocuments();
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: `✅ **${file.name}** has been uploaded and indexed successfully. You can now ask questions about its content.`,
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: `❌ Failed to upload **${file.name}**: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ]);
      } finally {
        setIsUploading(false);
      }
    },
    [fetchDocuments]
  );

  // Handle document deletion
  const handleDelete = useCallback(
    async (filename: string) => {
      await deleteDocument(filename);
      setDocuments((prev) => prev.filter((d) => d.filename !== filename));
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: `🗑️ Removed **${filename}** from the evidence database.`,
        },
      ]);
    },
    []
  );

  // Handle sending a query
  const handleSendQuery = useCallback(async (query: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: query,
    };

    const placeholderMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, placeholderMessage]);
    setIsQuerying(true);

    try {
      // Detect if this is a comparison query
      const compareMatch = query.match(
        /compare\s+(.+?)\s+(?:vs|versus|and|with)\s+(.+)/i
      );

      let result;
      if (compareMatch) {
        const drugA = compareMatch[1].trim();
        const drugB = compareMatch[2].trim();
        result = await compareDrugs(drugA, drugB);
      } else {
        result = await queryEvidence(query);
      }

      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if ("comparison" in result) {
          updated[lastIndex] = {
            id: generateId(),
            role: "assistant",
            content: result.comparison,
            sources: result.sources,
          };
        } else {
          updated[lastIndex] = {
            id: generateId(),
            role: "assistant",
            content: result.answer,
            sources: result.sources,
          };
        }
        return updated;
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          id: generateId(),
          role: "assistant",
          content: `❌ Error: ${
            error instanceof Error ? error.message : "Query failed"
          }`,
        };
        return updated;
      });
    } finally {
      setIsQuerying(false);
    }
  }, []);

  /* ─── Send an example query ─── */
  const sendExampleQuery = useCallback(
    (query: string) => {
      handleSendQuery(query);
      setSidebarOpen(false);
    },
    [handleSendQuery]
  );

  return (
    <div className="flex h-dvh flex-col bg-[#070708]">
      {/* ════════════════════════════════════════
           HEADER — ChatGPT-style, minimal on mobile
           ════════════════════════════════════════ */}
      <header className="flex h-12 flex-shrink-0 items-center gap-1 border-b border-white/[0.06] bg-[#070708] px-2 sm:h-14 sm:gap-2 sm:px-4 md:border-b-0">
        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
          aria-label="Open documents panel"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop: back to home */}
        <Link
          href="/"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-[#39FF14] sm:h-5 sm:w-5" />
          <span className="text-sm font-medium text-white sm:text-base">
            Synthesizer
          </span>
        </div>

        {/* Uploading indicator — inline, compact */}
        {isUploading && (
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-[#39FF14]/10 px-2.5 py-1">
            <Loader2 className="h-3 w-3 animate-spin text-[#39FF14]" />
            <span className="text-[11px] text-[#39FF14]">Processing</span>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════
           MAIN CONTENT
           ════════════════════════════════════════ */}
      <div className="relative flex min-h-0 flex-1">
        {/* ─── Sidebar Overlay (mobile) ─── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ─── Sidebar ─── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-[320px] flex-col border-r border-white/[0.08] bg-[#0a0a0b] shadow-2xl
            transition-transform duration-300 ease-smooth
            md:static md:z-auto md:w-80 md:translate-x-0 md:shadow-none md:bg-black/30
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Sidebar header with close */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Documents
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-5">
              <UploadZone onUpload={handleUpload} />
            </div>
            <DocumentList
              documents={documents}
              onDelete={handleDelete}
              isLoading={isLoadingDocs}
            />
          </div>

          {/* Example queries */}
          <div className="border-t border-white/[0.06] p-4">
            <h3 className="mb-2.5 text-xs font-semibold text-gray-500">
              Example Queries
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() =>
                  sendExampleQuery(
                    "What are the primary efficacy outcomes reported in the uploaded trials?"
                  )
                }
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-[#39FF14]"
              >
                &ldquo;What are the primary efficacy outcomes?&rdquo;
              </button>
              <button
                onClick={() =>
                  sendExampleQuery(
                    "Summarize the safety profile and adverse events from all documents."
                  )
                }
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-[#39FF14]"
              >
                &ldquo;Summarize the safety profile.&rdquo;
              </button>
              <button
                onClick={() =>
                  sendExampleQuery("Compare Drug A vs Drug B")
                }
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-[#39FF14]"
              >
                &ldquo;Compare Drug A vs Drug B&rdquo;
              </button>
            </div>
          </div>
        </aside>

        {/* ─── Chat Area ─── */}
        <main className="flex min-w-0 flex-1 flex-col">
          <ChatWindow messages={messages} isLoading={isQuerying} />

          {/* Input area — clean, minimal */}
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-gradient-to-t from-[#070708] via-[#070708] to-transparent px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 md:border-t-0">
            <QueryInput
              onSend={handleSendQuery}
              isDisabled={isUploading}
              placeholder="Ask a clinical question..."
            />
            <p className="mt-1.5 text-center text-[10px] text-gray-600/60 sm:text-xs">
              Answers from uploaded evidence only. Verify against original sources.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
