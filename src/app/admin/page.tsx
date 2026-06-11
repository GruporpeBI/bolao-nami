import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { IconEscudo } from "@/components/icons";
import AdminTabs from "./AdminTabs";
import LogoutButton from "./LogoutButton";
import { getLocationConfig } from "./actions";
import { getTenantId } from "@/lib/tenant";
import type { Database } from "@/lib/supabase/types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AttendanceRow = Database["public"]["Tables"]["attendances"]["Row"];

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_access");
  const supabase = await createClient();

  if (!adminCookie) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      redirect("/");
    }
  }

  const tenant = getTenantId();
  // Senha mestra libera as abas COMPARTILHADAS (Jogos da Copa / Resultados)
  const isMaster = !!cookieStore.get("master_admin");

  // Jogos são COMPARTILHADOS (sem filtro de tenant)
  const { data: gamesData } = await supabase
    .from("games")
    .select("*")
    .order("scheduled_at", { ascending: true });

  // Usuários e presenças são DESTE tenant
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name")
    .eq("tenant_id", tenant)
    .order("name", { ascending: true });

  const { data: attendancesData } = await supabase
    .from("attendances")
    .select("user_id, game_id")
    .eq("tenant_id", tenant);

  const games = (gamesData as GameRow[] | null) ?? [];
  const users = (usersData as Pick<UserRow, "id" | "name">[] | null) ?? [];
  const attendances = (attendancesData as Pick<AttendanceRow, "user_id" | "game_id">[] | null) ?? [];
  const locationConfig = await getLocationConfig();

  return (
    <main className="min-h-screen bg-[#1A1A1A]">
      <header className="border-b border-[#F6C900]/20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <IconEscudo width={32} height={54} />
          <div className="flex-1">
            <p className="text-[#FAF6EB]/40 text-xs uppercase tracking-widest">Mercearia Amauri</p>
            <h1 className="text-[#F6C900] font-bold text-lg leading-tight">Painel Admin</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <AdminTabs
          games={games}
          users={users}
          attendances={attendances}
          locationConfig={locationConfig}
          isMaster={isMaster}
        />
      </div>
    </main>
  );
}
