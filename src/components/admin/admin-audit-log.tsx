"use client";

import { useEffect, useState } from "react";

interface AuditLog {
  id: string;
  operator_username: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface AuditLogProps {
  token: string;
}

export function AdminAuditLog({ token }: AuditLogProps) {
  const [list, setList] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionType, setActionType] = useState("");
  const [operatorSearch, setOperatorSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authToken: token,
          action: "list",
          page,
          pageSize,
          actionType: actionType || undefined,
          operatorSearch: operatorSearch || undefined,
        }),
      }).then((r) => r.json());
      if (res.success) {
        setList(res.data.list || []);
        setTotal(res.data.total || 0);
      } else {
        setMessage(res.error || "加载失败");
      }
    } catch {
      setMessage("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, page, actionType, operatorSearch]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-white">操作日志</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="操作人搜索"
            value={operatorSearch}
            onChange={(e) => setOperatorSearch(e.target.value)}
            className="min-h-[44px] rounded-lg border border-purple-500/30 bg-white/5 px-3 text-sm text-white placeholder-purple-300/50 focus:border-purple-500 focus:outline-none"
          />
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="min-h-[44px] rounded-lg border border-purple-500/30 bg-white/5 px-3 text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="">全部类型</option>
            <option value="approve_user">通过用户</option>
            <option value="reject_user">拒绝用户</option>
            <option value="ban_user">封禁用户</option>
            <option value="assign_review">分配审核</option>
            <option value="claim_review">认领审核</option>
            <option value="auto_assign">自动分配</option>
            <option value="update_permissions">修改权限</option>
            <option value="forum_pin">帖子置顶</option>
            <option value="forum_feature">帖子精华</option>
            <option value="forum_delete">删除帖子</option>
            <option value="forum_bug_status">Bug状态</option>
          </select>
        </div>
      </div>

      {message && (
        <div className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">
          {message}
        </div>
      )}

      <div className="hidden overflow-hidden rounded-xl border border-purple-500/30 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-purple-900/30 text-purple-200">
            <tr>
              <th className="px-4 py-3">时间</th>
              <th className="px-4 py-3">操作人</th>
              <th className="px-4 py-3">操作类型</th>
              <th className="px-4 py-3">目标</th>
              <th className="px-4 py-3">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-purple-200">
                  加载中...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-purple-200">
                  暂无记录
                </td>
              </tr>
            ) : (
              list.map((log) => (
                <tr key={log.id} className="bg-white/5 hover:bg-white/10">
                  <td className="px-4 py-3 text-purple-200">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white">{log.operator_username || "-"}</td>
                  <td className="px-4 py-3 text-purple-200">{log.action_type}</td>
                  <td className="px-4 py-3 text-purple-200">
                    {log.target_type ? `${log.target_type}:${log.target_id}` : "-"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-purple-300">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="text-center text-purple-200">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-purple-200">暂无记录</div>
        ) : (
          list.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-purple-500/30 bg-white/5 p-4"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-purple-300">
                  {new Date(log.created_at).toLocaleString()}
                </span>
                <span className="text-xs text-purple-200">{log.action_type}</span>
              </div>
              <div className="text-sm text-white">
                操作人: {log.operator_username || "-"}
              </div>
              <div className="text-xs text-purple-300">
                {log.target_type ? `${log.target_type}:${log.target_id}` : "-"}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
          className="min-h-[44px] rounded-lg border border-purple-500/30 bg-white/5 px-4 py-2 text-purple-200 disabled:opacity-40"
        >
          上一页
        </button>
        <span className="text-sm text-purple-200">
          {page} / {totalPages} (共 {total} 条)
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
          className="min-h-[44px] rounded-lg border border-purple-500/30 bg-white/5 px-4 py-2 text-purple-200 disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
