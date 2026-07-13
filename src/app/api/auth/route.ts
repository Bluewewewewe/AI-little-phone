import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, displayName, deviceInfo } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();

    if (action === "register") {
      // Check if username already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "用户名已存在" },
          { status: 409 }
        );
      }

      // Create new user
      const { data, error } = await supabase
        .from("users")
        .insert({
          username,
          password, // In production, this should be hashed
          display_name: displayName || username,
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

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          username: data.username,
          displayName: data.display_name,
          level: data.level,
        },
      });
    }

    if (action === "login") {
      // Find user by username
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

      // Check password
      if (user.password !== password) {
        return NextResponse.json(
          { error: "密码错误" },
          { status: 401 }
        );
      }

      // 单设备登录：踢掉该用户的所有旧会话
      await supabase
        .from("sessions")
        .delete()
        .eq("user_id", user.id);

      // 创建新会话
      const token = randomUUID();
      const { error: sessionError } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          token,
          device_info: deviceInfo || "未知设备",
        });

      if (sessionError) {
        console.error("创建会话失败:", sessionError);
      }

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          level: user.level,
          weiboVerified: user.weibo_verified,
          weiboUid: user.weibo_uid,
          token, // 登录凭证，前端保存
        },
      });
    }

    if (action === "validate") {
      // 验证 token 是否有效
      const { token } = body;
      if (!token) {
        return NextResponse.json({ valid: false, error: "缺少 token" });
      }

      const { data: session } = await supabase
        .from("sessions")
        .select("*, users(username, display_name, level, weibo_verified)")
        .eq("token", token)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json({ valid: false, error: "登录已过期，请重新登录" });
      }

      return NextResponse.json({
        valid: true,
        data: {
          id: session.user_id,
          username: (session.users as Record<string, unknown>).username,
          displayName: (session.users as Record<string, unknown>).display_name,
          level: (session.users as Record<string, unknown>).level,
          weiboVerified: (session.users as Record<string, unknown>).weibo_verified,
        },
      });
    }

    if (action === "logout") {
      // 登出：删除当前 token 的会话
      const { token } = body;
      if (token) {
        await supabase.from("sessions").delete().eq("token", token);
      }
      return NextResponse.json({ success: true });
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
