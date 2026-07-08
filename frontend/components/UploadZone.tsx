"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
}

interface UploadStatus {
  filename: string;
  status: "uploading" | "success" | "error";
  message?: string;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      // Clear any existing timeout
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setUploadStatus({
          filename: file.name,
          status: "error",
          message: "Only PDF files are accepted.",
        });
        clearTimeoutRef.current = setTimeout(() => setUploadStatus(null), 3000);
        return;
      }

      setUploadStatus({
        filename: file.name,
        status: "uploading",
      });

      try {
        await onUpload(file);
        setUploadStatus({
          filename: file.name,
          status: "success",
        });
      } catch (error) {
        setUploadStatus({
          filename: file.name,
          status: "error",
          message: error instanceof Error ? error.message : "Upload failed",
        });
      }

      // Clear status after 3 seconds
      clearTimeoutRef.current = setTimeout(() => setUploadStatus(null), 3000);
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find((f) => f.type === "application/pdf");
      if (pdfFile) {
        handleFile(pdfFile);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed
          p-4 transition-all duration-200 sm:p-6
          ${
            isDragOver
              ? "border-[#39FF14]/40 bg-[#39FF14]/5"
              : "border-white/[0.08] bg-white/[0.02] hover:border-[#39FF14]/20 hover:bg-white/[0.04]"
          }
        `}
      >
        <div className="flex flex-col items-center gap-2">
          {uploadStatus?.status === "uploading" ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#39FF14] sm:h-8 sm:w-8" />
          ) : uploadStatus?.status === "success" ? (
            <CheckCircle2 className="h-6 w-6 text-[#39FF14] sm:h-8 sm:w-8" />
          ) : uploadStatus?.status === "error" ? (
            <XCircle className="h-6 w-6 text-red-500 sm:h-8 sm:w-8" />
          ) : (
            <Upload className="h-6 w-6 text-gray-600 sm:h-8 sm:w-8" />
          )}

          <div className="text-center">
            <p className="text-xs font-medium text-gray-300 sm:text-sm">
              {uploadStatus?.status === "uploading"
                ? `Uploading ${uploadStatus.filename}...`
                : uploadStatus?.status === "success"
                ? `${uploadStatus.filename} uploaded successfully!`
                : uploadStatus?.status === "error"
                ? uploadStatus.message || "Upload failed"
                : "Drop your clinical trial PDF here"}
            </p>
            <p className="mt-1 text-[10px] text-gray-600 sm:text-xs">
              {!uploadStatus && "or click to browse files"}
            </p>
          </div>
        </div>

        {uploadStatus?.status === "uploading" && (
          <div className="mt-2 h-0.5 w-full max-w-[160px] overflow-hidden rounded-full bg-white/[0.06] sm:mt-3 sm:h-1 sm:max-w-[200px]">
            <div className="h-full w-full animate-pulse rounded-full bg-[#39FF14]" />
          </div>
        )}

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Upload PDF file"
        />
      </label>

      {uploadStatus?.status === "error" && (
        <p className="text-center text-xs text-red-500">
          {uploadStatus.message}
        </p>
      )}
    </div>
  );
}
