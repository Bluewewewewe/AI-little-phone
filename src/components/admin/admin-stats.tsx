"use client";

import { useState, useEffect } from "react";

interface AdminStatsProps {
  token: string;
  onNavigate: (tab: string) => void;
}

interface StatsData {
  totalUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  bannedUsers: number;
  todayNewUsers: number;
  violationUsers: number;
  weeklyRegistrations: { date: string; count: number }[];
}

export default function AdminStats({ token, onNavigate }: AdminStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authToken: token }),
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || "加载失败");
        }
      } catch {
        setError("网络错误");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-cyan-300">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "注册用户", value: stats.totalUsers },
    { label: "已验证", value: stats.verifiedUsers },
    { label: "待审核", value: stats.pendingUsers, action: "review" },
    { label: "已封禁", value: stats.bannedUsers },
    { label: "今日新增", value: stats.todayNewUsers },
  ];

  const quickCards = [
    { label: "待审核", value: stats.pendingUsers, action: "review" },
    { label: "违规预警", value: stats.violationUsers, action: "users" },
    { label: "进行中活动", value: 0, action: "" },
  ];

  const maxCount = Math.max(...stats.weeklyRegistrations.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-cyan-300">📊 数据总览</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => card.action && onNavigate(card.action)}
            disabled={!card.action}
            className={`min-h-[88px] rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 text-left shadow-lg backdrop-blur transition hover:border-cyan-400/40 ${
              card.action ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-sm text-cyan-200/70">{card.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickCards.map((card) => (
          <button
            key={card.label}
            onClick={() => card.action && onNavigate(card.action)}
            disabled={!card.action}
            className={`flex min-h-[80px] items-center justify-between rounded-xl border border-purple-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 shadow-lg backdrop-blur transition hover:border-purple-400/40 ${
              card.action ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div>
              <div className="text-sm text-purple-200/70">{card.label}</div>
              <div className="text-xl font-bold text-white">{card.value}</div>
            </div>
            <span className="text-2xl">
              {card.label.includes("审核") ? "👥" : card.label.includes("违规") ? "⚠️" : "🎉"}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 shadow-lg backdrop-blur">
        <h3 className="mb-4 text-lg font-semibold text-cyan-300">近7日注册趋势</h3>
        <div className="flex h-40 items-end justify-between gap-2">
          {stats.weeklyRegistrations.map((day) => {
            const height = `${Math.max((day.count / maxCount) * 100, 4)}%`;
            return (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <div className="text-xs text-cyan-200">{day.count}</div>
                <div
                  className="w-full max-w-[48px] rounded-t bg-gradient-to-t from-blue-600 to-cyan-400 opacity-90 transition hover:opacity-100"
                  style={{ height }}
                />
                <div className="text-[10px] text-cyan-200/60 md:text-xs">{day.date}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
