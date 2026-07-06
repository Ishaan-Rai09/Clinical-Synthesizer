"use client";

import React, { useState } from "react";
import { FileText, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { DocumentInfo } from "@/lib/api";

interface DocumentListProps {
  documents: DocumentInfo[];
  onDelete: (filename: string) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentList({
  documents,
  onDelete,
  isLoading = false,
}: DocumentListProps) {
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename);
    setError(null);
    try {
      await onDelete(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[#39FF14]" />
        <span className="ml-2 text-sm text-gray-500">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] py-8">
        <FileText className="h-10 w-10 text-gray-700" />
        <p className="mt-2 text-sm text-gray-500">
          No documents uploaded yet
        </p>
        <p className="text-xs text-gray-600">
          Upload a clinical trial PDF to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.filename}
            className="group flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-all hover:border-[#39FF14]/20 hover:bg-white/[0.04]"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#39FF14]/15 bg-[#39FF14]/5">
                <FileText className="h-4 w-4 text-[#39FF14]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-200">
                  {doc.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {doc.chunks} chunk{doc.chunks !== 1 ? "s" : ""} indexed
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDelete(doc.filename)}
              disabled={deletingFile === doc.filename}
              className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-600 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 lg:opacity-0 lg:group-hover:opacity-100"
              title={`Delete ${doc.filename}`}
            >
              {deletingFile === doc.filename ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
