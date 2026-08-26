import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { requirePermissionRequest, logAudit } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const adminUser = await requirePermissionRequest(request, "stats_view");

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
          .eq("verify_status", "pending"),
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

    await logAudit(adminUser.id, adminUser.username, "stats_view", "system", "dashboard");

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
