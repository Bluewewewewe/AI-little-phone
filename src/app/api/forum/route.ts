import { NextRequest, NextResponse } from "next/server";
import getSupabaseClient from "@/storage/database/supabase-client";
import {
  requireAuthRequest,
  requirePermissionRequest,
  logAudit,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

function checkBanForForum(user: Awaited<ReturnType<typeof requireAuthRequest>>): NextResponse | null {
  const banStatus = user.banStatus;
  const banUntil = user.banUntil;
  if (banStatus === "temp_banned" && banUntil) {
    const until = new Date(banUntil);
    if (new Date() >= until) {
      return null;
    }
  }
  if (banStatus === "perma_banned" || banStatus === "temp_banned") {
    return NextResponse.json(
      { success: false, error: "账号已被封禁，无法操作" },
      { status: 403 }
    );
  }
  if (banStatus === "muted") {
    return NextResponse.json(
      { success: false, error: "账号已被禁言" },
      { status: 403 }
    );
  }
  if (banStatus === "restricted") {
    return NextResponse.json(
      { success: false, error: "账号功能受限" },
      { status: 403 }
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { action } = body;

    // 写操作限流：发帖/回复/点赞/收藏/管理操作每分钟10次
    if (action && !["list", "detail"].includes(action as string)) {
      const limit = rateLimit(request, `forum:${action as string}`, 10, 60);
      if (!limit.allowed) {
        return NextResponse.json(
          { success: false, error: "请求过于频繁，请稍后再试" },
          { status: 429, headers: { "X-RateLimit-Reset": String(limit.resetAt) } }
        );
      }
    }

    if (action === "list") {
      const { section, search } = body;
      let query = supabase
        .from("forum_posts")
        .select("*, forum_replies(count), forum_likes(count)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (section && section !== "all") {
        query = query.eq("section", section);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      const posts = (data || []).map((p) => ({
        ...p,
        replyCount: p.forum_replies?.[0]?.count ?? 0,
        likes: p.forum_likes?.[0]?.count ?? 0,
      }));
      return NextResponse.json({ success: true, data: posts });
    }

    if (action === "detail") {
      const { postId } = body;
      const { data: post, error } = await supabase
        .from("forum_posts")
        .select("*, forum_replies(*), forum_likes(user_id)")
        .eq("id", postId)
        .single();
      if (error || !post) {
        return NextResponse.json(
          { success: false, error: "帖子不存在" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: post });
    }

    if (action === "create") {
      const user = await requireAuthRequest(request);
      const banCheck = checkBanForForum(user);
      if (banCheck) return banCheck;
      const {
        title,
        content,
        section = "general",
        category,
        tags,
        bugStatus,
      } = body;
      if (!title || !content) {
        return NextResponse.json(
          { success: false, error: "标题和内容不能为空" },
          { status: 400 }
        );
      }
      const insert: Record<string, unknown> = {
        title,
        content,
        section,
        author_id: user.userId,
        author_name: user.username,
        category: category || null,
        tags: tags || [],
        bug_status: bugStatus || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("forum_posts")
        .insert(insert)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === "reply") {
      const user = await requireAuthRequest(request);
      const banCheck = checkBanForForum(user);
      if (banCheck) return banCheck;
      const { postId, content, parentReplyId } = body;
      if (!postId || !content) {
        return NextResponse.json(
          { success: false, error: "参数错误" },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from("forum_replies")
        .insert({
          post_id: postId,
          author_id: user.userId,
          author_name: user.username,
          content,
          parent_reply_id: parentReplyId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("forum_posts")
        .update({ last_reply_at: new Date().toISOString() })
        .eq("id", postId);

      return NextResponse.json({ success: true, data });
    }

    if (action === "like") {
      const user = await requireAuthRequest(request);
      const banCheck = checkBanForForum(user);
      if (banCheck) return banCheck;
      const { postId } = body;
      const { data: existing } = await supabase
        .from("forum_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.userId)
        .maybeSingle();
      if (existing) {
        await supabase.from("forum_likes").delete().eq("id", existing.id);
        return NextResponse.json({ success: true, data: { liked: false } });
      }
      await supabase.from("forum_likes").insert({
        post_id: postId,
        user_id: user.userId,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: { liked: true } });
    }

    if (action === "favorite") {
      const user = await requireAuthRequest(request);
      const banCheck = checkBanForForum(user);
      if (banCheck) return banCheck;
      const { postId } = body;
      const { data: existing } = await supabase
        .from("forum_favorites")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.userId)
        .maybeSingle();
      if (existing) {
        await supabase.from("forum_favorites").delete().eq("id", existing.id);
        return NextResponse.json({ success: true, data: { favorited: false } });
      }
      await supabase.from("forum_favorites").insert({
        post_id: postId,
        user_id: user.userId,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: { favorited: true } });
    }

    if (action === "my_favorites") {
      const user = await requireAuthRequest(request);
      const { data, error } = await supabase
        .from("forum_favorites")
        .select("post_id, forum_posts(*)")
        .eq("user_id", user.userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const posts = (data || []).map((f) => f.forum_posts);
      return NextResponse.json({ success: true, data: posts });
    }

    if (action === "admin_pin" || action === "admin_essence") {
      const adminUser = await requirePermissionRequest(request, "forum_manage");
      const { postId, value } = body;
      const field = action === "admin_pin" ? "is_pinned" : "is_essence";
      const { data, error } = await supabase
        .from("forum_posts")
        .update({ [field]: value })
        .eq("id", postId)
        .select()
        .single();
      if (error) throw error;
      await logAudit(adminUser.id, action, "forum_post", postId, { field, value });
      return NextResponse.json({ success: true, data });
    }

    if (action === "admin_delete") {
      const adminUser = await requirePermissionRequest(request, "forum_manage");
      const { postId } = body;
      await supabase.from("forum_replies").delete().eq("post_id", postId);
      await supabase.from("forum_likes").delete().eq("post_id", postId);
      await supabase.from("forum_favorites").delete().eq("post_id", postId);
      await supabase.from("forum_posts").delete().eq("id", postId);
      await logAudit(adminUser.id, action, "forum_post", postId);
      return NextResponse.json({ success: true });
    }

    if (action === "admin_update_bug_status") {
      const adminUser = await requirePermissionRequest(request, "forum_manage");
      const { postId, value } = body;
      const bugStatus = value;
      const { data, error } = await supabase
        .from("forum_posts")
        .update({ bug_status: bugStatus })
        .eq("id", postId)
        .select()
        .single();
      if (error) throw error;
      await logAudit(adminUser.id, action, "forum_post", postId, { bug_status: bugStatus });
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: "未知 action" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
