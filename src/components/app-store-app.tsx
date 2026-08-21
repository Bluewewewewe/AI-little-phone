"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StoreAppItem, APP_STATUS_LABEL, APP_STATUS_COLOR } from "@/lib/apps";

interface AppStoreAppProps {
    loginUsername: string;
    isAdmin: boolean;
    installedAppIds: string[];
    onOpenApp: (appId: string) => void;
    onInstall: (app: StoreAppItem) => void;
    onClose: () => void;
}

const INSTALLED_KEY = "mimi_installed_apps";
const BETA_VERIFIED_KEY = "mimi_beta_verified_apps";

export default function AppStoreApp({ loginUsername, isAdmin, installedAppIds, onOpenApp, onInstall, onClose }: AppStoreAppProps) {
    const [apps, setApps] = useState<StoreAppItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedApp, setSelectedApp] = useState<StoreAppItem | null>(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("全部");

    const installedApps = useMemo(() => new Set(installedAppIds), [installedAppIds]);

    const [betaVerifiedApps, setBetaVerifiedApps] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(BETA_VERIFIED_KEY);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch {
            return new Set<string>();
        }
    });

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

    const categories = useMemo(() => {
        const set = new Set(apps.map((a) => a.category));
        return ["全部", ...Array.from(set)];
    }, [apps]);

    const filteredApps = useMemo(() => {
        return apps.filter((app) => {
            const matchSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
                app.description.toLowerCase().includes(search.toLowerCase());
            const matchCategory = category === "全部" || app.category === category;
            return matchSearch && matchCategory;
        });
    }, [apps, search, category]);

    function isInstalled(appId: string) {
        return installedApps.has(appId);
    }

    function isBetaVerified(appId: string) {
        return betaVerifiedApps.has(appId);
    }

    const installStoreApp = useCallback((app: StoreAppItem) => {
        onInstall(app);
    }, [onInstall]);

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
                padding: "14px 16px 10px",
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(255,255,255,0.5)"
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>应用商店</span>
                    <button onClick={onClose} style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,0.7)",
                        color: "#2e5c33",
                        fontSize: 16,
                        cursor: "pointer"
                    }}>×</button>
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索应用"
                    style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(46,92,51,0.15)",
                        background: "rgba(255,255,255,0.8)",
                        fontSize: 14,
                        color: "#2e5c33"
                    }}
                />
            </div>

            <div style={{ display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto" }}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                            padding: "5px 12px",
                            borderRadius: 16,
                            border: "none",
                            background: category === cat ? "#2e7d32" : "rgba(255,255,255,0.6)",
                            color: category === cat ? "#fff" : "#2e5c33",
                            fontSize: 12,
                            whiteSpace: "nowrap",
                            cursor: "pointer"
                        }}
                    >{cat}</button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
                {loading && <div style={{ textAlign: "center", padding: 40, color: "#4a7c50" }}>加载中...</div>}
                {error && <div style={{ textAlign: "center", padding: 20, color: "#ef4444" }}>{error}</div>}
                {!loading && !error && filteredApps.length === 0 && (
                    <div style={{ textAlign: "center", padding: 40, color: "#4a7c50" }}>暂无应用</div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                    {filteredApps.map((app) => {
                        const installed = isInstalled(app.app_id);
                        const statusLabel = APP_STATUS_LABEL[app.status];
                        const statusColor = APP_STATUS_COLOR[app.status];

                        return (
                            <div
                                key={app.id}
                                onClick={() => setSelectedApp(app)}
                                style={{
                                    background: "rgba(255,255,255,0.65)",
                                    backdropFilter: "blur(20px)",
                                    borderRadius: 18,
                                    padding: 14,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                    border: "1px solid rgba(255,255,255,0.5)",
                                    boxShadow: "0 2px 10px rgba(46,92,51,0.06)"
                                }}
                            >
                                <div style={{ position: "relative" }}>
                                    <div style={{ fontSize: 42 }}>{app.icon}</div>
                                    {installed && (
                                        <div style={{
                                            position: "absolute",
                                            bottom: -2,
                                            right: -2,
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            background: "#22c55e",
                                            border: "2px solid #fff"
                                        }} />
                                    )}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{app.name}</div>
                                <div style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                    background: `${statusColor}20`,
                                    color: statusColor
                                }}>{statusLabel}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedApp && (
                <AppDetailModal
                    app={selectedApp}
                    isAdmin={isAdmin}
                    installed={isInstalled(selectedApp.app_id)}
                    betaVerified={isBetaVerified(selectedApp.app_id)}
                    onClose={() => setSelectedApp(null)}
                    onInstall={() => installStoreApp(selectedApp)}
                    onOpen={() => onOpenApp(selectedApp.route || selectedApp.app_id)}
                    onVerify={(verifiedAppId) => {
                        const next = new Set(betaVerifiedApps);
                        next.add(verifiedAppId);
                        setBetaVerifiedApps(next);
                        localStorage.setItem(BETA_VERIFIED_KEY, JSON.stringify(Array.from(next)));
                    }}
                />
            )}
        </div>
    );
}

interface AppDetailModalProps {
    app: StoreAppItem;
    isAdmin: boolean;
    installed: boolean;
    betaVerified: boolean;
    onClose: () => void;
    onInstall: (app: StoreAppItem) => void;
    onOpen: () => void;
    onVerify: (appId: string) => void;
}

function AppDetailModal({ app, isAdmin, installed, betaVerified, onClose, onInstall, onOpen, onVerify }: AppDetailModalProps) {
    const [betaCode, setBetaCode] = useState("");
    const [betaLoading, setBetaLoading] = useState(false);
    const [betaError, setBetaError] = useState("");
    const [betaSuccess, setBetaSuccess] = useState(false);

    const statusLabel = APP_STATUS_LABEL[app.status];
    const statusColor = APP_STATUS_COLOR[app.status];
    const remainingSlots = app.beta_slots > 0 ? app.beta_slots - app.beta_used_slots : null;

    async function handleVerifyBetaCode() {
        if (!betaCode.trim()) {
            setBetaError("请输入内测码");
            return;
        }
        setBetaLoading(true);
        setBetaError("");
        try {
            const res = await fetch("/api/app-beta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ app_id: app.app_id, code: betaCode.trim() })
            });
            const json = await res.json();
            if (json.success) {
                setBetaSuccess(true);
                onVerify(app.app_id);
            } else {
                setBetaError(json.error || "验证失败");
            }
        } catch {
            setBetaError("网络错误");
        } finally {
            setBetaLoading(false);
        }
    }

    function handleDownload() {
        onInstall(app);
    }

    const canDownload = app.status === "published" ||
        (app.status === "beta" && betaVerified) ||
        isAdmin;

    return (
        <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxHeight: "92%",
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(28px)",
                    borderRadius: "24px 24px 0 0",
                    padding: 20,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ fontSize: 56 }}>{app.icon}</div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "#2e5c33" }}>{app.name}</div>
                            <div style={{ fontSize: 12, color: "#4a7c50", marginTop: 2 }}>{app.developer} · {app.category}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.06)",
                        color: "#2e5c33",
                        fontSize: 18,
                        cursor: "pointer"
                    }}>×</button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: `${statusColor}20`,
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: 600
                    }}>{statusLabel}</span>
                    <span style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: "rgba(46,125,50,0.1)",
                        color: "#2e7d32",
                        fontSize: 11
                    }}>v{app.version}</span>
                    {installed && (
                        <span style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            background: "rgba(34,197,94,0.15)",
                            color: "#16a34a",
                            fontSize: 11
                        }}>已下载</span>
                    )}
                </div>

                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2e5c33", marginBottom: 6 }}>应用介绍</div>
                    <div style={{ fontSize: 13, color: "#3d5c45", lineHeight: 1.6 }}>{app.description || "暂无介绍"}</div>
                </div>

                {app.features.length > 0 && (
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#2e5c33", marginBottom: 6 }}>功能特点</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {app.features.map((f, i) => (
                                <div key={i} style={{ fontSize: 12, color: "#3d5c45", display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ color: "#2e7d32" }}>✓</span> {f}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    background: "rgba(46,125,50,0.06)",
                    borderRadius: 14,
                    padding: 12,
                    fontSize: 12,
                    color: "#3d5c45",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                }}>
                    <div><strong>更新时间：</strong>{new Date(app.updated_at).toLocaleDateString("zh-CN")}</div>
                    {app.expected_release && (
                        <div><strong>预计上线：</strong>{new Date(app.expected_release).toLocaleDateString("zh-CN")}</div>
                    )}
                </div>

                {app.status === "beta" && (
                    <div style={{
                        background: "rgba(245,158,11,0.08)",
                        borderRadius: 14,
                        padding: 12,
                        border: "1px solid rgba(245,158,11,0.2)"
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>内测信息</div>
                        <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
                            {app.beta_info || "该应用正在内测中。"}
                        </div>
                        <div style={{ fontSize: 12, color: "#78350f", marginTop: 6 }}>
                            <strong>是否删档：</strong>{app.beta_wipe ? "是" : "否"}
                        </div>
                        {remainingSlots !== null && (
                            <div style={{ fontSize: 12, color: "#78350f", marginTop: 4 }}>
                                <strong>剩余名额：</strong>{remainingSlots > 0 ? `${remainingSlots} 个` : "已满"}
                            </div>
                        )}
                    </div>
                )}

                {app.status === "beta" && !betaVerified && !isAdmin && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                            value={betaCode}
                            onChange={(e) => setBetaCode(e.target.value)}
                            placeholder="输入内测邀请码"
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid rgba(245,158,11,0.4)",
                                background: "rgba(255,255,255,0.8)",
                                fontSize: 14,
                                color: "#2e5c33"
                            }}
                        />
                        {betaError && <div style={{ fontSize: 12, color: "#ef4444" }}>{betaError}</div>}
                        {betaSuccess && <div style={{ fontSize: 12, color: "#16a34a" }}>验证成功，可以下载了</div>}
                        <button
                            onClick={handleVerifyBetaCode}
                            disabled={betaLoading}
                            style={{
                                width: "100%",
                                padding: "11px",
                                borderRadius: 14,
                                border: "none",
                                background: betaLoading ? "#fcd34d" : "#f59e0b",
                                color: "#fff",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: betaLoading ? "not-allowed" : "pointer"
                            }}
                        >{betaLoading ? "验证中..." : "验证内测码"}</button>
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                    {installed ? (
                        <button
                            onClick={onOpen}
                            disabled={!canDownload}
                            style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: 14,
                                border: "none",
                                background: canDownload ? "#2e7d32" : "#b8dcc4",
                                color: "#fff",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: canDownload ? "pointer" : "not-allowed"
                            }}
                        >{canDownload ? "打开" : "暂不可打开"}</button>
                    ) : (
                        <button
                            onClick={handleDownload}
                            disabled={!canDownload || app.status === "dev"}
                            style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: 14,
                                border: "none",
                                background: !canDownload || app.status === "dev" ? "#b8dcc4" : "#2e7d32",
                                color: "#fff",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: !canDownload || app.status === "dev" ? "not-allowed" : "pointer"
                            }}
                        >
                            {app.status === "dev" ? "开发中" : canDownload ? "下载" : "暂不可下载"}
                        </button>
                    )}
                </div>

                <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    评分/评价功能开发中
                </div>
            </div>
        </div>
    );
}
