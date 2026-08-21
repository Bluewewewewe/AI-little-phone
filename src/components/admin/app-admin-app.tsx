"use client";

import React, { useEffect, useState } from "react";
import { StoreAppItem, AppStatus, APP_STATUS_LABEL, APP_STATUS_COLOR } from "@/lib/apps";

interface AppAdminAppProps {
    loginUsername: string;
    onClose: () => void;
}

export default function AppAdminApp({ loginUsername, onClose }: AppAdminAppProps) {
    const [apps, setApps] = useState<StoreAppItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState<"apps" | "beta">("apps");
    const [editingApp, setEditingApp] = useState<StoreAppItem | null>(null);

    useEffect(() => {
        loadApps();
    }, []);

    async function loadApps() {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/apps?action=list`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const json = await res.json();
            if (json.success) {
                setApps(json.data || []);
            } else {
                setError(json.error || "加载失败");
            }
        } catch {
            setError("网络错误");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(appId: string) {
        if (!confirm("确定删除该应用吗？")) return;
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", token, app_id: appId })
            });
            const json = await res.json();
            if (json.success) {
                setApps((prev) => prev.filter((a) => a.app_id !== appId));
            } else {
                setError(json.error || "删除失败");
            }
        } catch {
            setError("网络错误");
        }
    }

    return (
        <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 100%)",
            color: "#2e5c33",
            overflow: "hidden"
        }}>
            <div style={{
                padding: "14px 16px",
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>应用管理</span>
                <button onClick={onClose} style={{
                    width: 28, height: 28, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.7)", color: "#2e5c33", fontSize: 16, cursor: "pointer"
                }}>×</button>
            </div>

            <div style={{ display: "flex", padding: "10px 16px", gap: 10 }}>
                {(["apps", "beta"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: 12,
                            border: "none",
                            background: tab === t ? "#2e7d32" : "rgba(255,255,255,0.6)",
                            color: tab === t ? "#fff" : "#2e5c33",
                            fontSize: 14,
                            cursor: "pointer"
                        }}
                    >{t === "apps" ? "应用列表" : "内测码管理"}</button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
                {loading && <div style={{ textAlign: "center", padding: 40, color: "#4a7c50" }}>加载中...</div>}
                {error && <div style={{ textAlign: "center", padding: 20, color: "#ef4444" }}>{error}</div>}

                {tab === "apps" && !loading && (
                    <>
                        <button
                            onClick={() => setEditingApp({
                                id: "",
                                app_id: "",
                                name: "",
                                icon: "📦",
                                developer: loginUsername,
                                category: "工具",
                                description: "",
                                features: [],
                                screenshots: [],
                                version: "1.0.0",
                                status: "dev",
                                updated_at: new Date().toISOString(),
                                expected_release: undefined,
                                beta_info: "",
                                beta_wipe: false,
                                beta_slots: 0,
                                beta_used_slots: 0,
                                route: "",
                                order: apps.length,
                                is_external: false
                            })}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: 14,
                                border: "1px dashed #2e7d32",
                                background: "rgba(46,125,50,0.08)",
                                color: "#2e7d32",
                                fontSize: 15,
                                fontWeight: 600,
                                marginBottom: 12,
                                cursor: "pointer"
                            }}
                        >+ 新增应用</button>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {apps.map((app) => (
                                <div key={app.id} style={{
                                    background: "rgba(255,255,255,0.65)",
                                    backdropFilter: "blur(20px)",
                                    borderRadius: 16,
                                    padding: 14,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    border: "1px solid rgba(255,255,255,0.5)"
                                }}>
                                    <div style={{ fontSize: 36 }}>{app.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 15, fontWeight: 600 }}>{app.name}</div>
                                        <div style={{ fontSize: 11, color: "#4a7c50", marginTop: 2 }}>{app.developer} · {app.category}</div>
                                        <div style={{
                                            display: "inline-block",
                                            marginTop: 4,
                                            padding: "2px 8px",
                                            borderRadius: 10,
                                            background: `${APP_STATUS_COLOR[app.status]}20`,
                                            color: APP_STATUS_COLOR[app.status],
                                            fontSize: 10
                                        }}>{APP_STATUS_LABEL[app.status]}</div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <button onClick={() => setEditingApp(app)} style={{
                                            padding: "5px 12px", borderRadius: 10, border: "none",
                                            background: "#2e7d32", color: "#fff", fontSize: 12, cursor: "pointer"
                                        }}>编辑</button>
                                        <button onClick={() => handleDelete(app.app_id)} style={{
                                            padding: "5px 12px", borderRadius: 10, border: "none",
                                            background: "#ef4444", color: "#fff", fontSize: 12, cursor: "pointer"
                                        }}>删除</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {tab === "beta" && !loading && (
                    <BetaCodeManager apps={apps.filter((a) => a.status === "beta")} />
                )}
            </div>

            {editingApp && (
                <AppEditModal
                    app={editingApp}
                    onClose={() => setEditingApp(null)}
                    onSaved={(saved) => {
                        setApps((prev) => {
                            const exists = prev.find((a) => a.app_id === saved.app_id);
                            if (exists) {
                                return prev.map((a) => (a.app_id === saved.app_id ? saved : a));
                            }
                            return [...prev, saved];
                        });
                        setEditingApp(null);
                    }}
                />
            )}
        </div>
    );
}

function BetaCodeManager({ apps }: { apps: StoreAppItem[] }) {
    const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.app_id || "");
    const [code, setCode] = useState("");
    const [maxUses, setMaxUses] = useState<number>(10);
    const [codes, setCodes] = useState<Array<{ id: string; code: string; max_uses: number; used_count: number }>>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedAppId) loadCodes();
    }, [selectedAppId]);

    async function loadCodes() {
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/apps?action=list_beta_codes&app_id=${selectedAppId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const json = await res.json();
            if (json.success) setCodes(json.data || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateCode() {
        if (!code.trim() || !selectedAppId) return;
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create_beta_code",
                    token,
                    app_id: selectedAppId,
                    code: code.trim(),
                    max_uses: maxUses
                })
            });
            const json = await res.json();
            if (json.success) {
                setCode("");
                loadCodes();
            }
        } catch {
            // ignore
        }
    }

    async function handleDeleteCode(id: string) {
        try {
            const token = localStorage.getItem("auth_token");
            await fetch("/api/apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete_beta_code", token, id })
            });
            loadCodes();
        } catch {
            // ignore
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(46,92,51,0.2)",
                    background: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    color: "#2e5c33"
                }}
            >
                {apps.map((a) => (<option key={a.app_id} value={a.app_id}>{a.name}</option>))}
                {apps.length === 0 && <option value="">暂无内测应用</option>}
            </select>

            {selectedAppId && (
                <>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="内测码"
                            style={{
                                flex: 1,
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid rgba(46,92,51,0.2)",
                                background: "rgba(255,255,255,0.8)",
                                fontSize: 14,
                                color: "#2e5c33"
                            }}
                        />
                        <input
                            type="number"
                            value={maxUses}
                            onChange={(e) => setMaxUses(parseInt(e.target.value || "0", 10))}
                            placeholder="名额"
                            style={{
                                width: 70,
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid rgba(46,92,51,0.2)",
                                background: "rgba(255,255,255,0.8)",
                                fontSize: 14,
                                color: "#2e5c33"
                            }}
                        />
                    </div>
                    <button onClick={handleCreateCode} style={{
                        width: "100%",
                        padding: "11px",
                        borderRadius: 14,
                        border: "none",
                        background: "#2e7d32",
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer"
                    }}>生成内测码</button>

                    {loading && <div style={{ textAlign: "center", color: "#4a7c50" }}>加载中...</div>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {codes.map((c) => (
                            <div key={c.id} style={{
                                background: "rgba(255,255,255,0.6)",
                                borderRadius: 12,
                                padding: 10,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.code}</div>
                                    <div style={{ fontSize: 11, color: "#4a7c50" }}>已使用 {c.used_count} / {c.max_uses}</div>
                                </div>
                                <button onClick={() => handleDeleteCode(c.id)} style={{
                                    padding: "4px 10px", borderRadius: 8, border: "none",
                                    background: "#ef4444", color: "#fff", fontSize: 12, cursor: "pointer"
                                }}>删除</button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

interface AppEditModalProps {
    app: StoreAppItem;
    onClose: () => void;
    onSaved: (app: StoreAppItem) => void;
}

function AppEditModal({ app, onClose, onSaved }: AppEditModalProps) {
    const [form, setForm] = useState<StoreAppItem>({ ...app });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const isNew = !app.id;

    function update<K extends keyof StoreAppItem>(key: K, value: StoreAppItem[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSave() {
        if (!form.app_id.trim() || !form.name.trim() || !form.route.trim()) {
            setError("请填写应用ID、名称和路由");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: isNew ? "create" : "update",
                    token,
                    app: form
                })
            });
            const json = await res.json();
            if (json.success) {
                onSaved(json.data);
            } else {
                setError(json.error || "保存失败");
            }
        } catch {
            setError("网络错误");
        } finally {
            setSaving(false);
        }
    }

    function parseFeatures(value: string) {
        return value.split("\n").map((s) => s.trim()).filter(Boolean);
    }

    function parseScreenshots(value: string) {
        return value.split("\n").map((s) => s.trim()).filter(Boolean);
    }

    return (
        <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end"
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxHeight: "92%",
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(28px)",
                    borderRadius: "24px 24px 0 0",
                    padding: 20,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{isNew ? "新增应用" : "编辑应用"}</span>
                    <button onClick={onClose} style={{
                        width: 28, height: 28, borderRadius: "50%", border: "none",
                        background: "rgba(0,0,0,0.06)", color: "#2e5c33", fontSize: 18, cursor: "pointer"
                    }}>×</button>
                </div>

                {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}

                <Field label="应用ID（唯一标识）">
                    <input value={form.app_id} onChange={(e) => update("app_id", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="应用名称">
                    <input value={form.name} onChange={(e) => update("name", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="图标（emoji 或 URL）">
                    <input value={form.icon} onChange={(e) => update("icon", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="开发者">
                    <input value={form.developer} onChange={(e) => update("developer", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="分类">
                    <input value={form.category} onChange={(e) => update("category", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="版本号">
                    <input value={form.version} onChange={(e) => update("version", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="状态">
                    <select value={form.status} onChange={(e) => update("status", e.target.value as AppStatus)} style={inputStyle}>
                        {(["hidden", "dev", "beta", "published"] as AppStatus[]).map((s) => (
                            <option key={s} value={s}>{APP_STATUS_LABEL[s]}</option>
                        ))}
                    </select>
                </Field>
                <Field label="路由/打开标识">
                    <input value={form.route} onChange={(e) => update("route", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="排序权重">
                    <input type="number" value={form.order} onChange={(e) => update("order", parseInt(e.target.value || "0", 10))} style={inputStyle} />
                </Field>
                <Field label="介绍">
                    <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
                </Field>
                <Field label="功能特点（每行一个）">
                    <textarea value={form.features.join("\n")} onChange={(e) => update("features", parseFeatures(e.target.value))} rows={3} style={{ ...inputStyle, resize: "none" }} />
                </Field>
                <Field label="截图 URL（每行一个，可空）">
                    <textarea value={form.screenshots.join("\n")} onChange={(e) => update("screenshots", parseScreenshots(e.target.value))} rows={2} style={{ ...inputStyle, resize: "none" }} />
                </Field>
                <Field label="内测说明">
                    <input value={form.beta_info} onChange={(e) => update("beta_info", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="内测名额">
                    <input type="number" value={form.beta_slots} onChange={(e) => update("beta_slots", parseInt(e.target.value || "0", 10))} style={inputStyle} />
                </Field>
                <Field label="是否删档">
                    <select value={form.beta_wipe ? "yes" : "no"} onChange={(e) => update("beta_wipe", e.target.value === "yes")} style={inputStyle}>
                        <option value="yes">是</option>
                        <option value="no">否</option>
                    </select>
                </Field>
                <Field label="预计上线时间">
                    <input
                        type="datetime-local"
                        value={form.expected_release ? new Date(form.expected_release).toISOString().slice(0, 16) : ""}
                        onChange={(e) => update("expected_release", e.target.value ? new Date(e.target.value).toISOString() : null)}
                        style={inputStyle}
                    />
                </Field>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "12px",
                        borderRadius: 14,
                        border: "none",
                        background: saving ? "#b8dcc4" : "#2e7d32",
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: saving ? "not-allowed" : "pointer"
                    }}
                >{saving ? "保存中..." : "保存"}</button>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 12, color: "#4a7c50", marginBottom: 4 }}>{label}</div>
            {children}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(46,92,51,0.2)",
    background: "rgba(255,255,255,0.8)",
    fontSize: 14,
    color: "#2e5c33"
};
