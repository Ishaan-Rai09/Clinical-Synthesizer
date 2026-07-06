"use client";

import React, { useState, useCallback, useEffect } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
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

  return (
    <div className="flex h-screen flex-col bg-[#070708]">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-white/[0.06] bg-black/60 px-6 py-3 backdrop-blur-xl">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] transition-colors hover:bg-white/[0.06]">
          <FlaskConical className="h-5 w-5 text-[#39FF14]" />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-white">
            Clinical Evidence Synthesizer
          </h1>
          <p className="text-xs text-gray-500">
            AI-powered HEOR Research Assistant
          </p>
        </div>

        {isUploading && (
          <div className="ml-auto flex items-center gap-2 text-sm text-[#39FF14]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing PDF...
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Document Management */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-white/[0.06] bg-black/30 backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Evidence Documents
            </h2>
            <UploadZone onUpload={handleUpload} />
            <div className="mt-4">
              <DocumentList
                documents={documents}
                onDelete={handleDelete}
                isLoading={isLoadingDocs}
              />
            </div>
          </div>

          {/* Tips at bottom of sidebar */}
          <div className="border-t border-white/[0.06] p-4">
            <h3 className="mb-2 text-xs font-semibold text-gray-500">
              Example Queries
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() =>
                  handleSendQuery(
                    "What are the primary efficacy outcomes reported in the uploaded trials?"
                  )
                }
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-[#39FF14]"
              >
                &ldquo;What are the primary efficacy outcomes?&rdquo;
              </button>
              <button
                onClick={() =>
                  handleSendQuery(
                    "Summarize the safety profile and adverse events from all documents."
                  )
                }
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-[#39FF14]"
              >
                &ldquo;Summarize the safety profile.&rdquo;
              </button>
              <button
                onClick={() =>
                  handleSendQuery("Compare Drug A vs Drug B")
                }
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-[#39FF14]"
              >
                &ldquo;Compare Drug A vs Drug B&rdquo;
              </button>
            </div>
          </div>
        </aside>

        {/* Right Side - Chat Interface */}
        <main className="flex flex-1 flex-col">
          <ChatWindow messages={messages} isLoading={isQuerying} />

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-black/40 p-4 backdrop-blur-xl">
            <QueryInput
              onSend={handleSendQuery}
              isDisabled={isUploading}
              placeholder="Ask a clinical question or 'Compare Drug X vs Drug Y'..."
            />
            <p className="mt-1.5 text-center text-xs text-gray-600">
              Answers are generated from uploaded evidence documents only.
              Verify all citations against original sources.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
