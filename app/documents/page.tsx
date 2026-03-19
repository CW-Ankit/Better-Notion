"use client";

import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDocument } from "@/lib/actions/documents";

export default function DocumentsPage() {
  const router = useRouter();

  const handleCreate = async () => {
    const doc = await createDocument();
    router.push(`/documents/${doc.id}`);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-medium text-muted-foreground">
        No document selected
      </h2>
      <Button onClick={handleCreate} variant="outline" size="sm">
        <PlusCircle className="mr-2 h-4 w-4" />
        Create a page
      </Button>
    </div>
  );
}