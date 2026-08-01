'use client';
import { useState, useCallback, useEffect } from 'react';

// ============ 类型定义 ============
type UserStatus = 'pending' | 'reviewing' | 'verified' | 'rejected' | 'banned';

interface MockUser {
  userId: string;
  nickname: string;
  password: string;
  referrerId: string;
  status: UserStatus;
  weiboNickname?: string;
  weiboLevel?: number;
  creditScore: number;
  inviteQuota: number;
  registeredAt: string;
  banReason?: string;
  banLevel?: number;
}

interface WeiboBlacklist {
  weiboNickname: string;
  weiboUid?: string;
  reason: string;
  source: 'auto' | 'manual';
  addedAt: string;
}

// ============ Mock 数据 ============
const VALID_INVITE_CODES = ['CORN2026', 'SWEET001', 'TESTCODE', 'ADMIN001'];

const MOCK_USERS: MockUser[] = [
  {
    userId: 'u_001',
    nickname: '小甜玉米',
    password: '123456',
    referrerId: 'admin',
    status: 'verified',
    weiboNickname: '甜玉米本 Corn',
    weiboLevel: 8,
    creditScore: 100,
    inviteQuota: 10,
    registeredAt: '2026-06-15',
  },
  {
    userId: 'u_002',
    nickname: 'CP 粉头',
    password: '123456',
    referrerId: 'u_001',
    status: 'reviewing',
    weiboNickname: 'CP 粉头子',
    weiboLevel: 6,
    creditScore: 100,
    inviteQuota: 5,
    registeredAt: '2026-07-20',
  },
  {
    userId: 'u_003',
    nickname: '同人作者',
    password: '123456',
    referrerId: 'u_001',
    status: 'verified',
    weiboNickname: '同人大大',
    weiboLevel: 9,
    creditScore: 95,
    inviteQuota: 8,
    registeredAt: '2026-06-20',
  },
  {
    userId: 'u_004',
    nickname: '违规用户',
    password: '123456',
    referrerId: 'u_002',
    status: 'banned',
    weiboNickname: '违规小号',
    weiboLevel: 3,
    creditScore: 0,
    inviteQuota: 0,
    registeredAt: '2026-07-01',
    banReason: '发布违规内容',
    banLevel: 5,
  },
  {
    userId: 'u_005',
    nickname: '新用户 A',
    password: '123456',
    referrerId: 'u_003',
    status: 'pending',
    creditScore: 100,
    inviteQuota: 5,
    registeredAt: '2026-08-01',
  },
  {
    userId: 'u_006',
    nickname: '新用户 B',
    password: '123456',
    referrerId: 'u_003',
    status: 'reviewing',
    weiboNickname: '微博用户 B',
    weiboLevel: 5,
    creditScore: 100,
    inviteQuota: 5,
    registeredAt: '2026-08-01',
  },
  {
    userId: 'admin',
    nickname: '超级管理员',
    password: 'admin123',
    referrerId: 'system',
    status: 'verified',
    weiboNickname: '官方账号',
    weiboLevel: 10,
    creditScore: 100,
    inviteQuota: 999,
    registeredAt: '2026-01-01',
  },
];

const MOCK_BLACKLIST: WeiboBlacklist[] = [
  {
    weiboNickname: '黑粉一号',
    weiboUid: '1234567890',
    reason: '恶意举报',
    source: 'manual',
    addedAt: '2026-07-15',
  },
  {
    weiboNickname: '违规账号',
    reason: '发布违规内容',
    source: 'auto',
    addedAt: '2026-07-20',
  },
];

// ============ 注册/登录系统组件 ============
interface AuthSystemProps {
  onLoginSuccess: (user: MockUser) => void;
}

