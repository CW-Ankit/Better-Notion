import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { SidebarWrapper } from "@/components/sidebar-wrapper";

export default async function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const user = {
    email: data.claims.email as string,
    name: (data.claims.user_metadata as any)?.name ?? null,
    imageUrl: (data.claims.user_metadata as any)?.avatar_url ?? null,
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <SidebarWrapper user={user} />
        <main className="flex-1">
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </header>
          <div className="flex-1">{children}</div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}