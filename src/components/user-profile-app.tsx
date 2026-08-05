"use client";

import { useEffect, useMemo, useState } from "react";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  section: string;
  sectionName?: string;
  replyCount: number;
  viewCount: number;
  likes: number;
  favorites: number;
  createdAt: string;
  lastReplyAt: string;
  isEssence: boolean;
  isPinned: boolean;
}

interface UserProfileAppProps {
  username: string;
  isSelf?: boolean;
  onClose: () => void;
}

function loadForumPosts(): ForumPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("forum_posts");
    if (!raw) return [];
    return JSON.parse(raw) as ForumPost[];
  } catch {
    return [];
  }
}

function loadUserSet(keyBase: string, username: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${keyBase}_${username}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function loadCoins(username: string): number {
  if (typeof window === "undefined") return 1000;
  try {
    const raw = localStorage.getItem(`mimi_coins_${username}`);
    return raw ? Number(raw) : 1000;
  } catch {
    return 1000;
  }
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export default function UserProfileApp({ username, isSelf = false, onClose }: UserProfileAppProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "favorites">("posts");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState<number>(1000);

  useEffect(() => {
    setPosts(loadForumPosts());
    setLikedIds(loadUserSet("forum_likes", username));
    setFavoritedIds(loadUserSet("forum_favorites", username));
    setCoins(loadCoins(username));
  }, [username]);

  const userPosts = useMemo(
    () => posts.filter((p) => p.author === username).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts, username]
  );

  const likedPosts = useMemo(
    () => posts.filter((p) => likedIds.has(p.id)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts, likedIds]
  );

  const favoritePosts = useMemo(
    () => posts.filter((p) => favoritedIds.has(p.id)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts, favoritedIds]
  );

  const isTeacher = false; // TODO: 后续接入真实身份系统

  const renderPostItem = (post: ForumPost) => (
    <div key={post.id} className="bg-white/60 backdrop-blur-md rounded-xl p-3 mb-2 border border-white/40">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {post.sectionName || post.section}
        </span>
        {post.isEssence && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">精华</span>}
      </div>
      <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">{post.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{formatTime(post.createdAt)}</span>
        <div className="flex items-center gap-3">
          <span>👁 {post.viewCount}</span>
          <span>👍 {post.likes}</span>
          <span>💬 {post.replyCount}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-page flex flex-col h-full bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-white/40 backdrop-blur-md shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 active:scale-90 transition-transform"
        >
          ←
        </button>
        <span className="font-semibold text-foreground">{isSelf ? "我的主页" : "用户主页"}</span>
        <div className="w-8" />
      </div>

      {/* User info */}
      <div className="px-4 py-5 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-3xl border-2 border-white/60 shadow-sm">
            👤
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{username}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                🪙 {coins} 米米币
              </span>
              {isTeacher && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">米老师</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (self only) */}
      {isSelf ? (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border/20 bg-white/30 shrink-0">
          {[
            { key: "posts", label: "我的帖子" },
            { key: "likes", label: "我的点赞" },
            { key: "favorites", label: "我的收藏" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "posts" | "likes" | "favorites")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/40 text-muted-foreground hover:bg-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {isTeacher && !isSelf && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground mb-2">上的课</h3>
            <div className="text-xs text-muted-foreground bg-white/40 rounded-lg p-3">暂无课程</div>
            <h3 className="text-sm font-semibold text-foreground mb-2 mt-3">正在上的课</h3>
            <div className="text-xs text-muted-foreground bg-white/40 rounded-lg p-3">暂无课程</div>
          </div>
        )}

        {!isSelf && <h3 className="text-sm font-semibold text-foreground mb-2">发布的帖子</h3>}

        {activeTab === "posts" && (
          <>
            {userPosts.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 bg-white/40 rounded-xl">还没有发布过帖子</div>
            ) : (
              userPosts.map(renderPostItem)
            )}
          </>
        )}

        {activeTab === "likes" && (
          <>
            {likedPosts.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 bg-white/40 rounded-xl">还没有点赞过帖子</div>
            ) : (
              likedPosts.map(renderPostItem)
            )}
          </>
        )}

        {activeTab === "favorites" && (
          <>
            {favoritePosts.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 bg-white/40 rounded-xl">还没有收藏过帖子</div>
            ) : (
              favoritePosts.map(renderPostItem)
            )}
          </>
        )}
      </div>
    </div>
  );
}
