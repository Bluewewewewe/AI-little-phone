import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

async function getUserByToken(
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
  authToken: string
): Promise<Record<string, unknown> | null> {
  const { data: session } = await supabase
    .from("user_sessions")
    .select("user_id")
    .eq("token", authToken)
    .gte("expires_at", new Date().toISOString())
    .single();
  if (!session) return null;
  const { data: user } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("id", session.user_id as string)
    .single();
  return user || null;
}

function requireAdminAuth(
  request: NextRequest
): { token: string | null; error: NextResponse | null } {
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;
  try {
    const body = request.body ? JSON.parse(request.body as unknown as string) : {};
    token = body.authToken || null;
  } catch {
    token = null;
  }
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  if (!token) {
    return {
      token: null,
      error: NextResponse.json({ error: "缺少 token" }, { status: 401 }),
    };
  }
  return { token, error: null };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { token, error } = requireAdminAuth(request);
    if (error || !token) return error!;

    const adminUser = await getUserByToken(supabase, token);
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "super_admin")) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }
    if (adminUser.status !== "approved") {
      return NextResponse.json({ error: "账号未审核通过" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [{ count: totalUsers }, { count: verifiedUsers }, { count: pendingUsers }, { count: bannedUsers }, { count: todayNewUsers }, { count: violationUsers }] =
      await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("verify_status", "verified"),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .in("ban_status", ["temp_banned", "perma_banned"]),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayIso),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gt("violation_count", 0),
      ]);

    const weeklyRegistrations: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.toISOString();
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const end = next.toISOString();
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start)
        .lt("created_at", end);
      weeklyRegistrations.push({
        date: d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
        count: count || 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        pendingUsers: pendingUsers || 0,
        bannedUsers: bannedUsers || 0,
        todayNewUsers: todayNewUsers || 0,
        violationUsers: violationUsers || 0,
        weeklyRegistrations,
      },
    });
  } catch (err) {
    console.error("admin stats error:", err);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
