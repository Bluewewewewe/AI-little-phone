import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { StoreAppItem, AppStatus, StoreAppBetaCode } from "@/lib/apps";

function isAdmin(user: Record<string, unknown> | null) {
    if (!user) return false;
    const role = String(user.role || "");
    return role === "admin" || role === "super_admin";
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");

        const supabase = getSupabaseClient();

        if (action === "list") {
            const token = request.headers.get("authorization")?.replace("Bearer ", "") || "";
            let user: Record<string, unknown> | null = null;
            if (token) {
                const { data: session } = await supabase
                    .from("user_sessions")
                    .select("user_id")
                    .eq("token", token)
                    .single();
                if (session?.user_id) {
                    const { data: u } = await supabase
                        .from("users")
                        .select("role")
                        .eq("id", session.user_id)
                        .single();
                    user = u || null;
                }
            }

            let query = supabase.from("apps").select("*").order("order", { ascending: true });
            if (!isAdmin(user)) {
                query = query.neq("status", "hidden");
            }
            const { data: apps, error } = await query;
            if (error) throw error;
            return NextResponse.json({ success: true, data: apps || [] });
        }

        return NextResponse.json({ error: "未知 action" }, { status: 400 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, token } = body;

        const supabase = getSupabaseClient();

        if (!token) {
            return NextResponse.json({ error: "缺少 token" }, { status: 401 });
        }

        const { data: session } = await supabase
            .from("user_sessions")
            .select("user_id")
            .eq("token", token)
            .single();

        if (!session?.user_id) {
            return NextResponse.json({ error: "登录已过期" }, { status: 401 });
        }

        const { data: user } = await supabase
            .from("users")
            .select("role, username")
            .eq("id", session.user_id)
            .single();

        if (!isAdmin(user)) {
            return NextResponse.json({ error: "无权限" }, { status: 403 });
        }

        if (action === "create_app") {
            const app: Partial<StoreAppItem> = body.app || {};
            const now = new Date().toISOString();
            const insert: StoreAppItem = {
                id: crypto.randomUUID(),
                app_id: app.app_id || `app_${Date.now()}`,
                name: app.name || "未命名应用",
                icon: app.icon || "📦",
                developer: app.developer || "米米宇宙",
                category: app.category || "其他",
                description: app.description || "",
                features: Array.isArray(app.features) ? app.features : [],
                screenshots: Array.isArray(app.screenshots) ? app.screenshots : [],
                version: app.version || "1.0.0",
                status: (app.status as AppStatus) || "dev",
                updated_at: now,
                expected_release: app.expected_release,
                beta_info: app.beta_info || "",
                beta_wipe: app.beta_wipe ?? false,
                beta_slots: app.beta_slots || 0,
                beta_used_slots: 0,
                route: app.route || app.app_id || "",
                order: app.order ?? 0,
                is_external: app.is_external ?? false
            };

            const { data, error } = await supabase.from("apps").insert(insert).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === "update_app") {
            const { id, ...updates } = body.app || {};
            if (!id) {
                return NextResponse.json({ error: "缺少应用 ID" }, { status: 400 });
            }
            const { data, error } = await supabase
                .from("apps")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === "delete_app") {
            const { id } = body;
            if (!id) {
                return NextResponse.json({ error: "缺少应用 ID" }, { status: 400 });
            }
            const { error } = await supabase.from("apps").delete().eq("id", id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === "set_beta_code") {
            if (!user) {
                return NextResponse.json({ error: "未登录" }, { status: 401 });
            }
            const { app_id, code, max_uses } = body;
            if (!app_id || !code) {
                return NextResponse.json({ error: "缺少参数" }, { status: 400 });
            }

            const { data: existing } = await supabase
                .from("app_beta_codes")
                .select("id")
                .eq("app_id", app_id)
                .single();

            if (existing?.id) {
                const { data, error } = await supabase
                    .from("app_beta_codes")
                    .update({ code, max_uses: max_uses || 1, used_count: 0 })
                    .eq("id", existing.id)
                    .select()
                    .single();
                if (error) throw error;
                return NextResponse.json({ success: true, data });
            }

            const insert: StoreAppBetaCode = {
                id: crypto.randomUUID(),
                app_id,
                code,
                max_uses: max_uses || 1,
                used_count: 0,
                created_by: String(user.username || ""),
                created_at: new Date().toISOString()
            };
            const { data, error } = await supabase.from("app_beta_codes").insert(insert).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ error: "未知 action" }, { status: 400 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
