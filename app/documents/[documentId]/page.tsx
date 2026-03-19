import { getDocumentById } from "@/lib/actions/documents";
import { notFound } from "next/navigation";
import { DocumentHeader } from "@/components/document-header";

interface DocumentPageProps {
  params: Promise<{ documentId: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { documentId } = await params;

  let document;
  try {
    document = await getDocumentById(documentId);
  } catch {
    notFound();
  }

  if (document.isArchived) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">This page is in Trash.</p>
      </div>
    );
  }

  return (
    <div className="pb-40">
      <DocumentHeader
        id={document.id}
        title={document.title}
        icon={document.icon}
      />
      {/* Editor goes here in Phase 2 */}
      <div className="mx-auto max-w-3xl px-12 pt-4">
        <p className="text-muted-foreground text-sm">
          Start writing... (editor coming soon)
        </p>
      </div>
    </div>
  );
}