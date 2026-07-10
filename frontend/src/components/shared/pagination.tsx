"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex items-center justify-between px-2 py-3", className)}>
      {/* Count */}
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Showing{" "}
        <span className="font-medium text-[var(--color-foreground)]">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-medium text-[var(--color-foreground)]">
          {total.toLocaleString()}
        </span>{" "}
        records
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          id="pagination-first"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={!hasPrev}
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          id="pagination-prev"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm px-3 text-[var(--color-foreground)]">
          <span className="font-medium">{page}</span>
          <span className="text-[var(--color-muted-foreground)]"> / {totalPages}</span>
        </span>

        <Button
          id="pagination-next"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          id="pagination-last"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext}
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
