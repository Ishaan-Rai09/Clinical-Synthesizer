"use client";

import React from "react";
import { FileText } from "lucide-react";

interface SourceBadgeProps {
  document: string;
  page: number;
  onClick?: () => void;
}

export function SourceBadge({ document, page, onClick }: SourceBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#39FF14]/15 bg-[#39FF14]/5 px-2.5 py-0.5 text-xs font-medium text-[#39FF14]/80 transition-colors hover:bg-[#39FF14]/10 hover:text-[#39FF14]"
    >
      <FileText className="h-3 w-3 flex-shrink-0" />
      <span className="max-w-[120px] truncate">{document}</span>
      <span className="text-[#39FF14]/50">(p.{page})</span>
    </button>
  );
}
