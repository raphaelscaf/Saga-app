import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroHeader } from "@/components/hero-header";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: hero } = await supabase
    .from("heroes")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!hero) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-col h-dvh bg-background bg-grid">
      <HeroHeader />
      <main className="flex-1 overflow-y-auto pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
