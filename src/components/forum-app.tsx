"use client";
import { useState, useEffect, useCallback } from "react";

// ============ 类型定义 ============
interface ForumPost {
    id: string;
    title: string;
    content: string;
    author: string;
    authorAvatar: string;
    section: string;
    replyCount: number;
    viewCount: number;
    createdAt: string;
    lastReplyAt: string;
    status: "normal" | "pending" | "deleted" | "hidden";
    isEssence: boolean;
    isPinned: boolean;
    isLocked: boolean;
    replies: ForumReply[];
    likes: number;
    favorites: number;
}

interface ForumReply {
    id: string;
    postId: string;
    content: string;
    author: string;
    authorAvatar: string;
    createdAt: string;
    isPinned: boolean;
    isDeleted: boolean;
    subReplies: ForumSubReply[];
}

interface ForumSubReply {
    id: string;
    replyId: string;
    content: string;
    author: string;
    authorAvatar: string;
    createdAt: string;
    replyTo: string;
}

interface ForumSection {
    id: string;
    icon: string;
    name: string;
    desc: string;
    postCount: number;
}

interface OfficialNotice {
    id: string;
    title: string;
    content: string;
    author: string;
    createdBy: string;
    createdAt: string;
    linkSection?: string;
}

// ============ localStorage 数据持久化 ============
function loadOfficialNotices(): OfficialNotice[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem("forum_official_notices");
        if (raw) return JSON.parse(raw) as OfficialNotice[];
    } catch {
        // ignore
    }
    return [];
}

function saveOfficialNotices(notices: OfficialNotice[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem("forum_official_notices", JSON.stringify(notices));
}

function loadBugReports(): ForumPost[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem("forum_bug_reports");
        if (raw) return JSON.parse(raw) as ForumPost[];
    } catch {
        // ignore
    }
    return [];
}

