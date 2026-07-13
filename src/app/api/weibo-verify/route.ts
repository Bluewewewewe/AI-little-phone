import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

const supabase = getSupabaseClient();

// Generate random verification code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MIMI-";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate random invitation code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "INV-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 验证通过后自动生成 5 个邀请码
async function generateUserInviteCodes(username: string, userId: string) {
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    codes.push({
      code,
      created_by: username,
      created_by_id: userId,
      max_uses: 1,
      is_active: true,
      note: `${username} 验证通过后获得`,
    });
  }
  
  const { error } = await supabase
    .from("invitation_codes")
    .insert(codes);
  
  if (error) {
    console.error("生成邀请码失败:", error);
  }
  
  return codes;
}

// GET: Check verification status for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const list = searchParams.get("list");
    const statusFilter = searchParams.get("status");

    // List mode: return all verifications for admin panel
    if (list === "true") {
      let query = supabase
        .from("weibo_verification")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: data || [] });
    }

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("weibo_verification")
      .select("*")
      .eq("user_id", username)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Create verification request or update status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, weiboUid, weiboName, code, adminNote } = body;

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    // Action: init - Start a new verification
    if (action === "init") {
      // Check if there's already a pending verification
      const { data: existing } = await supabase
        .from("weibo_verification")
        .select("*")
        .eq("user_id", username)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          data: existing,
          message: "Already has a pending verification"
        });
      }

      const verifyCode = generateCode();

      const { data, error } = await supabase
        .from("weibo_verification")
        .insert({
          user_id: username,
          verification_code: verifyCode,
          weibo_uid: weiboUid || null,
          weibo_name: weiboName || null,
          verification_mode: "manual",
          status: "pending"
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Action: submit_code - User submits their Weibo info + code confirmation
    if (action === "submit_code") {
      const { data, error } = await supabase
        .from("weibo_verification")
        .update({
          weibo_uid: weiboUid,
          weibo_name: weiboName,
          step1_dm_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", username)
        .eq("status", "pending")
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Action: admin_approve_step1 - Admin approves step 1 (DM verified)
    if (action === "admin_approve_step1") {
      const { data, error } = await supabase
        .from("weibo_verification")
        .update({
          step1_passed: true,
          step1_passed_at: new Date().toISOString(),
          admin_note: adminNote || "Admin approved step 1",
          updated_at: new Date().toISOString()
        })
        .eq("user_id", username)
        .eq("status", "pending")
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Action: admin_approve_step2 - Admin approves step 2 (超话等级 check)
    if (action === "admin_approve_step2") {
      const { data, error } = await supabase
        .from("weibo_verification")
        .update({
          step2_passed: true,
          step2_passed_at: new Date().toISOString(),
          step2_chaohua_level: code || 0,
          status: "verified",
          admin_note: adminNote || "Admin approved step 2",
          updated_at: new Date().toISOString()
        })
        .eq("user_id", username)
        .eq("status", "pending")
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 验证通过，自动生成 5 个邀请码
      if (data) {
        // 获取用户ID
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("username", username)
          .single();
        
        if (userData) {
          await generateUserInviteCodes(username, userData.id);
          // 标记用户微博已验证
          await supabase
            .from("users")
            .update({ weibo_verified: true })
            .eq("username", username);
        }
      }

      return NextResponse.json({ data });
    }

    // Action: admin_reject - Admin rejects verification
    if (action === "admin_reject") {
      const { data, error } = await supabase
        .from("weibo_verification")
        .update({
          status: "rejected",
          admin_note: adminNote || "Admin rejected",
          updated_at: new Date().toISOString()
        })
        .eq("user_id", username)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Action: admin_approve_all - Admin approves both steps at once
    if (action === "admin_approve_all") {
      const { data, error } = await supabase
        .from("weibo_verification")
        .update({
          step1_passed: true,
          step1_passed_at: new Date().toISOString(),
          step2_passed: true,
          step2_passed_at: new Date().toISOString(),
          step2_chaohua_level: code || 0,
          status: "verified",
          admin_note: adminNote || "Admin approved all",
          updated_at: new Date().toISOString()
        })
        .eq("user_id", username)
        .eq("status", "pending")
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 验证通过，自动生成 5 个邀请码
      if (data) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("username", username)
          .single();
        
        if (userData) {
          await generateUserInviteCodes(username, userData.id);
          await supabase
            .from("users")
            .update({ weibo_verified: true })
            .eq("username", username);
        }
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
