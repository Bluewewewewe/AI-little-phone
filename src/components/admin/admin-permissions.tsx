"use client";

import { useEffect, useState } from "react";

const ALL_PERMISSIONS = [
  { key: "user_review", label: "用户审核" },
  { key: "user_ban", label: "用户封禁" },
  { key: "invite_manage", label: "邀请码管理" },
  { key: "forum_manage", label: "论坛管理" },
  { key: "stats_view", label: "数据统计" },
  { key: "tree_view", label: "邀请树" },
  { key: "system_setting", label: "系统设置" },
  { key: "permissions", label: "权限管理" },
  { key: "audit_log", label: "操作日志" },
  { key: "weibo_verify", label: "微博验证管理" },
  { key: "role_manage", label: "角色管理" },
] as const;

interface AdminUser {
  id: string;
  username: string;
  nickname?: string;
  role: string;
  admin_permissions?: string[];
}

interface AdminPermissionsProps {
  token: string;
  currentUserRole: string;
  currentUserId: string;
}

export function AdminPermissions({
  token,
  currentUserRole,
  currentUserId,
}: AdminPermissionsProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, myRes] = await Promise.all([
        fetch("/api/admin/permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authToken: token, action: "list_admins" }),
        }).then((r) => r.json()),
        fetch("/api/admin/permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authToken: token, action: "get_my_permissions" }),
        }).then((r) => r.json()),
      ]);
      if (listRes.success) setAdmins(listRes.data.list || []);
      if (myRes.success) setMyPermissions(myRes.data.permissions || []);
    } catch {
      setMessage("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const canEdit =
    currentUserRole === "super_admin" || myPermissions.includes("permissions");

  const openEdit = (admin: AdminUser) => {
    if (!canEdit) return;
    setSelectedAdmin({ ...admin });
  };

  const togglePermission = (key: string) => {
    if (!selectedAdmin) return;
    const perms = new Set(selectedAdmin.admin_permissions || []);
    if (perms.has(key)) perms.delete(key);
    else perms.add(key);
    setSelectedAdmin({ ...selectedAdmin, admin_permissions: Array.from(perms) });
  };

  const savePermissions = async () => {
    if (!selectedAdmin || !canEdit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authToken: token,
          action: "update_permissions",
          adminUserId: selectedAdmin.id,
          permissions: selectedAdmin.admin_permissions || [],
        }),
      }).then((r) => r.json());
      if (res.success) {
        setMessage("权限已更新");
        setSelectedAdmin(null);
        fetchData();
      } else {
        setMessage(res.error || "保存失败");
      }
    } catch {
      setMessage("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">权限管理</h2>
        {message && (
          <span className="rounded-lg bg-purple-500/20 px-3 py-1 text-sm text-purple-200">
            {message}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center text-purple-200">加载中...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="rounded-xl border border-purple-500/30 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-white">
                  {admin.nickname || admin.username}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    admin.role === "super_admin"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {admin.role === "super_admin" ? "超级管理员" : "管理员"}
                </span>
              </div>
              <div className="mb-3 text-xs text-purple-200">
                权限数: {(admin.admin_permissions || []).length}
              </div>
              {admin.id !== currentUserId &&
                admin.role !== "super_admin" &&
                canEdit && (
                  <button
                    onClick={() => openEdit(admin)}
                    className="w-full min-h-[44px] rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-500 active:scale-95"
                  >
                    编辑权限
                  </button>
                )}
            </div>
          ))}
        </div>
      )}

      {selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-purple-500/30 bg-[#1a1635] p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">
              编辑 {selectedAdmin.username} 的权限
            </h3>
            <div className="space-y-2">
              {ALL_PERMISSIONS.map((p) => (
                <label
                  key={p.key}
                  className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg bg-white/5 px-3 py-2 hover:bg-white/10"
                >
                  <input
                    type="checkbox"
                    checked={selectedAdmin.admin_permissions?.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                    className="h-5 w-5 accent-purple-500"
                  />
                  <span className="text-purple-100">{p.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedAdmin(null)}
                className="min-h-[44px] flex-1 rounded-lg border border-purple-500/30 px-4 py-2 text-purple-200 hover:bg-white/5"
              >
                取消
              </button>
              <button
                onClick={savePermissions}
                disabled={saving}
                className="min-h-[44px] flex-1 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
