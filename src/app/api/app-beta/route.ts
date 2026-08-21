import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { app_id, code } = body;

        if (!app_id || !code) {
            return NextResponse.json({ error: "缺少应用 ID 或内测码" }, { status: 400 });
        }

        const supabase = getSupabaseClient();

        const { data: app } = await supabase
            .from("apps")
            .select("status, beta_slots, beta_used_slots")
            .eq("app_id", app_id)
            .single();

        if (!app) {
            return NextResponse.json({ error: "应用不存在" }, { status: 404 });
        }

        if (app.status !== "beta") {
            return NextResponse.json({ error: "应用不在内测状态" }, { status: 400 });
        }

        if (app.beta_slots > 0 && app.beta_used_slots >= app.beta_slots) {
            return NextResponse.json({ error: "内测名额已满" }, { status: 400 });
        }

        const { data: betaCode } = await supabase
            .from("app_beta_codes")
            .select("id, code, max_uses, used_count")
            .eq("app_id", app_id)
            .single();

        if (!betaCode) {
            return NextResponse.json({ error: "内测码未配置" }, { status: 400 });
        }

        if (betaCode.code !== code.trim()) {
            return NextResponse.json({ error: "内测码不正确" }, { status: 400 });
        }

        if (betaCode.max_uses > 0 && betaCode.used_count >= betaCode.max_uses) {
            return NextResponse.json({ error: "该内测码已达使用上限" }, { status: 400 });
        }

        await supabase
            .from("app_beta_codes")
            .update({ used_count: betaCode.used_count + 1 })
            .eq("id", betaCode.id);

        await supabase
            .from("apps")
            .update({ beta_used_slots: app.beta_used_slots + 1 })
            .eq("app_id", app_id);

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
