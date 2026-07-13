import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, code, maxUses, expiresInDays, note } = body;

    const supabase = await getSupabaseClient();

    // ========== 生成邀请码（管理员） ==========
    if (action === "generate") {
      if (!username) {
        return NextResponse.json({ error: "缺少用户名" }, { status: 400 });
      }

      // 验证是否为管理员
      const { data: user } = await supabase
        .from("users")
        .select("id, is_admin, admin_approved, level")
        .eq("username", username)
        .single();

      if (!user || (!(user.is_admin && user.admin_approved) && user.level < 99)) {
        return NextResponse.json({ error: "无权操作：你不是管理员" }, { status: 403 });
      }

      // 生成随机邀请码
      const inviteCode = `INV-${randomUUID().slice(0, 8).toUpperCase()}`;
      
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("invitation_codes")
        .insert({
          code: inviteCode,
          created_by: username,
          created_by_id: user.id,
          max_uses: maxUses || 1,
          expires_at: expiresAt,
          is_active: true,
          note: note || "",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    // ========== 验证邀请码 ==========
    if (action === "validate") {
      if (!code) {
        return NextResponse.json({ valid: false, error: "请输入邀请码" });
      }

      const { data: invite, error } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !invite) {
        return NextResponse.json({ valid: false, error: "邀请码无效" });
      }

      // 检查是否过期
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ valid: false, error: "邀请码已过期" });
      }

      // 检查使用次数
      if (invite.use_count >= invite.max_uses) {
        return NextResponse.json({ valid: false, error: "邀请码已达到使用上限" });
      }

      return NextResponse.json({
        valid: true,
        data: {
          code: invite.code,
          createdBy: invite.created_by,
          remainingUses: invite.max_uses - invite.use_count,
        }
      });
    }

    // ========== 使用邀请码（注册时调用） ==========
    if (action === "use") {
      if (!code || !username) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      const { data: invite } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (!invite) {
        return NextResponse.json({ error: "邀请码无效" }, { status: 400 });
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ error: "邀请码已过期" }, { status: 400 });
      }

      if (invite.use_count >= invite.max_uses) {
        return NextResponse.json({ error: "邀请码已达到使用上限" }, { status: 400 });
      }

      // 获取用户ID
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      // 更新邀请码使用记录
      await supabase
        .from("invitation_codes")
        .update({
          use_count: invite.use_count + 1,
          used_by: username,
          used_by_id: userData?.id || null,
          used_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      // 如果达到上限，自动停用
      if (invite.use_count + 1 >= invite.max_uses) {
        await supabase
          .from("invitation_codes")
          .update({ is_active: false })
          .eq("id", invite.id);
      }

      return NextResponse.json({ success: true, invitedBy: invite.created_by });
    }

    // ========== 获取所有邀请码列表（管理员） ==========
    if (action === "list") {
      const { data, error } = await supabase
        .from("invitation_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // ========== 获取邀请关系树（管理员） ==========
    if (action === "tree") {
      // 获取所有有邀请关系的用户
      const { data: users, error } = await supabase
        .from("users")
        .select("id, username, display_name, level, is_admin, admin_approved, invited_by, created_at")
        .not("invited_by", "is", null)
        .order("created_at", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 同时获取所有管理员（作为根节点）
      const { data: admins } = await supabase
        .from("users")
        .select("id, username, display_name, level, is_admin, admin_approved, created_at")
        .or("is_admin.eq.true,level.gte.99")
        .order("created_at", { ascending: true });

      return NextResponse.json({
        success: true,
        data: {
          invited: users || [],
          admins: admins || [],
        }
      });
    }

    // ========== 获取我的邀请码 ==========
    if (action === "my_codes") {
      if (!username) {
        return NextResponse.json({ error: "缺少用户名" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("created_by", username)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 统计：总邀请人数
      const { data: invitedUsers } = await supabase
        .from("users")
        .select("username, display_name, created_at")
        .eq("invited_by", username);

      return NextResponse.json({
        success: true,
        data: {
          codes: data || [],
          invitedUsers: invitedUsers || [],
          totalInvited: (invitedUsers || []).length,
        }
      });
    }

    // ========== 获取系统设置 ==========
    if (action === "get_settings") {
      const { data } = await supabase
        .from("system_settings")
        .select("*");

      const settings: Record<string, string> = {};
      if (data) {
        data.forEach((item: { key: string; value: string }) => {
          settings[item.key] = item.value;
        });
      }

      return NextResponse.json({ success: true, data: settings });
    }

    // ========== 更新系统设置（管理员） ==========
    if (action === "update_settings") {
      const { key, value } = body;
      if (!key) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      // 验证管理员权限
      if (username) {
        const { data: user } = await supabase
          .from("users")
          .select("is_admin, admin_approved, level")
          .eq("username", username)
          .single();

        if (!user || (!(user.is_admin && user.admin_approved) && user.level < 99)) {
          return NextResponse.json({ error: "无权操作" }, { status: 403 });
        }
      }

      await supabase
        .from("system_settings")
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() });

      return NextResponse.json({ success: true });
    }

    // ========== 停用邀请码 ==========
    if (action === "deactivate") {
      if (!code) {
        return NextResponse.json({ error: "缺少邀请码" }, { status: 400 });
      }

      await supabase
        .from("invitation_codes")
        .update({ is_active: false })
        .eq("code", code);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  } catch (err) {
    console.error("Invite API error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
