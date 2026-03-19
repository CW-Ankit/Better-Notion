"use server";

import { db } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper: get current user's Prisma record
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Find or create the Prisma user record
  const dbUser = await db.user.upsert({
    where: { supabaseId: user.id },
    update: {}, // no-op if exists
    create: {
      supabaseId: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      imageUrl: user.user_metadata?.avatar_url ?? null,
    },
  });

  return dbUser;
}

// CREATE
export async function createDocument(parentId?: string) {
  const user = await getCurrentUser();

  const document = await db.document.create({
    data: {
      title: "Untitled",
      userId: user.id,
      parentId: parentId || null,
    },
  });

  revalidatePath("/documents");
  return document;
}

// READ — sidebar tree (top-level docs for current user)
export async function getDocuments(parentId?: string) {
  const user = await getCurrentUser();

  return db.document.findMany({
    where: {
      userId: user.id,
      parentId: parentId || null,
      isArchived: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      children: {
        where: { isArchived: false },
        select: { id: true }, // just to know if expandable
      },
    },
  });
}

// READ — single document
export async function getDocumentById(documentId: string) {
  const user = await getCurrentUser();

  const doc = await db.document.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.userId !== user.id) throw new Error("Not found");
  return doc;
}

// UPDATE — title
export async function updateDocument(
  documentId: string,
  data: { title?: string; content?: string; icon?: string; coverImage?: string }
) {
  const user = await getCurrentUser();

  const doc = await db.document.update({
    where: { id: documentId },
    data,
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return doc;
}

// SOFT DELETE — archive (recursive)
export async function archiveDocument(documentId: string) {
  const user = await getCurrentUser();

  // Archive the doc and all nested children recursively
  const archiveRecursive = async (id: string) => {
    const children = await db.document.findMany({
      where: { parentId: id, userId: user.id },
    });

    for (const child of children) {
      await archiveRecursive(child.id);
    }

    await db.document.update({
      where: { id },
      data: { isArchived: true },
    });
  };

  await archiveRecursive(documentId);
  revalidatePath("/documents");
}

// RESTORE
export async function restoreDocument(documentId: string) {
  const user = await getCurrentUser();

  // Restore the doc — also unarchive ancestors if they're archived
  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.userId !== user.id) throw new Error("Not found");

  // Restore parent chain
  const restoreParentChain = async (parentId: string | null) => {
    if (!parentId) return;
    const parent = await db.document.findUnique({ where: { id: parentId } });
    if (parent && parent.isArchived) {
      await db.document.update({
        where: { id: parentId },
        data: { isArchived: false },
      });
      await restoreParentChain(parent.parentId);
    }
  };

  await restoreParentChain(doc.parentId);
  await db.document.update({
    where: { id: documentId },
    data: { isArchived: false },
  });

  revalidatePath("/documents");
}

// PERMANENT DELETE
export async function deleteDocument(documentId: string) {
  const user = await getCurrentUser();

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.userId !== user.id) throw new Error("Not found");

  // Delete children first (cascade)
  const deleteRecursive = async (id: string) => {
    const children = await db.document.findMany({
      where: { parentId: id },
    });
    for (const child of children) {
      await deleteRecursive(child.id);
    }
    await db.document.delete({ where: { id } });
  };

  await deleteRecursive(documentId);
  revalidatePath("/documents");
}

// GET TRASH
export async function getTrashDocuments() {
  const user = await getCurrentUser();

  return db.document.findMany({
    where: {
      userId: user.id,
      isArchived: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}