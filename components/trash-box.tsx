"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getTrashDocuments,
  restoreDocument,
  deleteDocument,
} from "@/lib/actions/documents";
import { Undo2, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TrashDoc {
  id: string;
  title: string;
}

export function TrashBox() {
  const router = useRouter();
  const [documents, setDocuments] = useState<TrashDoc[]>([]);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getTrashDocuments().then(setDocuments);
  }, []);

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleRestore = (id: string) => {
    startTransition(async () => {
      await restoreDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    });
  };

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title..."
          className="h-7 text-sm"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">
          Nothing in trash
        </p>
      )}

      {filtered.map((doc) => (
        <div
          key={doc.id}
          role="button"
          onClick={() => router.push(`/documents/${doc.id}`)}
          className="flex items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-primary/5 cursor-pointer"
        >
          <span className="truncate">{doc.title || "Untitled"}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRestore(doc.id);
              }}
              className="p-1 rounded-sm hover:bg-primary/10"
            >
              <Undo2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(doc.id);
              }}
              className="p-1 rounded-sm hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}