"use client";

import { useEffect, useState } from "react";

interface InviteCode {
  code: string;
  use_count: number;
  max_uses: number;
  is_active: boolean;
  used_by?: string | null;
  created_at?: string;
  role_type?: string;
}

interface InviteAppProps {
  isAdmin?: boolean;
  adminRole?: string;
  loginUsername?: string;
  onBack?: () => void;
}

export default function InviteApp({ isAdmin = false, adminRole = "user", loginUsername = "", onBack }: InviteAppProps) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [generateRole, setGenerateRole] = useState<"user" | "admin">("user");

  const fetchCodes = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_my_invite_codes", token })
      });
      const json = await res.json();
      if (json.success) {
        setCodes(json.data || []);
      } else {
        setMessage(json.error || "加载失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_codes",
          token,
          count: Math.min(Math.max(1, generateCount), 100),
          roleType: generateRole
        })
      });
      const json = await res.json();
      if (json.success) {
        setMessage(`成功生成 ${json.codes?.length || 0} 个邀请码`);
        fetchCodes();
      } else {
        setMessage(json.error || "生成失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage("邀请码已复制：" + code);
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "#3d5c45",
              cursor: "pointer",
              padding: "0 8px 0 0"
            }}>←</button>
        )}
        <div style={{ fontSize: 16, fontWeight: 700, color: "#3d5c45" }}>🎟️ 我的邀请码</div>
      </div>

      {isAdmin && (
        <div style={{
          padding: 12,
          borderRadius: 12,
          background: "rgba(255,255,255,0.7)",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, color: "#4a7c50", marginBottom: 8, fontWeight: 600 }}>
            生成新邀请码
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <input
              type="number"
              min={1}
              max={100}
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              style={{
                width: 80,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #b8dcc4",
                background: "rgba(255,255,255,0.8)",
                fontSize: 14,
                color: "#2e5c33"
              }}
            />
            <select
              value={generateRole}
              onChange={(e) => setGenerateRole(e.target.value as "user" | "admin")}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #b8dcc4",
                background: "rgba(255,255,255,0.8)",
                fontSize: 14,
                color: "#2e5c33"
              }}
            >
              <option value="user">普通用户</option>
              {adminRole !== "admin" && <option value="admin">管理员</option>}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: generating ? "#b8dcc4" : "#2e7d32",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: generating ? "not-allowed" : "pointer"
              }}
            >{generating ? "生成中..." : "生成"}</button>
          </div>
          {adminRole === "admin" && (
            <div style={{ fontSize: 10, color: "#a16207" }}>
              普通管理员最多持有 10 个未使用邀请码，且只能生成普通用户邀请码
            </div>
          )}
        </div>
      )}

      {!isAdmin && (
        <div style={{ padding: 12, borderRadius: 12, background: "rgba(254,243,199,0.8)", fontSize: 11, color: "#92400e", textAlign: "center", lineHeight: 1.5, marginBottom: 16 }}>
          每位用户注册后自动获得 10 个邀请码<br />每个邀请码只能使用 1 次
        </div>
      )}

      {message && (
        <div style={{ fontSize: 12, color: message.includes("成功") || message.includes("复制") ? "#2e7d32" : "#ef4444", textAlign: "center", marginBottom: 12 }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#4a7c50" }}>加载中...</div>
      ) : codes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#a16207", fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎟️</div>
          暂无邀请码<br />
          <span style={{ fontSize: 11, color: "#d97706" }}>注册成功后会自动发放</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {codes.map((c, idx) => (
            <div key={idx} style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: c.is_active && c.use_count < c.max_uses ? "rgba(255,255,255,0.8)" : "rgba(200,200,200,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: c.is_active && c.use_count < c.max_uses ? "#92400e" : "#999" }}>
                  {c.code}
                </div>
                <div style={{ fontSize: 10, color: "#a16207", marginTop: 2 }}>
                  {c.use_count >= c.max_uses ? "已使用" : c.is_active ? `可使用 ${c.max_uses - c.use_count} 次` : "已停用"}
                  {c.used_by && ` → @${c.used_by}`}
                  {c.role_type && c.role_type !== "user" && ` · ${c.role_type === "admin" ? "管理员" : "普通用户"}`}
                </div>
              </div>
              {c.is_active && c.use_count < c.max_uses && (
                <button
                  onClick={() => copyCode(c.code)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "#f59e0b",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer"
                  }}
                >复制</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
