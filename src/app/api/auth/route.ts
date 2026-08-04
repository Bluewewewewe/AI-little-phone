import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { randomUUID } from "crypto";

function generateInviteCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${result}`;
}

async function createDefaultInviteCodes(
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
  userId: string
): Promise<void> {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    let code = generateInviteCode("MIMI-");
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("invitation_codes")
        .select("id")
        .eq("code", code)
        .single();
      if (!existing) break;
      code = generateInviteCode("MIMI-");
      attempts++;
    }
    codes.push(code);
  }

  const insertData = codes.map((code) => ({
    code,
    created_by: userId,
    max_uses: 1,
    use_count: 0,
    is_active: true,
  }));

  const { error } = await supabase.from("invitation_codes").insert(insertData);
  if (error) {
    console.error("自动生成邀请码失败:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, displayName, deviceInfo, token, targetUserId, requestAdmin, invitationCode } = body;

    if (!username && !token && !targetUserId) {
      // 部分 action 不需要 username
      const noUsernameActions = ["list_pending_admins", "list_admins", "list_users", "validate", "logout", "get_invite_settings"];
      if (!noUsernameActions.includes(action)) {
        return NextResponse.json(
          { error: "缺少必要参数" },
          { status: 400 }
        );
      }
    }

    const supabase = await getSupabaseClient();

    // ========== 注册 ==========
    if (action === "register") {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "用户名已存在，请换一个" },
          { status: 409 }
        );
      }

      // 密码不能和用户名相同
      if (password.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json(
          { error: "密码不能和用户名相同，请设置一个不同的密码" },
          { status: 400 }
        );
      }

      // 检查是否需要邀请码
      const { data: setting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "invite_required")
        .single();

      const inviteRequired = setting?.value === "true";

      let invitedBy: string | null = null;

      if (inviteRequired) {
        if (!invitationCode) {
          return NextResponse.json(
            { error: "当前需要邀请码才能注册，请联系管理员或已有用户获取邀请码" },
            { status: 400 }
          );
        }

        // 验证邀请码
        const { data: invite } = await supabase
          .from("invitation_codes")
          .select("*")
          .eq("code", invitationCode.toUpperCase().trim())
          .eq("is_active", true)
          .single();

        if (!invite) {
          return NextResponse.json(
            { error: "邀请码无效" },
            { status: 400 }
          );
        }

        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
          return NextResponse.json(
            { error: "邀请码已过期" },
            { status: 400 }
          );
        }

        if (invite.use_count >= invite.max_uses) {
          return NextResponse.json(
            { error: "邀请码已达到使用上限" },
            { status: 400 }
          );
        }

        invitedBy = invite.created_by;
      }

      const insertData: Record<string, unknown> = {
        username,
        password,
        display_name: displayName || username,
      };

      // 记录邀请关系
      if (invitedBy) {
        insertData.invited_by = invitedBy;
      }

      // 如果申请管理员，设置为待审批状态
      if (requestAdmin) {
        insertData.is_admin = true;
        insertData.admin_pending = true;
        insertData.admin_approved = false;
        insertData.level = 99;
      }

      const { data, error } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("注册失败:", error);
        return NextResponse.json(
          { error: "注册失败: " + error.message },
          { status: 500 }
        );
      }

      // 使用邀请码：更新使用次数
      if (invitedBy && invitationCode) {
        const { data: invite } = await supabase
          .from("invitation_codes")
          .select("*")
          .eq("code", invitationCode.toUpperCase().trim())
          .single();

        if (invite) {
          const newCount = invite.use_count + 1;
          await supabase
            .from("invitation_codes")
            .update({
              use_count: newCount,
              used_by: username,
              used_by_id: data.id,
              used_at: new Date().toISOString(),
              is_active: newCount < invite.max_uses,
            })
            .eq("id", invite.id);
        }
      }

      // 普通用户注册成功后自动生成 10 个邀请码
      if (!data.admin_pending) {
        await createDefaultInviteCodes(supabase, data.id);
      }

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          username: data.username,
          displayName: data.display_name,
          level: data.level,
          adminPending: data.admin_pending || false,
        },
      });
    }

    // ========== 登录 ==========
    if (action === "login") {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (error || !user) {
        return NextResponse.json(
          { error: "用户不存在，请先注册" },
          { status: 404 }
        );
      }

      if (user.password !== password) {
        return NextResponse.json(
          { error: "密码错误" },
          { status: 401 }
        );
      }

      // 如果是申请中的管理员，未审批前不能登录
      if (user.admin_pending && !user.admin_approved) {
        return NextResponse.json(
          { error: "管理员申请正在等待审批，请联系现有管理员同意后登录" },
          { status: 403 }
        );
      }

      // 单设备登录：踢掉旧会话
      await supabase.from("sessions").delete().eq("user_id", user.id);

      const newToken = randomUUID();
      const { error: sessionError } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          token: newToken,
          device_info: deviceInfo || "未知设备",
        });

      if (sessionError) {
        console.error("创建会话失败:", sessionError);
      }

      const isAdminUser = (user.is_admin && user.admin_approved) || user.level >= 99;
      const isDefaultPassword = user.password === "admin123" || user.password === user.username;

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          level: user.level,
          role: user.role || 'user',
          weiboVerified: user.weibo_verified,
          weiboUid: user.weibo_uid,
          isAdmin: isAdminUser,
          isDefaultPassword,
          token: newToken,
        },
      });
    }

    // ========== 验证 Token ==========
    if (action === "validate") {
      if (!token) {
        return NextResponse.json({ valid: false, error: "缺少 token" });
      }

      const { data: session } = await supabase
        .from("sessions")
        .select("*, users(username, display_name, level, weibo_verified, is_admin, admin_approved, password)")
        .eq("token", token)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json({ valid: false, error: "登录已过期，请重新登录" });
      }

      const u = session.users as Record<string, unknown>;
      const isAdminUser = (u.is_admin && u.admin_approved) || (u.level as number) >= 99;
      const isDefaultPassword = (u.password as string) === "admin123" || (u.password as string) === (u.username as string);

      return NextResponse.json({
        valid: true,
        data: {
          id: session.user_id,
          username: u.username,
          displayName: u.display_name,
          level: u.level,
          weiboVerified: u.weibo_verified,
          isAdmin: isAdminUser,
          isDefaultPassword,
        },
      });
    }

    // ========== 登出 ==========
    if (action === "logout") {
      if (token) {
        await supabase.from("sessions").delete().eq("token", token);
      }
      return NextResponse.json({ success: true });
    }

    // ========== 管理员审批 - 通过 ==========
    if (action === "approve_admin") {
      if (!targetUserId || !username) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      // 验证操作者是否为已审批的管理员
      const { data: operator } = await supabase
        .from("users")
        .select("id, is_admin, admin_approved, level")
        .eq("username", username)
        .single();

      if (!operator || (!(operator.is_admin && operator.admin_approved) && operator.level < 99)) {
        return NextResponse.json({ error: "无权操作：你不是管理员" }, { status: 403 });
      }

      // 审批通过
      const { error } = await supabase
        .from("users")
        .update({
          admin_approved: true,
          admin_pending: false,
          approved_by: username,
          approved_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (error) {
        return NextResponse.json({ error: "审批失败: " + error.message }, { status: 500 });
      }

      // 审批通过后，为新管理员自动生成10个邀请码
      await createDefaultInviteCodes(supabase, targetUserId);

      return NextResponse.json({ success: true, message: "已通过" });
    }

    // ========== 管理员审批 - 拒绝 ==========
    if (action === "reject_admin") {
      if (!targetUserId || !username) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      const { data: operator } = await supabase
        .from("users")
        .select("id, is_admin, admin_approved, level")
        .eq("username", username)
        .single();

      if (!operator || (!(operator.is_admin && operator.admin_approved) && operator.level < 99)) {
        return NextResponse.json({ error: "无权操作：你不是管理员" }, { status: 403 });
      }

      // 拒绝：取消管理员身份
      const { error } = await supabase
        .from("users")
        .update({
          is_admin: false,
          admin_pending: false,
          admin_approved: false,
          level: 1,
        })
        .eq("id", targetUserId);

      if (error) {
        return NextResponse.json({ error: "操作失败: " + error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "已拒绝" });
    }

    // ========== 获取待审批管理员列表 ==========
    if (action === "list_pending_admins") {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, level, created_at")
        .eq("admin_pending", true)
        .eq("admin_approved", false)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // ========== 获取所有管理员列表 ==========
    if (action === "list_admins") {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, level, is_admin, admin_approved, admin_pending, approved_by, approved_at, created_at")
        .eq("is_admin", true)
        .order("admin_approved", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // ========== 获取所有用户列表（含微博信息） ==========
    if (action === "list_users") {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, level, is_admin, admin_approved, weibo_verified, weibo_uid, weibo_name, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // ========== 获取邀请码设置 ==========
    if (action === "get_invite_settings") {
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

    // ========== 角色管理（管理员升级用户） ==========
    if (action === "set_role") {
      const { targetUserId, role } = await request.json();

      if (!targetUserId || !role) {
        return NextResponse.json(
          { error: "缺少必要参数" },
          { status: 400 }
        );
      }

      // 验证角色值
      const validRoles = ['user', 'teacher', 'leader', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "无效的角色" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("users")
        .update({ role: role })
        .eq("id", targetUserId);

      if (error) {
        console.error("更新角色失败:", error);
        return NextResponse.json(
          { error: "更新角色失败" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: `角色已更新为 ${role}` });
    }

    // ========== 修改密码/昵称 ==========
    if (action === "change_password") {
      const { token: authToken, currentPassword, newPassword, newDisplayName } = body;

      if (!authToken || !currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "缺少必要参数" },
          { status: 400 }
        );
      }

      if (newPassword.length < 4) {
        return NextResponse.json(
          { error: "新密码至少4位" },
          { status: 400 }
        );
      }

      const { data: session } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("token", authToken)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "登录已过期，请重新登录" },
          { status: 401 }
        );
      }

      const user = session.users as Record<string, unknown>;
      if ((user.password as string) !== currentPassword) {
        return NextResponse.json(
          { error: "当前密码错误" },
          { status: 403 }
        );
      }

      const updateData: Record<string, unknown> = {
        password: newPassword,
      };
      if (newDisplayName && newDisplayName.trim()) {
        updateData.display_name = newDisplayName.trim();
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", session.user_id);

      if (error) {
        console.error("修改密码失败:", error);
        return NextResponse.json(
          { error: "修改失败: " + error.message },
          { status: 500 }
        );
      }

      // 修改成功后清除该用户所有会话，要求重新登录
      await supabase.from("sessions").delete().eq("user_id", session.user_id);

      return NextResponse.json({
        success: true,
        message: "修改成功，请使用新密码重新登录",
      });
    }

    // ========== 生成邀请码 ==========
    if (action === "generate_invite_codes") {
      const { token: authToken, count, roleType } = body;

      if (!authToken || !count || count < 1) {
        return NextResponse.json(
          { error: "缺少必要参数" },
          { status: 400 }
        );
      }

      const { data: session } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("token", authToken)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "登录已过期" },
          { status: 401 }
        );
      }

      const user = session.users as Record<string, unknown>;
      const isSuperAdmin = (user.is_admin && user.admin_approved) || (user.level as number) >= 99;
      const isAdmin = user.is_admin && user.admin_approved;

      if (!isAdmin && !isSuperAdmin) {
        return NextResponse.json(
          { error: "无权操作：需要管理员身份" },
          { status: 403 }
        );
      }

      const targetRole = roleType === "admin" ? "admin" : "user";

      // 普通管理员只能生成普通用户邀请码
      if (!isSuperAdmin && targetRole === "admin") {
        return NextResponse.json(
          { error: "只有大管理员可以生成管理员邀请码" },
          { status: 403 }
        );
      }

      // 普通管理员每次最多生成10个
      const generateCount = Math.min(count, isSuperAdmin ? 100 : 10);
      const prefix = targetRole === "admin" ? "ADMIN-" : "MIMI-";
      const codes: string[] = [];

      for (let i = 0; i < generateCount; i++) {
        let code = generateInviteCode(prefix);
        let attempts = 0;
        // 避免重复
        while (attempts < 5) {
          const { data: existing } = await supabase
            .from("invitation_codes")
            .select("id")
            .eq("code", code)
            .single();
          if (!existing) break;
          code = generateInviteCode(prefix);
          attempts++;
        }
        codes.push(code);
      }

      const insertData = codes.map((code) => ({
        code,
        created_by: session.user_id,
        max_uses: 1,
        use_count: 0,
        is_active: true,
      }));

      const { error } = await supabase
        .from("invitation_codes")
        .insert(insertData);

      if (error) {
        console.error("生成邀请码失败:", error);
        return NextResponse.json(
          { error: "生成失败: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: codes,
        message: `成功生成 ${codes.length} 个邀请码`,
      });
    }

    // ========== 获取我的邀请码 ==========
    if (action === "list_my_invite_codes") {
      const { token: authToken } = body;

      if (!authToken) {
        return NextResponse.json(
          { error: "缺少 token" },
          { status: 400 }
        );
      }

      const { data: session } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("token", authToken)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json(
          { error: "登录已过期" },
          { status: 401 }
        );
      }

      const { data, error } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("created_by", session.user_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("获取邀请码失败:", error);
        return NextResponse.json(
          { error: "获取失败: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    return NextResponse.json(
      { error: "无效的操作" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Auth API error:", err);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
