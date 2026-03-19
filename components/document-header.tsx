"use client";

import { updateDocument } from "@/lib/actions/documents";
import { useRef, useState } from "react";

interface DocumentHeaderProps {
  id: string;
  title: string;
  icon?: string | null;
}

export function DocumentHeader({ id, title, icon }: DocumentHeaderProps) {
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (newTitle: string) => {
    setValue(newTitle);

    // Debounced save — 500ms
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateDocument(id, { title: newTitle || "Untitled" });
    }, 500);
  };

  return (
    <div className="mx-auto max-w-3xl px-12 pt-16 group">
      {icon && <p className="text-6xl mb-2">{icon}</p>}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Untitled"
        className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-muted-foreground/50 warp-break-words"
      />
    </div>
  );
}