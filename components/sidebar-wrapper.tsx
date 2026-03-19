"use client";

import dynamic from "next/dynamic";

const AppSidebar = dynamic(
  () => import("@/components/app-sidebar").then((mod) => mod.AppSidebar),
  { ssr: false }
);

interface UserData {
  email?: string;
  name?: string;
  imageUrl?: string;
}

export function SidebarWrapper({ user }: { user: UserData }) {
  return <AppSidebar user={user} />;
}