import { redirect } from "next/navigation";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === "your_supabase_url_here") {
    redirect("/login");
  }

  const { createClient } = await import("@/lib/supabase/server");
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

  if (hero) {
    redirect("/missions");
  } else {
    redirect("/onboarding");
  }
}
