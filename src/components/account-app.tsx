"use client";

import { useState, useEffect } from "react";

interface AccountAppProps {
  username: string;
  displayName: string;
  isAdmin: boolean;
  onClose: () => void;
  onLogout: () => void;
  onDisplayNameChange?: (name: string) => void;
}

interface InviteCode {
  id: string;
  code: string;
  is_active: boolean;
  use_count: number;
  max_uses: number;
  used_by: string | null;
  created_at: string;
  note: string | null;
}

export default function AccountApp({
  username,
  displayName: initialDisplayName,
  isAdmin,
  onClose,
  onLogout,
  onDisplayNameChange,
}: AccountAppProps) {
  const [displayNameInput, setDisplayNameInput] = useState(initialDisplayName || username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<{ username: string; display_name: string; created_at: string }[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [generateRole, setGenerateRole] = useState<"user" | "admin">("user");

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  useEffect(() => {
    loadMyInviteCodes();
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!displayNameInput.trim()) {
      showMessage("昵称不能为空");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          token,
          newDisplayName: displayNameInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("昵称已保存");
        onDisplayNameChange?.(displayNameInput.trim());
      } else {
        showMessage(data.error || "保存失败");
      }
    } catch {
      showMessage("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("请填写完整密码信息");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("两次新密码不一致");
      return;
    }
    if (newPassword.length < 6) {
      showMessage("新密码至少6位");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          token,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("密码修改成功，请重新登录");
        setTimeout(() => {
          onLogout();
        }, 1500);
      } else {
        showMessage(data.error || "修改失败");
      }
    } catch {
      showMessage("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const loadMyInviteCodes = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "my_codes", username }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteCodes(data.data.codes || []);
        setInvitedUsers(data.data.invitedUsers || []);
      }
    } catch {
      showMessage("邀请码加载失败");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleGenerateInviteCodes = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          username,
          count: generateCount,
          roleType: generateRole,
          maxUses: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("邀请码生成成功");
        await loadMyInviteCodes();
      } else {
        showMessage(data.error || "生成失败");
      }
    } catch {
      showMessage("网络错误");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showMessage("已复制");
  };

  return (
    <div className="app-page flex flex-col h-full bg-gradient-to-b from-[#e8f5e9] via-[#c8e6c9] to-[#a5d6a7] text-[#2e5c33]">
      <div className="flex items-center justify-between px-4 py-3 bg-white/40 backdrop-blur-md border-b border-[#b8dcc4]">
        <button onClick={onClose} className="text-[#2e5c33] text-lg px-2 active:scale-90 transition-transform">
          ← 返回
        </button>
        <span className="font-semibold text-[#2e5c33]">账户设置</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {message && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-[#2e5c33] text-white px-4 py-2 rounded-full text-sm z-50 shadow-lg">
            {message}
          </div>
        )}

        {/* 昵称设置 */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-[#b8dcc4]">
          <h3 className="font-semibold mb-3 text-[#2e5c33]">个人资料</h3>
          <label className="block text-sm text-[#3d5c45] mb-1">昵称</label>
          <input
            type="text"
            value={displayNameInput}
            onChange={(e) => setDisplayNameInput(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-white/60 border border-[#b8dcc4] text-[#2e5c33] placeholder:text-[#4a7c50]/50 focus:outline-none focus:ring-2 focus:ring-[#5a9e6a]/30"
            placeholder="输入昵称"
          />
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="mt-3 w-full py-2 rounded-xl bg-[#5a9e6a] text-white font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存昵称"}
          </button>
        </div>

        {/* 修改密码 */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-[#b8dcc4]">
          <h3 className="font-semibold mb-3 text-[#2e5c33]">修改密码</h3>
          <div className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/60 border border-[#b8dcc4] text-[#2e5c33] placeholder:text-[#4a7c50]/50 focus:outline-none focus:ring-2 focus:ring-[#5a9e6a]/30"
              placeholder="当前密码"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/60 border border-[#b8dcc4] text-[#2e5c33] placeholder:text-[#4a7c50]/50 focus:outline-none focus:ring-2 focus:ring-[#5a9e6a]/30"
              placeholder="新密码"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/60 border border-[#b8dcc4] text-[#2e5c33] placeholder:text-[#4a7c50]/50 focus:outline-none focus:ring-2 focus:ring-[#5a9e6a]/30"
              placeholder="确认新密码"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="mt-3 w-full py-2 rounded-xl bg-[#2e7d32] text-white font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? "修改中..." : "修改密码"}
          </button>
        </div>

        {/* 我的邀请码 */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-[#b8dcc4]">
          <h3 className="font-semibold mb-3 text-[#2e5c33]">我的邀请码</h3>
          {inviteLoading && <div className="text-sm text-[#4a7c50]">加载中...</div>}
          <div className="space-y-2">
            {inviteCodes.length === 0 && !inviteLoading && (
              <div className="text-sm text-[#4a7c50]">暂无可用邀请码</div>
            )}
            {inviteCodes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 border border-[#b8dcc4]"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-[#2e5c33]">{code.code}</span>
                  <span className="text-xs text-[#4a7c50]">
                    {code.is_active ? `未使用 (${code.use_count}/${code.max_uses})` : "已停用"}
                  </span>
                </div>
                <button
                  onClick={() => copyCode(code.code)}
                  className="px-3 py-1 rounded-lg bg-[#5a9e6a]/20 text-[#2e7d32] text-sm active:scale-95 transition-transform"
                >
                  复制
                </button>
              </div>
            ))}
          </div>
          {invitedUsers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#b8dcc4]">
              <div className="text-sm text-[#3d5c45] mb-1">已邀请用户：{invitedUsers.length} 人</div>
              <div className="flex flex-wrap gap-2">
                {invitedUsers.map((u) => (
                  <span key={u.username} className="px-2 py-1 rounded-lg bg-white/40 text-xs text-[#2e5c33]">
                    {u.display_name || u.username}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 管理员生成邀请码 */}
        {isAdmin && (
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-[#b8dcc4]">
            <h3 className="font-semibold mb-3 text-[#2e5c33]">生成邀请码</h3>
            <div className="flex gap-3 mb-3">
              <select
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-[#b8dcc4] text-[#2e5c33]"
              >
                {[1, 2, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} 个
                  </option>
                ))}
              </select>
              <select
                value={generateRole}
                onChange={(e) => setGenerateRole(e.target.value as "user" | "admin")}
                className="flex-1 px-3 py-2 rounded-xl bg-white/60 border border-[#b8dcc4] text-[#2e5c33]"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <button
              onClick={handleGenerateInviteCodes}
              disabled={inviteLoading}
              className="w-full py-2 rounded-xl bg-[#f59e0b] text-white font-medium active:scale-95 transition-transform disabled:opacity-50"
            >
              {inviteLoading ? "生成中..." : "生成邀请码"}
            </button>
          </div>
        )}

        {/* 退出登录 */}
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-2xl bg-red-500/80 text-white font-medium active:scale-95 transition-transform"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