export function AuthSystem({ onLoginSuccess }: AuthSystemProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [authStage, setAuthStage] = useState<'auth' | 'weibo' | 'waiting' | 'banned'>('auth');

  // 登录表单
  const [loginNickname, setLoginNickname] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 注册表单
  const [regInviteCode, setRegInviteCode] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // 微博验证表单
  const [weiboNickname, setWeiboNickname] = useState('');
  const [weiboLevel, setWeiboLevel] = useState(5);

  const handleLogin = useCallback(() => {
    const user = MOCK_USERS.find(
      (u) => u.nickname === loginNickname && u.password === loginPassword
    );
    if (!user) {
      alert('昵称或密码错误');
      return;
    }
    if (user.status === 'banned') {
      setCurrentUser(user);
      setAuthStage('banned');
      return;
    }
    if (user.status === 'pending') {
      setCurrentUser(user);
      setAuthStage('weibo');
      return;
    }
    if (user.status === 'reviewing') {
      setCurrentUser(user);
      setAuthStage('waiting');
      return;
    }
    if (user.status === 'verified') {
      onLoginSuccess(user);
    }
  }, [loginNickname, loginPassword, onLoginSuccess]);

  const handleRegister = useCallback(() => {
    if (!VALID_INVITE_CODES.includes(regInviteCode)) {
      alert('邀请码无效');
      return;
    }
    if (MOCK_USERS.some((u) => u.nickname === regNickname)) {
      alert('昵称已存在');
      return;
    }
    if (regNickname === regPassword) {
      alert('密码不能与昵称相同');
      return;
    }
    const newUser: MockUser = {
      userId: `u_${String(MOCK_USERS.length + 1).padStart(3, '0')}`,
      nickname: regNickname,
      password: regPassword,
      referrerId: 'u_001',
      status: 'pending',
      creditScore: 100,
      inviteQuota: 5,
      registeredAt: new Date().toISOString().split('T')[0],
    };
    setCurrentUser(newUser);
    setAuthStage('weibo');
  }, [regInviteCode, regNickname, regPassword]);

  const handleWeiboSubmit = useCallback(() => {
    if (!weiboNickname) {
      alert('请填写微博昵称');
      return;
    }
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        weiboNickname: weiboNickname,
        weiboLevel: weiboLevel,
        status: 'reviewing' as UserStatus,
      };
      setCurrentUser(updatedUser);
    }
    setAuthStage('waiting');
  }, [weiboNickname, weiboLevel, currentUser]);

  // 登录/注册页
  if (authStage === 'auth') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🌽</div>
              <h1 className="text-3xl font-bold text-green-800">AI 小手机</h1>
              <p className="text-green-600 mt-2">甜玉米专属模拟器</p>
            </div>

            {/* 切换标签 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                注册
              </button>
            </div>

            {mode === 'login' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="昵称"
                  value={loginNickname}
                  onChange={(e) => setLoginNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
                />
                <input
                  type="password"
                  placeholder="密码"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg"
                >
                  登录
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="邀请码（必填）"
                  value={regInviteCode}
                  onChange={(e) => setRegInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
                />
                <input
                  type="text"
                  placeholder="昵称"
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
                />
                <input
                  type="password"
                  placeholder="密码"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={handleRegister}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg"
                >
                  注册
                </button>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-green-600">
              <p>测试账号：小甜玉米 / 123456</p>
              <p>管理员：超级管理员 / admin123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 微博验证页
  if (authStage === 'weibo') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4"></div>
              <h2 className="text-2xl font-bold text-green-800">超话验证</h2>
              <p className="text-green-600 mt-2">填写微博信息完成验证</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  微博昵称
                </label>
                <input
                  type="text"
                  placeholder="请输入微博昵称"
                  value={weiboNickname}
                  onChange={(e) => setWeiboNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-green-50 border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  超话等级
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      onClick={() => setWeiboLevel(level)}
                      className={`w-12 h-12 rounded-xl font-medium transition-all ${
                        weiboLevel === level
                          ? 'bg-green-600 text-white shadow-lg scale-110'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                   请截图你的超话等级页面，提交后管理员会审核
                </p>
              </div>

              <button
                onClick={handleWeiboSubmit}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg"
              >
                提交验证
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 等待审核页
  if (authStage === 'waiting') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">正在审核中</h2>
            <p className="text-green-600 mb-8">
              你的超话信息已提交，管理员正在审核中。
              <br />
              审核通过后即可使用所有功能。
            </p>
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-700">
                预计审核时间：24 小时内
                <br />
                如有疑问请联系管理员
              </p>
            </div>
            <button
              onClick={() => setAuthStage('auth')}
              className="px-6 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 被封禁页
  if (authStage === 'banned' && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-6">🚫</div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">账号已被封禁</h2>
            <p className="text-red-600 mb-4">
              {currentUser.banReason || '违反社区规则'}
            </p>
            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">
                封禁等级：{currentUser.banLevel || '未知'}
                <br />
                如有异议可申诉
              </p>
            </div>
            <button className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg mb-3">
              申诉
            </button>
            <button
              onClick={() => setAuthStage('auth')}
              className="w-full py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
