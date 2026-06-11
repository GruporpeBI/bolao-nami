import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Tenant deste deploy. O site original (Mercearia Amauri) é o DEFAULT.
// Cada bolão (fork) define NEXT_PUBLIC_TENANT_ID no seu projeto Vercel.
export const DEFAULT_TENANT = "amauri";

export function getTenantId(): string {
  return process.env.NEXT_PUBLIC_TENANT_ID ?? DEFAULT_TENANT;
}

// E-mail sintético do auth, RETROCOMPATÍVEL:
// - tenant default (amauri) mantém o formato atual → logins existentes intactos.
// - novos tenants usam sufixo → mesmo CPF = identidade separada por bolão.
export function tenantEmail(cpf: string, tenant: string = getTenantId()): string {
  return tenant === DEFAULT_TENANT
    ? `${cpf}@bolao.internal`
    : `${cpf}@${tenant}.bolao.internal`;
}

function adminAuthClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Resolve o id da linha em public.users do usuário logado, de forma ROBUSTA:
// 1) usa user_metadata.users_table_id se ele existir em public.users (no tenant);
// 2) senão, resolve pelo CPF (parte local do e-mail do auth) dentro do tenant
//    e RE-GRAVA o metadata (auto-correção — blinda contra exclusão/recriação manual).
// Retorna null se não houver usuário logado / sem linha correspondente.
export async function resolveDbUserId(
  supabase: SupabaseClient
): Promise<string | null> {
  const tenant = getTenantId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const metaId = user.user_metadata?.users_table_id as string | undefined;
  if (metaId) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("id", metaId)
      .eq("tenant_id", tenant)
      .maybeSingle();
    if (data) return metaId;
  }

  // Fallback pelo CPF (e-mail = `${cpf}@...`)
  const cpf = (user.email ?? "").split("@")[0].replace(/\D/g, "");
  if (cpf.length === 11) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("cpf", cpf)
      .eq("tenant_id", tenant)
      .maybeSingle();
    const id = (data as { id: string } | null)?.id ?? null;
    if (id && id !== metaId) {
      try {
        await adminAuthClient().auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, users_table_id: id },
        });
      } catch {
        // auto-heal é best-effort; o id já está correto para esta requisição
      }
    }
    return id;
  }

  return null;
}
