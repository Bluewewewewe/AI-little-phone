"use client";

import { useState, useEffect, useMemo } from "react";

interface AdminTreeProps {
  token: string;
}

interface TreeUser {
  id: string;
  username: string;
  nickname?: string;
  verify_status?: string;
  ban_status?: string;
  referrer_id?: string | null;
  violation_count: number;
  invite_count: number;
}

interface TreeNode {
  user: TreeUser;
  children: TreeNode[];
}

const statusEmoji = (u: TreeUser) => {
  if (u.ban_status === "temp_banned" || u.ban_status === "perma_banned") return "❌";
  if (u.ban_status === "muted" || u.ban_status === "restricted") return "⚠️";
  if (u.verify_status === "verified") return "✅";
  return "⏳";
};

function buildTree(users: TreeUser[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  users.forEach((u) => {
    map.set(u.id, { user: { ...u, invite_count: 0 }, children: [] });
  });
  const roots: TreeNode[] = [];
  users.forEach((u) => {
    const node = map.get(u.id)!;
    if (u.referrer_id && map.has(u.referrer_id)) {
      map.get(u.referrer_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const countChildren = (node: TreeNode): number => {
    let count = node.children.length;
    node.children.forEach((c) => {
      count += countChildren(c);
    });
    node.user.invite_count = node.children.length;
    return count;
  };
  roots.forEach(countChildren);
  return roots;
}

function findPath(nodes: TreeNode[], targetId: string): TreeNode[] | null {
  for (const node of nodes) {
    if (node.user.id === targetId) return [node];
    const childPath = findPath(node.children, targetId);
    if (childPath) return [node, ...childPath];
  }
  return null;
}

export default function AdminTree({ token }: AdminTreeProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState<TreeUser | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/tree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authToken: token }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const tree = buildTree(json.data.users || []);
          setNodes(tree);
          const firstLevel = new Set<string>();
          tree.forEach((n) => firstLevel.add(n.user.id));
          setExpanded(firstLevel);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const allUsers = useMemo(() => {
    const collect = (list: TreeNode[]): TreeUser[] => {
      return list.flatMap((n) => [n.user, ...collect(n.children)]);
    };
    return collect(nodes);
  }, [nodes]);

  const handleSearch = () => {
    if (!search.trim()) {
      setHighlightId(null);
      const firstLevel = new Set<string>();
      nodes.forEach((n) => firstLevel.add(n.user.id));
      setExpanded(firstLevel);
      return;
    }
    const term = search.trim().toLowerCase();
    const found = allUsers.find(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        (u.nickname || "").toLowerCase().includes(term)
    );
    if (!found) return;
    const path = findPath(nodes, found.id);
    if (!path) return;
    const next = new Set(expanded);
    path.forEach((n) => next.add(n.user.id));
    setExpanded(next);
    setHighlightId(found.id);
    setTimeout(() => setHighlightId(null), 3000);
  };

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const { user } = node;
    const isExpanded = expanded.has(user.id);
    const hasChildren = node.children.length > 0;
    const isHighlighted = highlightId === user.id;
    return (
      <div key={user.id} className="select-none">
        <div
          className={`flex items-center gap-2 border-b border-cyan-500/10 py-2 pr-2 transition ${
            isHighlighted ? "bg-cyan-500/20" : "hover:bg-slate-800/50"
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <button
            onClick={() => hasChildren && toggle(user.id)}
            className="flex h-6 w-6 items-center justify-center text-cyan-300"
          >
            {hasChildren ? (isExpanded ? "▼" : "▶") : "·"}
          </button>
          <span className="text-lg">{statusEmoji(user)}</span>
          <span className="font-medium text-white">{user.username}</span>
          {user.nickname && (
            <span className="text-xs text-slate-400">({user.nickname})</span>
          )}
          {user.invite_count > 0 && (
            <span className="rounded-full bg-blue-600/30 px-2 py-0.5 text-xs text-blue-200">
              {user.invite_count}
            </span>
          )}
          {user.violation_count > 0 && (
            <span className="rounded-full bg-red-600/30 px-2 py-0.5 text-xs text-red-200">
              违规{user.violation_count}
            </span>
          )}
          <button
            onClick={() => setDetailUser(user)}
            className="ml-auto min-h-[32px] rounded bg-cyan-600/20 px-2 py-1 text-xs text-cyan-300"
          >
            操作
          </button>
        </div>
        {isExpanded && node.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-cyan-300">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-cyan-300">🌳 邀请树</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索用户名"
          className="flex-1 rounded-lg border border-cyan-500/30 bg-slate-800/80 p-3 text-white placeholder-cyan-200/40 outline-none focus:border-cyan-400"
        />
        <button
          onClick={handleSearch}
          className="min-h-[44px] rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 text-sm font-semibold text-white"
        >
          定位
        </button>
        <button
          onClick={() => {
            setSearch("");
            handleSearch();
          }}
          className="min-h-[44px] rounded-lg border border-cyan-500/30 bg-slate-800 px-4 text-sm text-cyan-200"
        >
          清除
        </button>
      </div>
      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60">
        {nodes.length === 0 ? (
          <div className="p-8 text-center text-slate-400">暂无邀请树数据</div>
        ) : (
          nodes.map((n) => renderNode(n))
        )}
      </div>

      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-5 shadow-2xl">
            <h3 className="mb-3 text-lg font-bold text-cyan-300">
              {detailUser.username}
            </h3>
            <div className="space-y-2 text-sm text-slate-200">
              <div>状态：{statusEmoji(detailUser)}</div>
              <div>邀请人数：{detailUser.invite_count}</div>
              <div>违规次数：{detailUser.violation_count}</div>
            </div>
            <button
              onClick={() => setDetailUser(null)}
              className="mt-5 w-full rounded-lg bg-slate-800 py-3 text-white"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
