import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="text-gray-600">Welcome, {data.claims.email}</p>
        </div>
        <SignOutButton />
      </div>
      <div className="mt-8 rounded-lg border border-dashed p-12 text-center text-gray-500">
        No documents yet. Start creating!
      </div>
    </div>
  );
}