import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/documents");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">Better Notion</h1>
      <p className="mt-4 text-lg text-gray-600">
        An open-source Notion alternative
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/auth/login"
          className="rounded-md bg-black px-6 py-2 text-white hover:bg-gray-800"
        >
          Sign in
        </a>
        <a
          href="/auth/signup"
          className="rounded-md border px-6 py-2 hover:bg-gray-50"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}