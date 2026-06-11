import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Libera as abas COMPARTILHADAS do admin (Jogos da Copa / Resultados) via senha mestra.
export async function POST(req: NextRequest) {
  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const master = process.env.MASTER_ADMIN_PASSWORD;
  if (!master) {
    return NextResponse.json({ error: "Senha mestra não configurada." }, { status: 500 });
  }
  if (body.password !== master) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("master_admin", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });

  return NextResponse.json({ ok: true });
}

// Trava de novo (logout do modo mestre)
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("master_admin");
  return NextResponse.json({ ok: true });
}