function saveBugReports(reports: ForumPost[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem("forum_bug_reports", JSON.stringify(reports));
}

// ============ Mock 数据 ============
const MOCK_SECTIONS: ForumSection[] = [
    { id: "creative", icon: "🎨", name: "同人创作", desc: "文字描述、创作讨论", postCount: 128 },
    { id: "cp", icon: "💬", name: "CP讨论", desc: "日常嗑糖、剧情讨论", postCount: 256 },
    { id: "fanfic", icon: "", name: "同人文", desc: "粉丝创作的故事", postCount: 89 },
    { id: "event", icon: "🏆", name: "活动专区", desc: "比赛投票", postCount: 24 },
    { id: "announce", icon: "📢", name: "公告板", desc: "仅管理员可发帖", postCount: 12 },
    { id: "bug-report", icon: "🐛", name: "Bug反馈", desc: "提交bug与功能建议", postCount: 0 }
];

const MOCK_POSTS: ForumPost[] = [
    {
        id: "p1",
        title: "【置顶】【公告】社区规范 v2.0 请仔细阅读",
        content: "欢迎各位甜玉米来到社区论坛！\n\n为了维护良好的讨论环境，请大家遵守以下规范：\n1. 禁止人身攻击、恶意引战\n2. 禁止发布广告、spam 内容\n3. 尊重他人创作，转载需注明出处\n4. 管理员有权删除违规内容\n\n感谢大家的配合！",
        author: "管理员",
        authorAvatar: "👑",
        section: "announce",
        replyCount: 45,
        viewCount: 1280,
        createdAt: "2024-01-01 10:00",
        lastReplyAt: "2024-01-15 14:30",
        status: "normal",
        likes: 128,
        favorites: 56,
        isEssence: true,
        isPinned: true,
        isLocked: true,
        replies: [
            {
                id: "r1",
                postId: "p1",
                content: "收到！会严格遵守社区规范的～",
                author: "甜玉米1号",
                authorAvatar: "🌽",
                createdAt: "2024-01-01 10:30",
                isPinned: false,
                isDeleted: false,
                subReplies: [
                    {
                        id: "sr1",
                        replyId: "r1",
                        content: "欢迎新人！",
                        author: "管理员",
                        authorAvatar: "",
                        createdAt: "2024-01-01 11:00",
                        replyTo: "甜玉米1号"
                    }
                ]
            }
        ]
    },
    {
        id: "p2",
        title: "田栩宁和梓渝的100个甜蜜瞬间（持续更新）",
        content: "开这个帖子是为了记录田栩宁和梓渝的甜蜜瞬间！\n\n1. 第一次见面时田栩宁主动帮梓渝拿行李\n2. 梓渝生病时田栩宁整夜照顾\n3. 两人一起做饭时田栩宁从背后抱住梓渝\n4. 梓渝给田栩宁织围巾，虽然织得歪歪扭扭\n5. 田栩宁偷偷给梓渝准备惊喜生日派对\n...\n\n大家还有什么补充的欢迎评论！",
        author: "糖小能手",
        authorAvatar: "🍬",
        section: "cp",
        replyCount: 234,
        viewCount: 5680,
        createdAt: "2024-01-10 09:00",
        lastReplyAt: "2024-01-15 16:45",
        status: "normal",
        likes: 356,
        favorites: 128,
        isEssence: true,
        isPinned: false,
        isLocked: false,
        replies: [
            {
                id: "r2",
                postId: "p2",
                content: "补充一个！上次直播时田栩宁看梓渝的眼神真的绝了，满满的爱意都要溢出来了",
                author: "显微镜女孩",
                authorAvatar: "🔍",
                createdAt: "2024-01-10 10:30",
                isPinned: false,
                isDeleted: false,
                subReplies: [
                    {
                        id: "sr2",
                        replyId: "r2",
                        content: "对对对！我也注意到了，当时我就截图了",
                        author: "嗑糖小能手",
                        authorAvatar: "🍬",
                        createdAt: "2024-01-10 11:00",
                        replyTo: "显微镜女孩"
                    }
                ]
            },
            {
                id: "r3",
                postId: "p2",
                content: "还有那次采访，主持人问梓渝最喜欢田栩宁什么，梓渝说\"全部\"，田栩宁脸都红了哈哈",
                author: "CP粉头",
                authorAvatar: "💕",
                createdAt: "2024-01-11 14:20",
                isPinned: false,
                isDeleted: false,
                subReplies: []
            }
        ]
    },
    {
        id: "p3",
        title: "【同人】《逆光》续写 - 如果那天他们没有错过",
        content: "如果那天他们没有错过...\n\n田栩宁站在机场大厅，看着梓渝的背影消失在人群中。他的手紧紧攥着那张机票，指节发白。\n\n\"梓渝...\"他低声呢喃，声音被机场的喧嚣淹没。\n\n如果当时他追上去，如果当时他说出那句话，如果...\n\n可是没有如果。\n\n三年后，田栩宁在一家咖啡馆偶遇梓渝。对方瘦了，也成熟了，但那双眼睛依然清澈。\n\n\"好久不见。\"梓渝微笑着说。\n\n田栩宁的心跳漏了一拍。三年了，他以为自己已经放下了，但在看到梓渝的那一刻，所有的感情都涌了上来。\n\n\"好久不见。\"他听到自己说。\n\n（未完待续）",
        author: "文笔担当",
        authorAvatar: "️",
        section: "fanfic",
        replyCount: 67,
        viewCount: 2340,
        createdAt: "2024-01-12 20:00",
        lastReplyAt: "2024-01-15 12:00",
        status: "normal",
        likes: 89,
        favorites: 34,
        isEssence: false,
        isPinned: false,
        isLocked: false,
        replies: [
            {
                id: "r4",
                postId: "p3",
                content: "文笔太好了！求更新！",
                author: "催更小能手",
                authorAvatar: "⏰",
                createdAt: "2024-01-12 21:00",
                isPinned: false,
                isDeleted: false,
                subReplies: []
            }
        ]
    },
    {
        id: "p4",
        title: "大家觉得田栩宁和梓渝什么时候会官宣？",
        content: "如题，我赌今年之内！\n\n理由：\n1. 两人最近互动越来越频繁\n2. 田栩宁微博发的\"某人\"明显是指梓渝\n3. 梓渝新歌 MV 田栩宁友情出演\n4. 两人粉丝都在催官宣\n\n大家觉得呢？",
        author: "理性分析帝",
        authorAvatar: "",
        section: "cp",
        replyCount: 156,
        viewCount: 4560,
        createdAt: "2024-01-13 15:00",
        lastReplyAt: "2024-01-15 18:30",
        status: "normal",
        likes: 245,
        favorites: 78,
        isEssence: false,
        isPinned: false,
        isLocked: false,
        replies: []
    },
    {
        id: "p5",
        title: "【绘画】画了一张田栩宁和梓渝的 Q 版图",
        content: "第一次画 CP 图，画得不好请见谅～\n\n画的是两人一起做饭的场景，田栩宁从背后抱住梓渝，梓渝在炒菜，锅里还冒着热气。\n\n希望大家喜欢！",
        author: "画画小能手",
        authorAvatar: "🎨",
        section: "creative",
        replyCount: 89,
        viewCount: 3210,
        createdAt: "2024-01-14 10:00",
        lastReplyAt: "2024-01-15 20:00",
        status: "normal",
        likes: 167,
        favorites: 56,
        isEssence: false,
        isPinned: false,
        isLocked: false,
        replies: []
    }
];

// ============ 论坛组件 ============
interface ForumAppProps {
    onClose?: () => void;
    isAdmin?: boolean;
    loginUsername?: string;
    onViewUserProfile?: (username: string) => void;
}

export function ForumApp({ onClose, isAdmin = false, loginUsername = "", onViewUserProfile }: ForumAppProps = {}) {
    const [view, setView] = useState<"sections" | "posts" | "postDetail" | "newPost" | "search">("sections");
    const [currentSection, setCurrentSection] = useState<string | null>(null);
    const [currentPost, setCurrentPost] = useState<ForumPost | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>(MOCK_POSTS);
    const [sortBy, setSortBy] = useState<"latest" | "hot" | "essence">("latest");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<"post" | "user">("post");
    const [searchFilter, setSearchFilter] = useState<{ section: string; time: string; essenceOnly: boolean }>({
        section: "all",
        time: "all",
        essenceOnly: false
    });

    // 发帖表单
    const [newPostSection, setNewPostSection] = useState("");
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostContent, setNewPostContent] = useState("");

    // 回复表单
    const [replyContent, setReplyContent] = useState("");
    const [replyToReplyId, setReplyToReplyId] = useState<string | null>(null);
    const [replyToAuthor, setReplyToAuthor] = useState("");

    // 举报表单
    const [reportPostId, setReportPostId] = useState<string | null>(null);
    const [reportType, setReportType] = useState("");
    const [reportDesc, setReportDesc] = useState("");

    // 用户点赞/收藏记录
    const userKey = loginUsername || "guest";
    const [likedPostIds, setLikedPostIds] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(`forum_likes_${userKey}`);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [favoritedPostIds, setFavoritedPostIds] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(`forum_favorites_${userKey}`);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // 官方通知（仅管理员可发布，所有用户可见）
    const [officialNotices, setOfficialNotices] = useState<OfficialNotice[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            return JSON.parse(localStorage.getItem("forum_official_notices") || "[]");
        } catch {
            return [];
        }
    });
    const [newNoticeTitle, setNewNoticeTitle] = useState("");
    const [newNoticeContent, setNewNoticeContent] = useState("");
    const [showNoticeForm, setShowNoticeForm] = useState(false);

    // Bug反馈（所有用户可提交，admin可回复）
    const [bugReports, setBugReports] = useState<ForumPost[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            return JSON.parse(localStorage.getItem("forum_bug_reports") || "[]");
        } catch {
            return [];
        }
    });

    // 发布官方通知（仅admin）
    const handlePublishNotice = () => {
        const title = newNoticeTitle.trim();
        const content = newNoticeContent.trim();
        if (!title || !content) return;
        const notice: OfficialNotice = {
            id: Date.now().toString(),
            title,
            content,
            author: "官方通知",
            createdAt: new Date().toISOString(),
            createdBy: loginUsername || "admin",
            linkSection: "",
        };
        setOfficialNotices(prev => [notice, ...prev]);
        setNewNoticeTitle("");
        setNewNoticeContent("");
        setShowNoticeForm(false);
    };

    // 获取板块信息
    const getSection = (id: string) => MOCK_SECTIONS.find(s => s.id === id);

    // 过滤和排序帖子
    const getFilteredPosts = () => {
        // Bug 反馈板块单独读取
        if (currentSection === "bug-report") {
            return [...bugReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        let filtered = posts.filter(p => p.status === "normal");

        // 按板块过滤
        if (currentSection) {
            filtered = filtered.filter(p => p.section === currentSection);
        }

        // 排序
        const pinned = filtered.filter(p => p.isPinned);
        const unpinned = filtered.filter(p => !p.isPinned);

        let sorted = unpinned;
        switch (sortBy) {
            case "latest":
                sorted = [...unpinned].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case "hot":
                sorted = [...unpinned].sort((a, b) => (b.likes + b.viewCount) - (a.likes + a.viewCount));
                break;
            case "essence":
                sorted = [...unpinned].filter(p => p.isEssence).sort((a, b) => (b.likes + b.viewCount) - (a.likes + a.viewCount));
                break;
        }

        return [...pinned, ...sorted];
    };

    // 搜索
    const getSearchResults = () => {
        let results = posts.filter(p => p.status === "normal");

        if (searchType === "post") {
            results = results.filter(p =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            results = results.filter(p =>
                p.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (searchFilter.section !== "all") {
            results = results.filter(p => p.section === searchFilter.section);
        }

        if (searchFilter.essenceOnly) {
            results = results.filter(p => p.isEssence);
        }

        return results;
    };

    // 持久化官方通知和Bug反馈
    useEffect(() => {
        try {
            localStorage.setItem("forum_official_notices", JSON.stringify(officialNotices));
        } catch {}
    }, [officialNotices]);

    useEffect(() => {
        try {
            localStorage.setItem("forum_bug_reports", JSON.stringify(bugReports));
        } catch {}
    }, [bugReports]);

    const incrementViewCount = useCallback((postId: string): ForumPost | undefined => {
        let updated: ForumPost | undefined;
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            updated = { ...p, viewCount: p.viewCount + 1 };
            return updated;
        }));
        setBugReports(prev => prev.map(p => {
            if (p.id !== postId) return p;
            const bugUpdated = { ...p, viewCount: p.viewCount + 1 };
            updated = bugUpdated;
            return bugUpdated;
        }));
        return updated;
    }, []);

    const toggleLike = useCallback((postId: string) => {
        const liked = likedPostIds.includes(postId);
        setLikedPostIds(prev => liked ? prev.filter(id => id !== postId) : [...prev, postId]);
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            return { ...p, likes: Math.max(0, p.likes + (liked ? -1 : 1)) };
        }));
        setBugReports(prev => prev.map(p => {
            if (p.id !== postId) return p;
            return { ...p, likes: Math.max(0, p.likes + (liked ? -1 : 1)) };
        }));
    }, [likedPostIds]);

    const toggleFavorite = useCallback((postId: string) => {
        const favorited = favoritedPostIds.includes(postId);
        setFavoritedPostIds(prev => favorited ? prev.filter(id => id !== postId) : [...prev, postId]);
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            return { ...p, favorites: Math.max(0, p.favorites + (favorited ? -1 : 1)) };
        }));
        setBugReports(prev => prev.map(p => {
            if (p.id !== postId) return p;
            return { ...p, favorites: Math.max(0, p.favorites + (favorited ? -1 : 1)) };
        }));
    }, [favoritedPostIds]);

    // 发帖
    const handleCreatePost = useCallback(() => {
        if (!newPostTitle.trim() || !newPostContent.trim() || !newPostSection) return;

        const now = new Date().toLocaleString("zh-CN");
        const newPost: ForumPost = {
            id: `p${crypto.randomUUID()}`,
            title: newPostTitle,
            content: newPostContent,
            author: "我",
            authorAvatar: "🌽",
            section: newPostSection,
            replyCount: 0,
            viewCount: 0,
            likes: 0,
            favorites: 0,
            createdAt: now,
            lastReplyAt: now,
            status: "normal",
            isEssence: false,
            isPinned: false,
            isLocked: false,
            replies: []
        };

        if (newPostSection === "bug-report") {
            setBugReports([newPost, ...bugReports]);
        } else {
            setPosts([newPost, ...posts]);
        }
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostSection("");
        setView("posts");
        setCurrentSection(newPostSection);
    }, [newPostTitle, newPostContent, newPostSection, posts, bugReports]);

    // 回复
    const handleReply = useCallback(() => {
        if (!replyContent.trim() || !currentPost) return;

        const now = new Date().toLocaleString("zh-CN");
        const newReply: ForumReply = {
            id: `r${crypto.randomUUID()}`,
            postId: currentPost.id,
            content: replyContent,
            author: "我",
            authorAvatar: "🌽",
            createdAt: now,
            isPinned: false,
            isDeleted: false,
            subReplies: []
        };

        const updatedPosts = posts.map(p => {
            if (p.id === currentPost.id) {
                return {
                    ...p,
                    replies: [...p.replies, newReply],
                    replyCount: p.replyCount + 1,
                    lastReplyAt: now
                };
            }
            return p;
        });

        setPosts(updatedPosts);
        setCurrentPost(updatedPosts.find(p => p.id === currentPost.id) || null);
        setReplyContent("");
        setReplyToReplyId(null);
        setReplyToAuthor("");
    }, [replyContent, currentPost, posts]);

    // 楼中楼回复
    const handleSubReply = (replyId: string, replyToAuthor: string) => {
        setReplyToReplyId(replyId);
        setReplyToAuthor(replyToAuthor);
    };

    // 提交楼中楼回复
    const handleSubmitSubReply = useCallback(() => {
        if (!replyContent.trim() || !currentPost || !replyToReplyId) return;

        const now = new Date().toLocaleString("zh-CN");
        const newSubReply: ForumSubReply = {
            id: `sr${crypto.randomUUID()}`,
            replyId: replyToReplyId,
            content: replyContent,
            author: "我",
            authorAvatar: "",
            createdAt: now,
            replyTo: replyToAuthor
        };

        const updatedPosts = posts.map(p => {
            if (p.id === currentPost.id) {
                return {
                    ...p,
                    replies: p.replies.map(r => {
                        if (r.id === replyToReplyId) {
                            return {
                                ...r,
                                subReplies: [...r.subReplies, newSubReply]
                            };
                        }
                        return r;
                    }),
                    replyCount: p.replyCount + 1,
                    lastReplyAt: now
                };
            }
            return p;
        });

        setPosts(updatedPosts);
        setCurrentPost(updatedPosts.find(p => p.id === currentPost.id) || null);
        setReplyContent("");
        setReplyToReplyId(null);
        setReplyToAuthor("");
    }, [replyContent, currentPost, replyToReplyId, replyToAuthor, posts]);

    // 删除评论（楼主）
    const handleDeleteReply = (replyId: string) => {
        if (!currentPost) return;

        const updatedPosts = posts.map(p => {
            if (p.id === currentPost.id) {
                return {
                    ...p,
                    replies: p.replies.map(r => {
                        if (r.id === replyId) {
                            return { ...r, isDeleted: true };
                        }
                        return r;
                    }),
                    replyCount: Math.max(0, p.replyCount - 1)
                };
            }
            return p;
        });

        setPosts(updatedPosts);
        setCurrentPost(updatedPosts.find(p => p.id === currentPost.id) || null);
    };

    // 置顶回复（楼主）
    const handlePinReply = (replyId: string) => {
        if (!currentPost) return;

        const updatedPosts = posts.map(p => {
            if (p.id === currentPost.id) {
                return {
                    ...p,
                    replies: p.replies.map(r => {
                        if (r.id === replyId) {
                            return { ...r, isPinned: !r.isPinned };
                        }
                        return { ...r, isPinned: false }; // 取消其他置顶
                    })
                };
            }
            return p;
        });

        setPosts(updatedPosts);
        setCurrentPost(updatedPosts.find(p => p.id === currentPost.id) || null);
    };

    // 举报
    const handleReport = () => {
        if (!reportPostId || !reportType || !reportDesc.trim()) return;

        // TODO: 调用举报 API
        alert("举报成功，管理员会尽快处理");
        setReportPostId(null);
        setReportType("");
        setReportDesc("");
    };

    // ============ 渲染：板块列表 ============
    const renderSections = () => (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
            {/* 顶部标题栏 */}
            <div style={{
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                padding: "16px 20px",
                color: "#fff",
                position: "relative"
            }}>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            background: "rgba(255,255,255,0.25)",
                            border: "1px solid rgba(255,255,255,0.4)",
                            borderRadius: 8,
                            padding: "4px 10px",
                            color: "#fff",
                            fontSize: 13,
                            cursor: "pointer",
                            backdropFilter: "blur(4px)"
                        }}>
                        退出
                    </button>
                )}
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>💬 社区论坛</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>甜玉米粉丝交流社区</div>
            </div>

            {/* 搜索入口 */}
            <div style={{ padding: "12px 16px", background: "#fff" }}>
                <div
                    onClick={() => setView("search")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        background: "#f5f5f5",
                        borderRadius: 20,
                        fontSize: 14,
                        color: "#999",
                        cursor: "pointer"
                    }}>
                    <span>🔍</span>
                    <span>搜索帖子或用户</span>
                </div>
            </div>

            {/* 官方通知置顶 */}
            {officialNotices.length > 0 && (
                <div style={{ padding: "0 16px 12px", background: "#fff" }}>
                    <div
                        onClick={() => {
                            if (officialNotices[0].linkSection) {
                                setCurrentSection(officialNotices[0].linkSection);
                            }
                        }}
                        style={{
                            padding: "12px 14px",
                            background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                            borderRadius: 12,
                            border: "1px solid #b8dcc4",
                            cursor: officialNotices[0].linkSection ? "pointer" : "default"
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>📢</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#2e5c33" }}>官方通知</span>
                            <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>
                                {officialNotices[0].createdAt}
                            </span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#2e5c33", marginBottom: 4 }}>
                            {officialNotices[0].title}
                        </div>
                        <div style={{ fontSize: 13, color: "#4a7c50", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                            {officialNotices[0].content.length > 80
                                ? officialNotices[0].content.slice(0, 80) + "..."
                                : officialNotices[0].content}
                        </div>
                    </div>
                </div>
            )}

            {/* 管理员发布通知入口 */}
            {isAdmin && (
                <div style={{ padding: "0 16px 12px", background: "#fff" }}>
                    <button
                        onClick={() => setShowNoticeForm(!showNoticeForm)}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: showNoticeForm ? "#fff" : "#f5f0e8",
                            border: "1px solid #d4c8b8",
                            borderRadius: 12,
                            fontSize: 14,
                            color: "#5a4a3a",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6
                        }}>
                        <span>{showNoticeForm ? "取消" : "✏️ 发布官方通知"}</span>
                    </button>
                </div>
            )}

            {showNoticeForm && isAdmin && (
                <div style={{ padding: "0 16px 12px", background: "#fff" }}>
                    <div style={{ padding: 12, background: "#fafafa", borderRadius: 12, border: "1px solid #eee" }}>
                        <input
                            type="text"
                            placeholder="通知标题"
                            value={newNoticeTitle}
                            onChange={e => setNewNoticeTitle(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 10px",
                                marginBottom: 8,
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                fontSize: 14,
                                background: "#fff"
                            }}
                        />
                        <textarea
                            placeholder="通知内容"
                            value={newNoticeContent}
                            onChange={e => setNewNoticeContent(e.target.value)}
                            rows={3}
                            style={{
                                width: "100%",
                                padding: "8px 10px",
                                marginBottom: 8,
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                fontSize: 14,
                                resize: "none",
                                background: "#fff"
                            }}
                        />
                        <button
                            onClick={handlePublishNotice}
                            style={{
                                width: "100%",
                                padding: "10px",
                                background: "#2e7d32",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                fontSize: 14,
                                cursor: "pointer"
                            }}>
                            发布置顶通知
                        </button>
                    </div>
                </div>
            )}

            {/* 板块列表 */}
            <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
                {MOCK_SECTIONS.map(section => (
                    <div
                        key={section.id}
                        onClick={() => {
                            setCurrentSection(section.id);
                            setView("posts");
                        }}
                        style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                        }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            flexShrink: 0
                        }}>{section.icon}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", marginBottom: 4 }}>{section.name}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>{section.desc}</div>
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: "#f97316",
                            background: "#fff7ed",
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontWeight: 500
                        }}>{section.postCount} 帖</div>
                    </div>
                ))}
            </div>

            {/* 底部发帖按钮 */}
            <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                <button
                    onClick={() => setView("newPost")}
                    style={{
                        width: "100%",
                        padding: 14,
                        background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer"
                    }}>✏️ 发布新帖</button>
            </div>
        </div>
    );

    // ============ 渲染：帖子列表 ============
    const renderPosts = () => {
        const filteredPosts = getFilteredPosts();
        const section = getSection(currentSection || "");

        return (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
                {/* 顶部标题栏 */}
                <div style={{
                    background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                    padding: "16px 20px",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                }}>
                    <button
                        onClick={() => {
                            setView("sections");
                            setCurrentSection(null);
                        }}
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            color: "#fff",
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            fontSize: 18,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>←</button>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{section?.icon} {section?.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>{section?.desc}</div>
                    </div>
                </div>

                {/* 排序切换 */}
                <div style={{
                    background: "#fff",
                    padding: "10px 16px",
                    display: "flex",
                    gap: 8,
                    borderBottom: "1px solid #f0f0f0",
                    overflowX: "auto"
                }}>
                    {[
                        { key: "latest", label: "最新发布" },
                        { key: "hot", label: "最热帖子" },
                        { key: "essence", label: "精华帖子" }
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setSortBy(item.key as "latest" | "hot" | "essence")}
                            style={{
                                padding: "6px 14px",
                                background: sortBy === item.key ? "#f97316" : "#f5f5f5",
                                color: sortBy === item.key ? "#fff" : "#666",
                                border: "none",
                                borderRadius: 16,
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                            }}>{item.label}</button>
                    ))}
                </div>

                {/* 帖子列表 */}
                <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
                    {filteredPosts.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: 40,
                            color: "#999"
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                            <div style={{ fontSize: 14 }}>暂无帖子</div>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => {
                                    const updated = incrementViewCount(post.id) || post;
                                    setCurrentPost(updated);
                                    setView("postDetail");
                                }}
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 12,
                                    cursor: "pointer",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                }}>
                                {/* 标题 */}
                                <div style={{ fontSize: 15, fontWeight: 600, color: "#1f2937", marginBottom: 8, lineHeight: 1.4 }}>
                                    {post.isPinned && <span style={{ color: "#f97316", marginRight: 6 }}></span>}
                                    {post.isEssence && <span style={{ color: "#f59e0b", marginRight: 6 }}>⭐</span>}
                                    {post.isLocked && <span style={{ color: "#9ca3af", marginRight: 6 }}></span>}
                                    {post.title}
                                </div>

                                {/* 作者信息 */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <span style={{ fontSize: 18 }}>{post.authorAvatar}</span>
                                    <span
                                      style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, cursor: onViewUserProfile ? "pointer" : "default" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewUserProfile?.(post.author);
                                      }}
                                    >{post.author}</span>
                                    <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{post.createdAt}</span>
                                </div>

                                {/* 统计信息 */}
                                <div style={{
                                    display: "flex",
                                    gap: 16,
                                    fontSize: 12,
                                    color: "#9ca3af"
                                }}>
                                    <span>💬 {post.replyCount} 回复</span>
                                    <span>👁 {post.viewCount} 浏览</span>
                                    <span>👍 {post.likes} 赞</span>
                                    <span>⭐ {post.favorites} 收藏</span>
                                    <span style={{ marginLeft: "auto" }}>最后回复 {post.lastReplyAt}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 底部发帖按钮 */}
                <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                    <button
                        onClick={() => setView("newPost")}
                        style={{
                            width: "100%",
                            padding: 14,
                            background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer"
                        }}>✏️ 发布新帖</button>
                </div>
            </div>
        );
    };

    // ============ 渲染：帖子详情 ============
    const renderPostDetail = () => {
        if (!currentPost) return null;

        // 排序回复：置顶优先
        const sortedReplies = [...currentPost.replies].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });

        return (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
                {/* 顶部标题栏 */}
                <div style={{
                    background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                    padding: "16px 20px",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                }}>
                    <button
                        onClick={() => {
                            setView("posts");
                            setCurrentPost(null);
                        }}
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            color: "#fff",
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            fontSize: 18,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>←</button>
                    <div style={{ flex: 1, fontSize: 16, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        帖子详情
                    </div>
                    <button
                        onClick={() => setReportPostId(currentPost.id)}
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            cursor: "pointer"
                        }}> 举报</button>
                </div>

                {/* 帖子内容 */}
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                    {/* 主帖 */}
                    <div style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#1f2937", marginBottom: 12, lineHeight: 1.5 }}>
                            {currentPost.isPinned && <span style={{ color: "#f97316", marginRight: 6 }}>📌</span>}
                            {currentPost.isEssence && <span style={{ color: "#f59e0b", marginRight: 6 }}>⭐</span>}
                            {currentPost.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <span style={{ fontSize: 20 }}>{currentPost.authorAvatar}</span>
                            <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>{currentPost.author}</span>
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>{currentPost.createdAt}</span>
                        </div>
                        <div style={{
                            fontSize: 14,
                            color: "#374151",
                            lineHeight: 1.8,
                            whiteSpace: "pre-wrap",
                            marginBottom: 14
                        }}>{currentPost.content}</div>
                        <div style={{
                            display: "flex",
                            gap: 16,
                            fontSize: 13,
                            color: "#9ca3af",
                            borderTop: "1px solid #f3f4f6",
                            paddingTop: 12
                        }}>
                            <span
                                onClick={() => toggleLike(currentPost.id)}
                                style={{
                                    cursor: "pointer",
                                    color: likedPostIds.includes(currentPost.id) ? "#ef4444" : "#6b7280",
                                    fontWeight: likedPostIds.includes(currentPost.id) ? 700 : 400
                                }}
                            >
                                {likedPostIds.includes(currentPost.id) ? "❤️" : "🤍"} {currentPost.likes}
                            </span>
                            <span
                                onClick={() => toggleFavorite(currentPost.id)}
                                style={{
                                    cursor: "pointer",
                                    color: favoritedPostIds.includes(currentPost.id) ? "#f59e0b" : "#6b7280",
                                    fontWeight: favoritedPostIds.includes(currentPost.id) ? 700 : 400
                                }}
                            >
                                {favoritedPostIds.includes(currentPost.id) ? "⭐" : "☆"} {currentPost.favorites}
                            </span>
                            <span>💬 {currentPost.replyCount} 回复</span>
                            <span>👁 {currentPost.viewCount} 浏览</span>
                        </div>
                    </div>

                    {/* 回复列表 */}
                    <div style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 16,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#1f2937", marginBottom: 14 }}>
                            全部评论 ({currentPost.replyCount})
                        </div>

                        {sortedReplies.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>
                                <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                                <div style={{ fontSize: 13 }}>暂无评论，快来抢沙发～</div>
                            </div>
                        ) : (
                            sortedReplies.map((reply, idx) => (
                                <div key={reply.id} style={{
                                    padding: "14px 0",
                                    borderBottom: idx < sortedReplies.length - 1 ? "1px solid #f3f4f6" : "none"
                                }}>
                                    {reply.isPinned && (
                                        <div style={{
                                            fontSize: 12,
                                            color: "#f97316",
                                            background: "#fff7ed",
                                            padding: "4px 10px",
                                            borderRadius: 12,
                                            display: "inline-block",
                                            marginBottom: 8,
                                            fontWeight: 500
                                        }}>📌 楼主置顶</div>
                                    )}
                                    <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                                        <span style={{ fontSize: 18 }}>{reply.authorAvatar}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>{reply.author}</span>
                                                <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
                                                <span style={{ fontSize: 12, color: "#9ca3af" }}>{reply.createdAt}</span>
                                            </div>
                                            <div style={{
                                                fontSize: 14,
                                                color: "#374151",
                                                lineHeight: 1.6,
                                                marginBottom: 8
                                            }}>{reply.content}</div>

                                            {/* 楼中楼回复 */}
                                            {reply.subReplies.length > 0 && (
                                                <div style={{
                                                    background: "#f9fafb",
                                                    borderRadius: 8,
                                                    padding: 10,
                                                    marginTop: 8
                                                }}>
                                                    {reply.subReplies.map(subReply => (
                                                        <div key={subReply.id} style={{ marginBottom: 8 }}>
                                                            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                                                                <span style={{ color: "#6b7280", fontWeight: 500 }}>{subReply.author}</span>
                                                                <span style={{ color: "#9ca3af", margin: "0 6px" }}>回复</span>
                                                                <span style={{ color: "#f97316", fontWeight: 500 }}>{subReply.replyTo}</span>
                                                                <span style={{ color: "#374151" }}>：{subReply.content}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 回复操作 */}
                                            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                                                <button
                                                    onClick={() => handleSubReply(reply.id, reply.author)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#9ca3af",
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                        padding: 0
                                                    }}>💬 回复</button>
                                                {currentPost.author === "我" && (
                                                    <>
                                                        <button
                                                            onClick={() => handlePinReply(reply.id)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: reply.isPinned ? "#f97316" : "#9ca3af",
                                                                fontSize: 12,
                                                                cursor: "pointer",
                                                                padding: 0
                                                            }}>{reply.isPinned ? "📌 取消置顶" : "📌 置顶"}</button>
                                                        <button
                                                            onClick={() => handleDeleteReply(reply.id)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#ef4444",
                                                                fontSize: 12,
                                                                cursor: "pointer",
                                                                padding: 0
                                                            }}>🗑 删除</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 回复框（锁定帖隐藏） */}
                {!currentPost.isLocked && (
                    <div style={{
                        padding: "12px 16px",
                        background: "#fff",
                        borderTop: "1px solid #f0f0f0"
                    }}>
                        {replyToReplyId && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                background: "#fff7ed",
                                borderRadius: 8,
                                marginBottom: 8,
                                fontSize: 13,
                                color: "#f97316"
                            }}>
                                <span>回复 @{replyToAuthor}</span>
                                <button
                                    onClick={() => {
                                        setReplyToReplyId(null);
                                        setReplyToAuthor("");
                                    }}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#f97316",
                                        cursor: "pointer",
                                        fontSize: 16
                                    }}>×</button>
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                            <input
                                type="text"
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                placeholder={replyToReplyId ? `回复 @${replyToAuthor}` : "写下你的评论..."}
                                style={{
                                    flex: 1,
                                    padding: "10px 14px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 20,
                                    fontSize: 14,
                                    outline: "none"
                                }}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        if (replyToReplyId) {
                                            handleSubmitSubReply();
                                        } else {
                                            handleReply();
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (replyToReplyId) {
                                        handleSubmitSubReply();
                                    } else {
                                        handleReply();
                                    }
                                }}
                                style={{
                                    padding: "10px 20px",
                                    background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 20,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}>发送</button>
                        </div>
                    </div>
                )}

                {/* 举报弹窗 */}
                {reportPostId && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: 20
                    }}>
                        <div style={{
                            background: "#fff",
                            borderRadius: 16,
                            padding: 20,
                            width: "100%",
                            maxWidth: 360
                        }}>
                            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>🚨 举报帖子</div>
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>举报类型</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {["广告 spam", "人身攻击", "色情内容", "政治敏感", "其他"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setReportType(type)}
                                            style={{
                                                padding: "8px 14px",
                                                background: reportType === type ? "#f97316" : "#f5f5f5",
                                                color: reportType === type ? "#fff" : "#666",
                                                border: "none",
                                                borderRadius: 16,
                                                fontSize: 13,
                                                cursor: "pointer"
                                            }}>{type}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>举报描述</div>
                                <textarea
                                    value={reportDesc}
                                    onChange={e => setReportDesc(e.target.value)}
                                    placeholder="请详细描述举报原因..."
                                    style={{
                                        width: "100%",
                                        padding: 12,
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 10,
                                        fontSize: 14,
                                        resize: "none",
                                        height: 80,
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    onClick={() => {
                                        setReportPostId(null);
                                        setReportType("");
                                        setReportDesc("");
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        background: "#f5f5f5",
                                        color: "#666",
                                        border: "none",
                                        borderRadius: 10,
                                        fontSize: 14,
                                        cursor: "pointer"
                                    }}>取消</button>
                                <button
                                    onClick={handleReport}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        background: "#ef4444",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 10,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}>提交举报</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ============ 渲染：发帖页面 ============
    const renderNewPost = () => (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
            {/* 顶部标题栏 */}
            <div style={{
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                padding: "16px 20px",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 12
            }}>
                <button
                    onClick={() => setView("sections")}
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "none",
                        color: "#fff",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        fontSize: 18,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>←</button>
                <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>发布新帖</div>
            </div>

            {/* 表单 */}
            <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {/* 选择板块 */}
                <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>选择板块</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {MOCK_SECTIONS.filter(s => s.id !== "announce").map(section => (
                            <button
                                key={section.id}
                                onClick={() => setNewPostSection(section.id)}
                                style={{
                                    padding: "8px 16px",
                                    background: newPostSection === section.id ? "#f97316" : "#f5f5f5",
                                    color: newPostSection === section.id ? "#fff" : "#666",
                                    border: "none",
                                    borderRadius: 16,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}>{section.icon} {section.name}</button>
                        ))}
                    </div>
                </div>

                {/* 标题 */}
                <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
                        标题 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(2-50 字)</span>
                    </div>
                    <input
                        type="text"
                        value={newPostTitle}
                        onChange={e => setNewPostTitle(e.target.value)}
                        placeholder="请输入帖子标题..."
                        maxLength={50}
                        style={{
                            width: "100%",
                            padding: 12,
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box"
                        }}
                    />
                    <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right", marginTop: 6 }}>
                        {newPostTitle.length}/50
                    </div>
                </div>

                {/* 正文 */}
                <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", marginBottom: 12 }}>
                        正文 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(1-5000 字)</span>
                    </div>
                    <textarea
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                        placeholder="请输入帖子内容..."
                        maxLength={5000}
                        style={{
                            width: "100%",
                            padding: 12,
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            fontSize: 14,
                            resize: "none",
                            height: 200,
                            outline: "none",
                            boxSizing: "border-box",
                            lineHeight: 1.6
                        }}
                    />
                    <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right", marginTop: 6 }}>
                        {newPostContent.length}/5000
                    </div>
                </div>

                {/* 提示 */}
                <div style={{
                    background: "#fff7ed",
                    borderRadius: 12,
                    padding: 14,
                    marginTop: 12,
                    fontSize: 12,
                    color: "#f97316",
                    lineHeight: 1.6
                }}>
                    💡 发帖须知：
                    <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
                        <li>普通用户每天最多发 3 帖</li>
                        <li>新用户前 3 条帖子需审核后发布</li>
                        <li>禁止发布广告、人身攻击等内容</li>
                        <li>违规帖子将被删除或隐藏</li>
                    </ul>
                </div>
            </div>

            {/* 底部发布按钮 */}
            <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                <button
                    onClick={handleCreatePost}
                    disabled={!newPostTitle.trim() || !newPostContent.trim() || !newPostSection}
                    style={{
                        width: "100%",
                        padding: 14,
                        background: (!newPostTitle.trim() || !newPostContent.trim() || !newPostSection)
                            ? "#d1d5db"
                            : "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: (!newPostTitle.trim() || !newPostContent.trim() || !newPostSection) ? "not-allowed" : "pointer"
                    }}>发布帖子</button>
            </div>
        </div>
    );

    // ============ 渲染：搜索页面 ============
    const renderSearch = () => {
        const results = searchQuery ? getSearchResults() : [];

        return (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
                {/* 顶部标题栏 */}
                <div style={{
                    background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                    padding: "16px 20px",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                }}>
                    <button
                        onClick={() => setView("sections")}
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            color: "#fff",
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            fontSize: 18,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>←</button>
                    <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>搜索</div>
                </div>

                {/* 搜索框 */}
                <div style={{
                    background: "#fff",
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0"
                }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="搜索帖子或用户..."
                            style={{
                                flex: 1,
                                padding: "10px 14px",
                                border: "1px solid #e5e7eb",
                                borderRadius: 20,
                                fontSize: 14,
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={() => setSearchQuery("")}
                            style={{
                                padding: "10px 16px",
                                background: "#f5f5f5",
                                color: "#666",
                                border: "none",
                                borderRadius: 20,
                                fontSize: 14,
                                cursor: "pointer"
                            }}>清除</button>
                    </div>

                    {/* 搜索类型 */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <button
                            onClick={() => setSearchType("post")}
                            style={{
                                flex: 1,
                                padding: "8px 14px",
                                background: searchType === "post" ? "#f97316" : "#f5f5f5",
                                color: searchType === "post" ? "#fff" : "#666",
                                border: "none",
                                borderRadius: 16,
                                fontSize: 13,
                                cursor: "pointer"
                            }}> 搜帖子</button>
                        <button
                            onClick={() => setSearchType("user")}
                            style={{
                                flex: 1,
                                padding: "8px 14px",
                                background: searchType === "user" ? "#f97316" : "#f5f5f5",
                                color: searchType === "user" ? "#fff" : "#666",
                                border: "none",
                                borderRadius: 16,
                                fontSize: 13,
                                cursor: "pointer"
                            }}>👤 搜用户</button>
                    </div>

                    {/* 筛选条件 */}
                    <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                        <select
                            value={searchFilter.section}
                            onChange={e => setSearchFilter({ ...searchFilter, section: e.target.value })}
                            style={{
                                padding: "6px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: 16,
                                fontSize: 12,
                                outline: "none",
                                background: "#fff"
                            }}>
                            <option value="all">全部板块</option>
                            {MOCK_SECTIONS.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <label style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            background: searchFilter.essenceOnly ? "#fff7ed" : "#f5f5f5",
                            borderRadius: 16,
                            fontSize: 12,
                            cursor: "pointer"
                        }}>
                            <input
                                type="checkbox"
                                checked={searchFilter.essenceOnly}
                                onChange={e => setSearchFilter({ ...searchFilter, essenceOnly: e.target.checked })}
                                style={{ accentColor: "#f97316" }}
                            />
                            <span style={{ color: searchFilter.essenceOnly ? "#f97316" : "#666" }}>仅精华</span>
                        </label>
                    </div>
                </div>

                {/* 搜索结果 */}
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                    {searchQuery && results.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                            <div style={{ fontSize: 14 }}>未找到相关内容</div>
                        </div>
                    ) : (
                        results.map(post => (
                            <div
                                key={post.id}
                                onClick={() => {
                                    const updated = incrementViewCount(post.id) || post;
                                    setCurrentPost(updated);
                                    setView("postDetail");
                                }}
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 12,
                                    cursor: "pointer",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: "#1f2937", marginBottom: 8, lineHeight: 1.4 }}>
                                    {post.isPinned && <span style={{ color: "#f97316", marginRight: 6 }}>📌</span>}
                                    {post.isEssence && <span style={{ color: "#f59e0b", marginRight: 6 }}>⭐</span>}
                                    {post.title}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <span style={{ fontSize: 18 }}>{post.authorAvatar}</span>
                                    <span
                                      style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, cursor: onViewUserProfile ? "pointer" : "default" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewUserProfile?.(post.author);
                                      }}
                                    >{post.author}</span>
                                    <span style={{ fontSize: 12, color: "#d1d5db" }}>·</span>
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{getSection(post.section)?.name}</span>
                                </div>
                                <div style={{
                                    fontSize: 13,
                                    color: "#6b7280",
                                    lineHeight: 1.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical"
                                }}>{post.content}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    // ============ 主渲染 ============
    switch (view) {
        case "sections":
            return renderSections();
        case "posts":
            return renderPosts();
        case "postDetail":
            return renderPostDetail();
        case "newPost":
            return renderNewPost();
        case "search":
            return renderSearch();
        default:
            return renderSections();
    }
}
