"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getTenantId, tenantEmail } from "@/lib/tenant";

function getAdminAuthClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function checkCpfExists(
  cpf: string
): Promise<{ found: boolean; name?: string; error?: string }> {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return { found: false, error: "CPF inválido." };

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("id, name")
      .eq("cpf", clean)
      .eq("tenant_id", getTenantId())
      .maybeSingle();

    if (data) return { found: true, name: (data as { id: string; name: string }).name };
    return { found: false };
  } catch {
    return { found: false, error: "Serviço indisponível. Tente novamente." };
  }
}

export async function loginByCpf(
  cpf: string
): Promise<{ success: boolean; error?: string }> {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return { success: false, error: "CPF inválido." };

  const supabase = await createClient();
  const tenant = getTenantId();
  const email = tenantEmail(clean, tenant);
  const password = `bolao_${clean}_2026`;

  // Tenta login direto (usuário já tem conta Auth confirmada)
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError) return { success: true };

  // Sem conta Auth ainda — verifica se existe na tabela users (deste tenant)
  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("cpf", clean)
    .eq("tenant_id", tenant)
    .maybeSingle();

  if (!dbUser) return { success: false, error: "CPF não encontrado." };

  // Cria conta Auth com email_confirm: true (evita dependência de confirmação por email)
  const adminClient = getAdminAuthClient();
  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { users_table_id: (dbUser as { id: string }).id, tenant_id: tenant },
  });

  if (createError) return { success: false, error: "Erro ao criar sessão. Tente novamente." };

  // Login após criação
  const { error: finalError } = await supabase.auth.signInWithPassword({ email, password });
  if (finalError) return { success: false, error: "Conta criada. Tente entrar novamente." };

  return { success: true };
}

export async function registerUser(formData: {
  name: string;
  phone: string;
  cpf: string;
  birth_date: string;
  accepted_terms: boolean;
}): Promise<{ success: boolean; error?: string }> {
  if (!formData.accepted_terms) {
    return { success: false, error: "Você precisa aceitar os termos para participar." };
  }

  const birthDate = new Date(formData.birth_date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;

  if (actualAge < 18) {
    return { success: false, error: "Você precisa ter 18 anos ou mais para participar." };
  }

  const cleanCpf = formData.cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) {
    return { success: false, error: "CPF inválido." };
  }

  try {
    const supabase = await createClient();
    const tenant = getTenantId();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("cpf", cleanCpf)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Este CPF já está cadastrado." };
    }

    // Insere na tabela users (deste tenant)
    const { error } = await supabase.from("users").insert({
      name: formData.name.trim(),
      phone: formData.phone.replace(/\D/g, ""),
      cpf: cleanCpf,
      birth_date: formData.birth_date,
      accepted_terms_at: new Date().toISOString(),
      tenant_id: tenant,
    } as never);

    if (error) {
      return { success: false, error: "Erro ao salvar cadastro. Tente novamente." };
    }

    // Busca o ID gerado
    const { data: newUser } = await supabase
      .from("users")
      .select("id")
      .eq("cpf", cleanCpf)
      .eq("tenant_id", tenant)
      .maybeSingle();

    // Cria conta Auth com email já confirmado
    const email = tenantEmail(cleanCpf, tenant);
    const password = `bolao_${cleanCpf}_2026`;
    const adminClient = getAdminAuthClient();

    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { users_table_id: (newUser as { id: string } | null)?.id, tenant_id: tenant },
    });

    // Faz login imediatamente após o cadastro
    await supabase.auth.signInWithPassword({ email, password });

    revalidatePath("/ranking");
    return { success: true };
  } catch {
    return { success: false, error: "Serviço temporariamente indisponível. Tente novamente em breve." };
  }
}
