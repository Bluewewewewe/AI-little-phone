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

function isSuperAdmin(user: Record<string, unknown>): boolean {
  return user.username === "admin" || (user.level as number) >= 99;
}

function isAdmin(user: Record<string, unknown>): boolean {
  return user.role === "admin" && user.status === "approved";
}

async function getUserByToken(
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
  authToken: string
): Promise<{ user: Record<string, unknown>; session: Record<string, unknown> } | null> {
  const { data: session } = await supabase
    .from("sessions")
    .select("*, users(*)")
    .eq("token", authToken)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (!session) return null;
  return { user: session.users as Record<string, unknown>, session };
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
        .from("invite_codes")
        .select("code")
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
    owner_id: userId,
    role_type: "user",
  }));

  const { error } = await supabase.from("invite_codes").insert(insertData);
  if (error) {
    console.error("自动生成邀请码失败:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      username,
      password,
      displayName,
      deviceInfo,
      token,
      targetUserId,
      targetUserIds,
      invitationCode,
      weiboName,
      reason,
      authToken,
      currentPassword,
      newPassword,
      newDisplayName,
      count,
      roleType,
      code,
    } = body;

    const supabase = await getSupabaseClient();

    // ========== 注册 ==========
    if (action === "register") {
      if (!username || !password || !invitationCode || !weiboName) {
        return NextResponse.json(
          { error: "请填写用户名、密码、微博昵称和邀请码" },
          { status: 400 }
        );
      }

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

      if (password.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json(
          { error: "密码不能和用户名相同，请设置一个不同的密码" },
          { status: 400 }
        );
      }

      const normalizedCode = invitationCode.toUpperCase().trim();

      // 验证邀请码
      const { data: invite } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", normalizedCode)
        .single();

      if (!invite) {
        return NextResponse.json(
          { error: "邀请码无效" },
          { status: 400 }
        );
      }

      if (invite.revoked_at) {
        return NextResponse.json(
          { error: "邀请码已作废" },
          { status: 400 }
        );
      }

      if (invite.used_by) {
        return NextResponse.json(
          { error: "邀请码已被使用" },
          { status: 400 }
        );
      }

      // 不可自邀：如果请求带了登录 token，且登录用户就是邀请码拥有者
      const selfInviteCheck = authToken
        ? await getUserByToken(supabase, authToken as string)
        : null;
      if (selfInviteCheck && selfInviteCheck.user.id === invite.owner_id) {
        return NextResponse.json(
          { error: "不能使用自己生成的邀请码注册" },
          { status: 400 }
        );
      }

      const role = invite.role_type === "admin" ? "admin" : "user";

      const { data, error } = await supabase
        .from("users")
        .insert({
          username,
          password,
          display_name: displayName || username,
          weibo_name: weiboName,
          role,
          status: "pending",
          invite_code_used: normalizedCode,
          referrer_id: invite.owner_id,
        })
        .select()
        .single();

      if (error) {
        console.error("注册失败:", error);
        return NextResponse.json(
          { error: "注册失败: " + error.message },
          { status: 500 }
        );
      }

      // 标记邀请码已使用
      await supabase
        .from("invite_codes")
        .update({ used_by: data.id })
        .eq("code", normalizedCode);

      return NextResponse.json({
        success: true,
        message: "注册成功，请等待管理员审核",
        data: {
          id: data.id,
          username: data.username,
          status: data.status,
          role: data.role,
        },
      });
    }

    // ========== 登录 ==========
    if (action === "login") {
      if (!username || !password) {
        return NextResponse.json(
          { error: "请输入用户名和密码" },
          { status: 400 }
        );
      }

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

      if (user.status === "pending") {
        return NextResponse.json(
          { error: "账号正在等待审核，请稍后再试" },
          { status: 403 }
        );
      }

      if (user.status === "rejected") {
        return NextResponse.json(
          { error: "账号审核未通过，请联系管理员" },
          { status: 403 }
        );
      }

      await supabase.from("sessions").delete().eq("user_id", user.id);

      const newToken = randomUUID();
      const { error: sessionError } = await supabase.from("sessions").insert({
        user_id: user.id,
        token: newToken,
        device_info: deviceInfo || "未知设备",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (sessionError) {
        console.error("创建会话失败:", sessionError);
      }

      const isAdminUser = isAdmin(user) || isSuperAdmin(user);
      const isDefaultPassword =
        user.password === "admin123" || user.password === user.username;

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          level: user.level,
          role: user.role || "user",
          weiboVerified: user.weibo_verified,
          weiboUid: user.weibo_uid,
          weiboName: user.weibo_name,
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

      const found = await getUserByToken(supabase, token as string);
      if (!found) {
        return NextResponse.json({ valid: false, error: "登录已过期，请重新登录" });
      }

      const u = found.user;
      if (u.status !== "approved") {
        return NextResponse.json({ valid: false, error: "账号状态异常" });
      }

      const isAdminUser = isAdmin(u) || isSuperAdmin(u);
      const isDefaultPassword =
        (u.password as string) === "admin123" ||
        (u.password as string) === (u.username as string);

      return NextResponse.json({
        valid: true,
        data: {
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          level: u.level,
          role: u.role || "user",
          weiboVerified: u.weibo_verified,
          weiboUid: u.weibo_uid,
          weiboName: u.weibo_name,
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

    // ========== 获取待审核用户列表 ==========
    if (action === "list_pending_users") {
      if (!authToken) {
        return NextResponse.json({ error: "缺少 token" }, { status: 401 });
      }

      const found = await getUserByToken(supabase, authToken as string);
      if (!found || (!isSuperAdmin(found.user) && !isAdmin(found.user))) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("users")
        .select(
          "id, username, display_name, weibo_name, invite_code_used, role, status, referrer_id, created_at"
        )
        .eq("status", "pending")
        .order("role", { ascending: false }) // admin 优先
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // ========== 通过用户 ==========
    if (action === "approve_user") {
      if (!authToken || !targetUserId) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      const found = await getUserByToken(supabase, authToken as string);
      if (!found || (!isSuperAdmin(found.user) && !isAdmin(found.user))) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }

      const { error } = await supabase
        .from("users")
        .update({
          status: "approved",
          reviewed_by: found.user.username,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (error) {
        return NextResponse.json(
          { error: "审核失败: " + error.message },
          { status: 500 }
        );
      }

      // 普通用户注册成功后自动生成 10 个普通用户邀请码
      await createDefaultInviteCodes(supabase, targetUserId as string);

      return NextResponse.json({ success: true, message: "已通过" });
    }

    // ========== 批量通过用户 ==========
    if (action === "batch_approve_users") {
      if (!authToken || !targetUserIds || !Array.isArray(targetUserIds)) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      const found = await getUserByToken(supabase, authToken as string);
      if (!found || (!isSuperAdmin(found.user) && !isAdmin(found.user))) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }

      const ids = (targetUserIds as string[]).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ error: "未选择用户" }, { status: 400 });
      }

      const { error } = await supabase
        .from("users")
        .update({
          status: "approved",
          reviewed_by: found.user.username,
          reviewed_at: new Date().toISOString(),
        })
        .in("id", ids);

      if (error) {
        return NextResponse.json(
          { error: "批量审核失败: " + error.message },
          { status: 500 }
        );
      }

      for (const uid of ids) {
        await createDefaultInviteCodes(supabase, uid);
      }

      return NextResponse.json({ success: true, message: `已通过 ${ids.length} 人` });
    }

    // ========== 拒绝用户 ==========
    if (action === "reject_user") {
      if (!authToken || !targetUserId) {
        return NextResponse.json({ error: "缺少参数" }, { status: 400 });
      }

      const found = await getUserByToken(supabase, authToken as string);
      if (!found || (!isSuperAdmin(found.user) && !isAdmin(found.user))) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }

      const { error } = await supabase
        .from("users")
        .update({
          status: "rejected",
          reviewed_by: found.user.username,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (error) {
        return NextResponse.json(
          { error: "操作失败: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "已拒绝" });
    }

    // ========== 获取所有用户列表 ==========
    if (action === "list_users") {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, username, display_name, level, role, status, weibo_verified, weibo_uid, weibo_name, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // ========== 角色管理 ==========
    if (action === "set_role") {
      const { targetUserId: roleTargetId, role } = body;

      if (!roleTargetId || !role) {
        return NextResponse.json(
          { error: "缺少必要参数" },
          { status: 400 }
        );
      }

      const validRoles = ["user", "teacher", "leader", "admin"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "无效的角色" }, { status: 400 });
      }

      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", roleTargetId);

      if (error) {
        console.error("更新角色失败:", error);
        return NextResponse.json({ error: "更新角色失败" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `角色已更新为 ${role}` });
    }

    // ========== 获取邀请码设置 ==========
    if (action === "get_invite_settings") {
      const { data } = await supabase.from("system_settings").select("*");

      const settings: Record<string, string> = {};
      if (data) {
        data.forEach((item: { key: string; value: string }) => {
          settings[item.key] = item.value;
        });
      }

      return NextResponse.json({ success: true, data: settings });
    }

    // ========== 修改密码/昵称 ==========
    if (action === "change_password") {
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

      const found = await getUserByToken(supabase, authToken as string);
      if (!found) {
        return NextResponse.json(
          { error: "登录已过期，请重新登录" },
          { status: 401 }
        );
      }

      const user = found.user;
      if ((user.password as string) !== currentPassword) {
        return NextResponse.json(
          { error: "当前密码错误" },
          { status: 403 }
        );
      }

      const updateData: Record<string, unknown> = { password: newPassword };
      if (newDisplayName && newDisplayName.trim()) {
        updateData.display_name = newDisplayName.trim();
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("修改密码失败:", error);
        return NextResponse.json(
          { error: "修改失败: " + error.message },
          { status: 500 }
        );
      }

      await supabase.from("sessions").delete().eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        message: "修改成功，请使用新密码重新登录",
      });
    }

    // ========== 生成邀请码 ==========
    if (action === "generate_invite_codes") {
      if (!authToken || !count || count < 1) {
        return NextResponse.json(
          { error: "缺少必要参数" },
          { status: 400 }
        );
      }

      const found = await getUserByToken(supabase, authToken as string);
      if (!found || (!isSuperAdmin(found.user) && !isAdmin(found.user))) {
        return NextResponse.json(
          { error: "无权操作：需要管理员身份" },
          { status: 403 }
        );
      }

      const user = found.user;
      const targetRole = roleType === "admin" ? "admin" : "user";

      // 普通管理员只能生成普通用户邀请码
      if (!isSuperAdmin(user) && targetRole === "admin") {
        return NextResponse.json(
          { error: "只有大管理员可以生成管理员邀请码" },
          { status: 403 }
        );
      }

      // 普通管理员最多持有 10 个邀请码（已用+未用）
      if (!isSuperAdmin(user)) {
        const { count: existingCount, error: countError } = await supabase
          .from("invite_codes")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id);

        if (countError) {
          return NextResponse.json(
            { error: "查询邀请码失败: " + countError.message },
            { status: 500 }
          );
        }

        if ((existingCount || 0) + (count as number) > 10) {
          return NextResponse.json(
            { error: "普通管理员最多拥有 10 个邀请码" },
            { status: 403 }
          );
        }
      }

      const generateCount = Math.min(count as number, isSuperAdmin(user) ? 1000 : 10);
      const prefix = targetRole === "admin" ? "ADMIN-" : "MIMI-";
      const codes: string[] = [];

      for (let i = 0; i < generateCount; i++) {
        let code = generateInviteCode(prefix);
        let attempts = 0;
        while (attempts < 5) {
          const { data: existing } = await supabase
            .from("invite_codes")
            .select("code")
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
        owner_id: user.id,
        role_type: targetRole,
      }));

      const { error } = await supabase.from("invite_codes").insert(insertData);

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
      if (!authToken) {
        return NextResponse.json(
          { error: "缺少 token" },
          { status: 400 }
        );
      }

      const found = await getUserByToken(supabase, authToken as string);
      if (!found) {
        return NextResponse.json(
          { error: "登录已过期" },
          { status: 401 }
        );
      }

      const { data, error } = await supabase
        .from("invite_codes")
        .select("code, owner_id, role_type, used_by, created_at, revoked_at")
        .eq("owner_id", found.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("获取邀请码失败:", error);
        return NextResponse.json(
          { error: "获取失败: " + error.message },
          { status: 500 }
        );
      }

      const codes = data || [];
      const usedByIds = Array.from(
        new Set(codes.map((c) => c.used_by).filter(Boolean))
      );
      let usersMap: Record<string, string> = {};
      if (usedByIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, username")
          .in("id", usedByIds);
        usersMap = (usersData || []).reduce(
          (acc, u) => {
            acc[u.id] = u.username;
            return acc;
          },
          {} as Record<string, string>
        );
      }

      return NextResponse.json({
        success: true,
        data: codes.map((c) => ({
          ...c,
          used_by_username: c.used_by ? usersMap[c.used_by] || c.used_by : null,
        })),
      });
    }

    // ========== 作废邀请码 ==========
    if (action === "revoke_invite_code") {
      if (!authToken || !code) {
        return NextResponse.json(
          { error: "缺少参数" },
          { status: 400 }
        );
      }

      const found = await getUserByToken(supabase, authToken as string);
      if (!found) {
        return NextResponse.json(
          { error: "登录已过期" },
          { status: 401 }
        );
      }

      const { data: invite } = await supabase
        .from("invite_codes")
        .select("owner_id, used_by")
        .eq("code", (code as string).toUpperCase().trim())
        .single();

      if (!invite) {
        return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
      }

      if (invite.owner_id !== found.user.id && !isSuperAdmin(found.user)) {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }

      if (invite.used_by) {
        return NextResponse.json(
          { error: "已使用的邀请码不能作废" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("invite_codes")
        .update({ revoked_at: new Date().toISOString() })
        .eq("code", (code as string).toUpperCase().trim());

      if (error) {
        return NextResponse.json(
          { error: "作废失败: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "已作废" });
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
