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

function getStatusEmoji(banStatus: string, verifyStatus: string): string {
  if (banStatus === "perma_banned" || banStatus === "temp_banned") return "❌";
  if (banStatus === "muted" || banStatus === "restricted") return "⚠️";
  if (verifyStatus === "verified") return "✅";
  if (verifyStatus === "pending") return "⏳";
  return "❓";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authToken } = body;
    const supabase = await getSupabaseClient();

    if (!authToken) {
      return NextResponse.json({ error: "缺少 token" }, { status: 401 });
    }

    const adminUser = await getUserByToken(supabase, authToken);
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "super_admin")) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }
    if (adminUser.status !== "approved") {
      return NextResponse.json({ error: "账号未审核通过" }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from("users")
      .select(
        "id, username, nickname, display_name, verify_status, status, ban_status, referrer_id, violation_count, created_at"
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userList = (users || []).map((u) => ({
      ...u,
      name: u.nickname || u.display_name || u.username,
      statusEmoji: getStatusEmoji(u.ban_status || "none", u.verify_status || u.status || ""),
    }));

    const childrenMap: Record<string, typeof userList> = {};
    userList.forEach((u) => {
      const parentId = u.referrer_id || "root";
      if (!childrenMap[parentId]) childrenMap[parentId] = [];
      childrenMap[parentId].push(u);
    });

    function buildTree(parentId: string | null): unknown[] {
      const key = parentId || "root";
      const children = childrenMap[key] || [];
      return children.map((child) => ({
        user: child,
        invite_count: (childrenMap[child.id] || []).length,
        children: buildTree(child.id),
      }));
    }

    const tree = buildTree(null);

    return NextResponse.json({
      success: true,
      data: tree,
    });
  } catch (err) {
    console.error("admin tree error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
