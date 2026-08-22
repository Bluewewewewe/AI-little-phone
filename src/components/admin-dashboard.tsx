"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminDashboardProps {
  token: string;
  username: string;
  onClose: () => void;
}

type Tab = "review" | "invites" | "forum" | "announce" | "bugs" | "settings";

interface User {
  id: string;
  username: string;
  weibo_name?: string;
  role: string;
  status: string;
  created_at: string;
  invite_code_used?: string;
}

interface InviteCode {
  code: string;
  owner_id: string;
  role_type: string;
  status: string;
  used_by?: string;
  created_at: string;
  used_at?: string;
  revoked_at?: string;
}

interface ForumPost {
  id: string;
  title: string;
  section: string;
  is_pinned: boolean;
  is_essence: boolean;
  created_at: string;
  author_name: string;
}

export default function AdminDashboard({ token, username, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [inviteCount, setInviteCount] = useState(5);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const api = useCallback(async (action: string, payload?: Record<string, unknown>) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, authToken: token, ...payload }),
    });
    return res.json();
  }, [token]);

  const loadReview = useCallback(async () => {
    setLoading(true);
    const [pendingRes, allRes] = await Promise.all([
      api("list_pending_users"),
      api("list_users"),
    ]);
    setPendingUsers(pendingRes.success ? pendingRes.data || [] : []);
    setUsers(allRes.success ? allRes.data || [] : []);
    setLoading(false);
  }, [api]);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    const res = await api("my_invite_codes");
    setInviteCodes(res.success ? res.data || [] : []);
    setLoading(false);
  }, [api]);

  const loadForum = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list" }),
    }).then((r) => r.json());
    setPosts(res.success ? res.data || [] : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "review") loadReview();
    if (activeTab === "invites") loadInvites();
    if (activeTab === "forum" || activeTab === "announce" || activeTab === "bugs") loadForum();
  }, [activeTab, loadReview, loadInvites, loadForum]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleApprove = async (targetUserId: string) => {
    const res = await api("approve_user", { targetUserId, reviewedBy: username });
    showMessage(res.success ? "已通过" : res.error || "失败");
    if (res.success) loadReview();
  };

  const handleBatchApprove = async () => {
    if (selected.size === 0) return;
    const res = await api("batch_approve_users", {
      targetUserIds: Array.from(selected),
      reviewedBy: username,
    });
    showMessage(res.success ? "批量通过成功" : res.error || "失败");
    if (res.success) {
      setSelected(new Set());
      loadReview();
    }
  };

  const handleReject = async (targetUserId: string) => {
    const res = await api("reject_user", {
      targetUserId,
      reason: rejectReason || "不符合要求",
      reviewedBy: username,
    });
    showMessage(res.success ? "已拒绝" : res.error || "失败");
    if (res.success) loadReview();
  };

  const handleGenerateInvites = async () => {
    const res = await api("generate_invite_codes", {
      role_type: inviteRole,
      count: inviteCount,
    });
    showMessage(res.success ? `生成 ${res.data?.length || 0} 个邀请码` : res.error || "失败");
    if (res.success) loadInvites();
  };

  const handleRevokeInvite = async (code: string) => {
    const res = await api("revoke_invite_code", { code });
    showMessage(res.success ? "已作废" : res.error || "失败");
    if (res.success) loadInvites();
  };

  const handleForumAction = async (action: string, postId: string, value?: boolean | string) => {
    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, postId, value }),
    }).then((r) => r.json());
    showMessage(res.success ? "操作成功" : res.error || "失败");
    if (res.success) loadForum();
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "review", label: "用户审核", icon: "👥" },
    { id: "invites", label: "邀请码", icon: "🎟️" },
    { id: "forum", label: "论坛管理", icon: "📋" },
    { id: "announce", label: "官方公告", icon: "📢" },
    { id: "bugs", label: "Bug反馈", icon: "🐛" },
    { id: "settings", label: "系统设置", icon: "⚙️" },
  ];

  const renderSidebar = () => (
    <nav className="admin-sidebar">
      <div className="admin-brand">米米宇宙管理后台</div>
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`admin-nav-item ${activeTab === t.id ? "active" : ""}`}
          onClick={() => {
            setActiveTab(t.id);
            setSidebarOpen(false);
          }}
        >
          <span className="admin-nav-icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
      <button className="admin-close" onClick={onClose}>退出后台</button>
    </nav>
  );

  const renderReview = () => (
    <div className="admin-section">
      <h2>用户审核</h2>
      <div className="admin-tabs-sub">
        <button className="active">待审核 ({pendingUsers.length})</button>
        <button>全部用户 ({users.length})</button>
      </div>
      {pendingUsers.length === 0 ? (
        <div className="admin-empty">暂无待审核用户</div>
      ) : (
        <>
          <div className="admin-toolbar">
            <button
              className="admin-btn primary"
              onClick={handleBatchApprove}
              disabled={selected.size === 0}
            >
              批量通过 ({selected.size})
            </button>
            <input
              className="admin-input"
              placeholder="拒绝理由"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="admin-list">
            {pendingUsers.map((u) => (
              <div key={u.id} className="admin-card">
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(u.id);
                    else next.delete(u.id);
                    setSelected(next);
                  }}
                />
                <div className="admin-card-body">
                  <div className="admin-card-title">{u.username}</div>
                  <div className="admin-card-meta">
                    微博：{u.weibo_name || "-"} · 邀请码：{u.invite_code_used || "-"} · 注册：{new Date(u.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button className="admin-btn primary" onClick={() => handleApprove(u.id)}>通过</button>
                  <button className="admin-btn danger" onClick={() => handleReject(u.id)}>拒绝</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderInvites = () => (
    <div className="admin-section">
      <h2>邀请码管理</h2>
      <div className="admin-toolbar">
        <select
          className="admin-input"
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
        >
          <option value="user">普通用户码</option>
          <option value="admin">管理员码</option>
        </select>
        <input
          className="admin-input"
          type="number"
          min={1}
          max={50}
          value={inviteCount}
          onChange={(e) => setInviteCount(parseInt(e.target.value, 10))}
        />
        <button className="admin-btn primary" onClick={handleGenerateInvites}>生成邀请码</button>
      </div>
      <div className="admin-list">
        {inviteCodes.map((c) => (
          <div key={c.code} className="admin-card">
            <div className="admin-card-body">
              <div className="admin-card-title">{c.code}</div>
              <div className="admin-card-meta">
                类型：{c.role_type} · 状态：{c.status} · 使用者：{c.used_by || "-"}
              </div>
            </div>
            <div className="admin-card-actions">
              {c.status !== "revoked" && (
                <button className="admin-btn danger" onClick={() => handleRevokeInvite(c.code)}>作废</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForum = () => (
    <div className="admin-section">
      <h2>论坛管理</h2>
      <div className="admin-list">
        {posts.map((p) => (
          <div key={p.id} className="admin-card">
            <div className="admin-card-body">
              <div className="admin-card-title">{p.title}</div>
              <div className="admin-card-meta">
                板块：{p.section} · 作者：{p.author_name} · {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
            <div className="admin-card-actions">
              <button className="admin-btn" onClick={() => handleForumAction("admin_pin", p.id, !p.is_pinned)}>
                {p.is_pinned ? "取消置顶" : "置顶"}
              </button>
              <button className="admin-btn" onClick={() => handleForumAction("admin_essence", p.id, !p.is_essence)}>
                {p.is_essence ? "取消精华" : "加精"}
              </button>
              <button className="admin-btn danger" onClick={() => handleForumAction("admin_delete", p.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnnounce = () => (
    <div className="admin-section">
      <h2>官方公告</h2>
      <div className="admin-empty">公告发布请通过论坛「官方公告」板块</div>
    </div>
  );

  const renderBugs = () => (
    <div className="admin-section">
      <h2>Bug反馈</h2>
      <div className="admin-list">
        {posts.filter((p) => p.section === "bug-report").map((p) => (
          <div key={p.id} className="admin-card">
            <div className="admin-card-body">
              <div className="admin-card-title">{p.title}</div>
            </div>
            <div className="admin-card-actions">
              <button className="admin-btn" onClick={() => handleForumAction("admin_update_bug_status", p.id, "fixed")}>已修复</button>
              <button className="admin-btn" onClick={() => handleForumAction("admin_update_bug_status", p.id, "wontfix")}>不修复</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="admin-section">
      <h2>系统设置</h2>
      <div className="admin-empty">设置功能开发中</div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "review": return renderReview();
      case "invites": return renderInvites();
      case "forum": return renderForum();
      case "announce": return renderAnnounce();
      case "bugs": return renderBugs();
      case "settings": return renderSettings();
      default: return null;
    }
  };

  return (
    <div className="admin-dashboard">
      {isMobile ? (
        <>
          <div className="admin-mobile-header">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <span>管理后台</span>
            <button onClick={onClose}>✕</button>
          </div>
          {sidebarOpen && <div className="admin-mobile-overlay" onClick={() => setSidebarOpen(false)} />}
          <div className={`admin-mobile-sidebar ${sidebarOpen ? "open" : ""}`}>
            {renderSidebar()}
          </div>
        </>
      ) : (
        renderSidebar()
      )}
      <main className="admin-main">
        {message && <div className="admin-message">{message}</div>}
        {loading ? <div className="admin-loading">加载中...</div> : renderContent()}
      </main>
      <style jsx>{`
        .admin-dashboard {
          position: fixed;
          inset: 0;
          display: flex;
          background: #0f0c29;
          color: #e2e8f0;
          z-index: 100000;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .admin-sidebar {
          width: 220px;
          background: linear-gradient(180deg, #1a103c 0%, #0f0c29 100%);
          border-right: 1px solid rgba(139, 92, 246, 0.2);
          display: flex;
          flex-direction: column;
          padding: 16px;
        }
        .admin-brand {
          font-size: 18px;
          font-weight: 700;
          color: #a78bfa;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }
        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 12px;
          margin-bottom: 6px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          font-size: 15px;
          transition: background 0.2s;
          min-height: 44px;
        }
        .admin-nav-item:hover,
        .admin-nav-item.active {
          background: rgba(139, 92, 246, 0.2);
          color: #fff;
        }
        .admin-nav-icon {
          font-size: 18px;
        }
        .admin-close {
          margin-top: auto;
          padding: 14px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          cursor: pointer;
          min-height: 44px;
        }
        .admin-main {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .admin-section h2 {
          margin: 0 0 20px;
          font-size: 22px;
          color: #c4b5fd;
        }
        .admin-tabs-sub {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .admin-tabs-sub button {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid rgba(139, 92, 246, 0.3);
          background: transparent;
          color: #cbd5e1;
          cursor: pointer;
          min-height: 40px;
        }
        .admin-tabs-sub button.active {
          background: rgba(139, 92, 246, 0.25);
          color: #fff;
        }
        .admin-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .admin-input,
        .admin-btn {
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid rgba(139, 92, 246, 0.3);
          background: rgba(15, 12, 41, 0.6);
          color: #e2e8f0;
          font-size: 14px;
          min-height: 44px;
        }
        .admin-btn {
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .admin-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .admin-btn.primary {
          background: linear-gradient(90deg, #7c3aed, #4f46e5);
          border: none;
        }
        .admin-btn.danger {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }
        .admin-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .admin-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(30, 27, 75, 0.5);
          border: 1px solid rgba(139, 92, 246, 0.15);
          flex-wrap: wrap;
        }
        .admin-card-body {
          flex: 1;
          min-width: 200px;
        }
        .admin-card-title {
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }
        .admin-card-meta {
          font-size: 13px;
          color: #94a3b8;
        }
        .admin-card-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .admin-empty {
          padding: 48px;
          text-align: center;
          color: #64748b;
        }
        .admin-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 14px 20px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
          z-index: 100001;
        }
        .admin-loading {
          padding: 48px;
          text-align: center;
          color: #94a3b8;
        }
        .admin-mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: #1a103c;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          z-index: 100002;
        }
        .admin-mobile-header button {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 22px;
          min-width: 44px;
          min-height: 44px;
        }
        .admin-mobile-sidebar {
          position: fixed;
          top: 56px;
          left: 0;
          bottom: 0;
          width: 260px;
          transform: translateX(-100%);
          transition: transform 0.25s;
          z-index: 100003;
        }
        .admin-mobile-sidebar.open {
          transform: translateX(0);
        }
        .admin-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 100002;
        }
        @media (max-width: 767px) {
          .admin-dashboard {
            flex-direction: column;
            padding-top: 56px;
          }
          .admin-main {
            padding: 16px;
          }
          .admin-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-card-actions {
            width: 100%;
          }
          .admin-card-actions .admin-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
