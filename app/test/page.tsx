import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/prisma";

export default async function TestPage() {
  // Test Supabase Auth
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Test Prisma DB
  const userCount = await db.user.count();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">✅ Connection Test</h1>
      <p>
        <strong>Supabase Auth:</strong>{" "}
        {data?.claims ? data.claims.email : "Not logged in (working!)"}
      </p>
      <p>
        <strong>Prisma DB:</strong> {userCount} users in database (working!)
      </p>
    </div>
  );
}