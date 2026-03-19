"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getDocuments,
  createDocument,
  archiveDocument,
} from "@/lib/actions/documents";
import {
  ChevronRight,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Doc {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  children: { id: string }[];
}

interface DocumentItemProps {
  doc: Doc;
  level: number;
}

function DocumentItem({ doc, level }: DocumentItemProps) {
  const router = useRouter();
  const params = useParams();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Doc[]>([]);
  const [isPending, startTransition] = useTransition();

  const isActive = params.documentId === doc.id;
  const hasChildren = doc.children.length > 0;

  const handleExpand = async () => {
    if (!expanded) {
      const docs = await getDocuments(doc.id);
      setChildren(docs as Doc[]);
    }
    setExpanded(!expanded);
  };

  const handleCreate = () => {
    startTransition(async () => {
      const child = await createDocument(doc.id);
      if (!expanded) {
        const docs = await getDocuments(doc.id);
        setChildren(docs as Doc[]);
        setExpanded(true);
      } else {
        const docs = await getDocuments(doc.id);
        setChildren(docs as Doc[]);
      }
      router.push(`/documents/${child.id}`);
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      await archiveDocument(doc.id);
      router.push("/documents");
    });
  };

  return (
    <div>
      <div
        role="button"
        onClick={() => router.push(`/documents/${doc.id}`)}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
        className={cn(
          "group flex items-center gap-1 py-1 pr-3 text-sm font-medium rounded-sm hover:bg-primary/5 cursor-pointer",
          isActive && "bg-primary/5"
        )}
      >
        {/* Expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleExpand();
          }}
          className="shrink-0 p-0.5 rounded-sm hover:bg-primary/10"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        </button>

        {/* Icon + Title */}
        {doc.icon ? (
          <span className="shrink-0 text-base">{doc.icon}</span>
        ) : (
          <FileText className="shrink-0 h-4 w-4 text-muted-foreground" />
        )}
        <span className="truncate flex-1">
          {doc.title || "Untitled"}
        </span>

        {/* Actions — visible on hover */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleArchive();
            }}
            className="p-1 rounded-sm hover:bg-primary/10"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCreate();
            }}
            className="p-1 rounded-sm hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && children.map((child) => (
        <DocumentItem key={child.id} doc={child as Doc} level={level + 1} />
      ))}
    </div>
  );
}

export function SidebarDocumentList() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const fetchDocs = async () => {
    const docs = await getDocuments();
    setDocuments(docs as Doc[]);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleCreate = () => {
    startTransition(async () => {
      const doc = await createDocument();
      await fetchDocs();
      router.push(`/documents/${doc.id}`);
    });
  };

  return (
    <div className="mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Private
        </span>
        <button
          onClick={handleCreate}
          className="p-1 rounded-sm hover:bg-primary/10"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Document tree */}
      {documents.length === 0 ? (
        <p className="px-4 text-xs text-muted-foreground">No pages yet</p>
      ) : (
        documents.map((doc) => (
          <DocumentItem key={doc.id} doc={doc as Doc} level={0} />
        ))
      )}
    </div>
  );
}