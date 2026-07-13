import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, displayName } = body;

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

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          level: user.level,
          weiboVerified: user.weibo_verified,
          weiboUid: user.weibo_uid,
        },
      });
    }

    return NextResponse.json(
      { error: "无效的操作" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
