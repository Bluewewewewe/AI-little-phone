import { getSupabaseClient } from "@/storage/database/supabase-client";
import type { NextRequest } from "next/server";

export interface VerifiedUser {
    userId: string;
    username: string;
    role: string;
    isAdmin: boolean;
    banStatus?: string;
    banUntil?: string | null;
    banReason?: string;
}

export async function verifyToken(token: string | undefined | null): Promise<VerifiedUser | null> {
    if (!token) return null;
    try {
        const supabase = getSupabaseClient();
        const { data: session, error } = await supabase
            .from("user_sessions")
            .select("user_id, token, expires_at")
            .eq("token", token)
            .single();
        if (error || !session) return null;
        if (session.expires_at && new Date(session.expires_at) < new Date()) return null;

        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, username, role, status, ban_status, ban_until, ban_reason")
            .eq("id", session.user_id)
            .single();
        if (userError || !user || user.status !== "approved") return null;

        return {
            userId: user.id,
            username: user.username,
            role: user.role,
            isAdmin: user.role === "admin" || user.role === "super_admin",
            banStatus: user.ban_status,
            banUntil: user.ban_until,
            banReason: user.ban_reason,
        };
    } catch {
        return null;
    }
}

export async function requireAuth(token: string | undefined | null): Promise<VerifiedUser> {
    const user = await verifyToken(token);
    if (!user) {
        throw new Error("未登录或登录已过期");
    }
    return user;
}

export async function requireAdmin(token: string | undefined | null): Promise<VerifiedUser> {
    const user = await requireAuth(token);
    if (!user.isAdmin) {
        throw new Error("需要管理员权限");
    }
    return user;
}

export async function extractTokenFromRequest(request: NextRequest): Promise<string | undefined> {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    try {
        const cloned = request.clone();
        const body = await cloned.json();
        return body?.authToken || body?.token || undefined;
    } catch {
        return undefined;
    }
}

export async function requireAuthRequest(request: NextRequest): Promise<VerifiedUser> {
    const token = await extractTokenFromRequest(request);
    return requireAuth(token);
}

export async function requireAdminRequest(request: NextRequest): Promise<VerifiedUser> {
    const token = await extractTokenFromRequest(request);
    return requireAdmin(token);
}
