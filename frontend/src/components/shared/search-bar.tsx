"use client";

import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
  id = "search-bar",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-9 px-3 rounded-lg",
        "border border-[var(--color-border)] bg-[var(--color-background)]",
        "focus-within:ring-2 focus-within:ring-[var(--color-ring)]",
        "transition-all duration-150",
        className
      )}
    >
      <Search className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent text-sm text-[var(--color-foreground)]",
          "placeholder:text-[var(--color-muted-foreground)]",
          "focus:outline-none min-w-0"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
