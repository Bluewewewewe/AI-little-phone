'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { Heart, Sparkles, Users, Lock } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { hasCompletedSetup, identity } = useStore()
  const [showSetup, setShowSetup] = useState(!hasCompletedSetup)

  if (hasCompletedSetup && identity) {
    router.push('/phone')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo区域 */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI小手机
          </h1>
          <p className="text-secondary text-sm">CP女儿模拟器</p>
        </div>

        {/* 特色介绍 */}
        <div className="glass-card p-6 mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            特色玩法
          </h2>
          <ul className="space-y-3 text-sm text-secondary">
            <li className="flex items-start gap-3">
              <Users className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
              <span>跟爸爸、妈妈一起组建温暖的家</span>
            </li>
            <li className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>通过聊天提升亲密度，解锁更多故事</span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span>从地下秘密到官宣公开，体验完整叙事</span>
            </li>
          </ul>
        </div>

        {/* 开始按钮 */}
        <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowSetup(true)}
            className="btn btn-primary w-full py-4 text-lg"
          >
            开始设置我的家 👨‍👩‍👧
          </button>
        </div>

        {/* 设置弹窗 */}
        {showSetup && (
          <IdentitySetup onComplete={() => {
            setShowSetup(false)
            router.push('/phone')
          }} />
        )}
      </div>
    </div>
  )
}

// 身份设置组件
function IdentitySetup({ onComplete }: { onComplete: () => void }) {
  const { setIdentity, setHasCompletedSetup } = useStore()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    roleA_name: '爸爸',
    roleB_name: '妈妈',
    user_name: '宝贝',
    family_mode: '爸妈',
  })

  const roleAOptions = ['爸爸', '爹爹', '父亲', 'Daddy', '自定义']
  const roleBOptions = ['妈妈', '爸爸', '爹爹', 'Mommy', '自定义']
  const userNameOptions = ['宝贝', '女儿', '小公主', '小棉袄', '自定义']
  const familyModeOptions = ['爸妈', '爹爸', '双爸', '自定义']

  const [customRoleA, setCustomRoleA] = useState('')
  const [customRoleB, setCustomRoleB] = useState('')
  const [customUserName, setCustomUserName] = useState('')
  const [customFamilyMode, setCustomFamilyMode] = useState('')

  const handleComplete = () => {
    const finalData = {
      roleA_name: formData.roleA_name === '自定义' ? customRoleA : formData.roleA_name,
      roleB_name: formData.roleB_name === '自定义' ? customRoleB : formData.roleB_name,
      user_name: formData.user_name === '自定义' ? customUserName : formData.user_name,
      family_mode: formData.family_mode === '自定义' ? customFamilyMode : formData.family_mode,
    }
    setIdentity(finalData)
    setHasCompletedSetup(true)
    onComplete()
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center mb-4">
              你想怎么称呼<span className="text-purple-400">爸爸</span>？
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {roleAOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, roleA_name: option })
                    setStep(2)
                  }}
                  className={`p-4 rounded-xl text-lg font-medium transition-all ${
                    formData.roleA_name === option
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'glass hover:bg-glass-hover'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {formData.roleA_name === '自定义' && (
              <input
                type="text"
                value={customRoleA}
                onChange={(e) => setCustomRoleA(e.target.value)}
                placeholder="输入自定义称呼"
                className="input mt-3"
                autoFocus
              />
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center mb-4">
              你想怎么称呼<span className="text-pink-400">妈妈</span>？
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {roleBOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, roleB_name: option })
                    setStep(3)
                  }}
                  className={`p-4 rounded-xl text-lg font-medium transition-all ${
                    formData.roleB_name === option
                      ? 'bg-pink-500 text-white shadow-lg'
                      : 'glass hover:bg-glass-hover'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center mb-4">
              爸妈怎么<span className="text-cyan-400">称呼你</span>？
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {userNameOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, user_name: option })
                    setStep(4)
                  }}
                  className={`p-4 rounded-xl text-lg font-medium transition-all ${
                    formData.user_name === option
                      ? 'bg-cyan-500 text-white shadow-lg'
                      : 'glass hover:bg-glass-hover'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center mb-4">
              选择家庭<span className="text-amber-400">称谓模式</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {familyModeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, family_mode: option })
                    setStep(5)
                  }}
                  className={`p-4 rounded-xl text-lg font-medium transition-all ${
                    formData.family_mode === option
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'glass hover:bg-glass-hover'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center mb-2">
              确认你的家庭设定
            </h3>
            <div className="glass-card p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary">爸爸称呼：</span>
                <span className="font-medium text-purple-400">
                  {formData.roleA_name === '自定义' ? customRoleA : formData.roleA_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">妈妈称呼：</span>
                <span className="font-medium text-pink-400">
                  {formData.roleB_name === '自定义' ? customRoleB : formData.roleB_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">你的称呼：</span>
                <span className="font-medium text-cyan-400">
                  {formData.user_name === '自定义' ? customUserName : formData.user_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">家庭模式：</span>
                <span className="font-medium text-amber-400">
                  {formData.family_mode === '自定义' ? customFamilyMode : formData.family_mode}
                </span>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="btn btn-primary w-full py-4 text-lg mt-4"
            >
              <Heart className="w-5 h-5" />
              开始温馨之旅
            </button>
            <button
              onClick={() => setStep(1)}
              className="btn btn-secondary w-full"
            >
              重新设置
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card w-full max-w-md p-6 animate-slideUp">
        {/* 进度条 */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all ${
                i <= step ? 'bg-purple-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* 步骤内容 */}
        {renderStep()}

        {/* 返回按钮 */}
        {step > 1 && step < 5 && (
          <button
            onClick={() => setStep(step - 1)}
            className="text-secondary text-sm mt-4 hover:text-white transition-colors"
          >
            ← 返回上一步
          </button>
        )}
      </div>
    </div>
  )
}
