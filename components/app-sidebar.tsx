"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ChevronsUpDown,
  FileText,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  createDocument,
  getDocuments,
  archiveDocument,
  getTrashDocuments,
  restoreDocument,
  deleteDocument,
} from "@/lib/actions/documents";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserData {
  email?: string;
  name?: string;
  imageUrl?: string;
}

interface Doc {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  children: { id: string }[];
}

interface AppSidebarProps {
  user: UserData;
}

// ─── Document Item (recursive) ───────────────────────────────────────────────

function DocumentItem({
  doc,
  level,
  onRefresh,
}: {
  doc: Doc;
  level: number;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const params = useParams();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Doc[]>([]);
  const [isPending, startTransition] = useTransition();

  const isActive = params.documentId === doc.id;

  const fetchChildren = useCallback(async () => {
    const docs = await getDocuments(doc.id);
    setChildren(docs as Doc[]);
  }, [doc.id]);

  const handleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expanded) await fetchChildren();
    setExpanded(!expanded);
  };

  const handleCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const child = await createDocument(doc.id);
      await fetchChildren();
      setExpanded(true);
      router.push(`/documents/${child.id}`);
    });
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await archiveDocument(doc.id);
      onRefresh();
      router.push("/documents");
    });
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={doc.title || "Untitled"}
          isActive={isActive}
          onClick={() => router.push(`/documents/${doc.id}`)}
          className="group/item pr-1"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {/* Chevron */}
          <button
            onClick={handleExpand}
            className="shrink-0 rounded-sm p-0.5 hover:bg-sidebar-accent"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          </button>

          {/* Icon */}
          {doc.icon ? (
            <span className="shrink-0 text-base leading-none">{doc.icon}</span>
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}

          {/* Title */}
          <span className="truncate">{doc.title || "Untitled"}</span>

          {/* Hover actions */}
          <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100">
            <button
              onClick={handleArchive}
              className="rounded-sm p-1 hover:bg-sidebar-accent"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={handleCreate}
              className="rounded-sm p-1 hover:bg-sidebar-accent"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Nested children */}
      {expanded &&
        children.map((child) => (
          <DocumentItem
            key={child.id}
            doc={child}
            level={level + 1}
            onRefresh={onRefresh}
          />
        ))}
    </>
  );
}

// ─── Trash Box ───────────────────────────────────────────────────────────────

function TrashBox() {
  const router = useRouter();
  const [docs, setDocs] = useState<{ id: string; title: string }[]>([]);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getTrashDocuments().then(setDocs);
  }, []);

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleRestore = (id: string) => {
    startTransition(async () => {
      await restoreDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    });
  };

  return (
    <div className="p-2 text-sm">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title..."
          className="h-7 text-sm"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          Nothing in trash
        </p>
      )}

      {filtered.map((doc) => (
        <div
          key={doc.id}
          role="button"
          onClick={() => router.push(`/documents/${doc.id}`)}
          className="flex items-center justify-between rounded-sm px-2 py-1.5 hover:bg-sidebar-accent cursor-pointer"
        >
          <span className="truncate">{doc.title || "Untitled"}</span>
          <span className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRestore(doc.id);
              }}
              className="rounded-sm p-1 hover:bg-sidebar-accent"
            >
              <Undo2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(doc.id);
              }}
              className="rounded-sm p-1 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Sidebar ────────────────────────────────────────────────────────────

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchDocuments = useCallback(async () => {
    const docs = await getDocuments();
    setDocuments(docs as Doc[]);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const handleCreateDocument = () => {
    startTransition(async () => {
      const doc = await createDocument();
      await fetchDocuments();
      router.push(`/documents/${doc.id}`);
    });
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <Sidebar collapsible="icon">
      {/* Header — Search */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Search" onClick={() => {}}>
              <Search />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content — Documents + Trash */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupAction title="New page" onClick={handleCreateDocument}>
            <Plus /> <span className="sr-only">New Page</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {documents.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="text-muted-foreground"
                    onClick={handleCreateDocument}
                  >
                    <Plus />
                    <span>Add a page</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                documents.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    level={0}
                    onRefresh={fetchDocuments}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Trash */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton tooltip="Trash">
                      <Trash2 />
                      <span>Trash</span>
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-72 p-0"
                  >
                    <TrashBox />
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — User profile */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.imageUrl} alt={user.name ?? ""} />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name ?? "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}