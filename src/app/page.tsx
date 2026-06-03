'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { Heart, Sparkles, Users, Lock } from 'lucide-react'
import PhoneLayout from '@/components/PhoneLayout'

export default function HomePage() {
  const router = useRouter()
  const { hasCompletedSetup, identity } = useStore()
  const [showSetup, setShowSetup] = useState(!hasCompletedSetup)

  if (hasCompletedSetup && identity) {
    router.push('/phone')
    return null
  }

  return (
    <PhoneLayout>
      <div className="flex flex-col h-full px-6 py-4 overflow-y-auto">
        <div className="text-center mb-6 mt-4 animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI小手机
          </h1>
          <p className="text-white/40 text-xs">CP女儿模拟器</p>
        </div>

        <div className="glass-card p-5 mb-5 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-base font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            特色玩法
          </h2>
          <ul className="space-y-2 text-xs text-white/50">
            <li className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-pink-400 mt-0.5 flex-shrink-0" />
              <span>跟爸爸、妈妈一起组建温暖的家</span>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>通过聊天提升亲密度，解锁更多故事</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <span>从地下秘密到官宣公开，体验完整叙事</span>
            </li>
          </ul>
        </div>

        <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowSetup(true)}
            className="w-full py-3 text-base rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium active:scale-[0.97] transition-transform"
          >
            开始设置我的家 👨‍👩‍👧
          </button>
        </div>

        {showSetup && (
          <IdentitySetup onComplete={() => {
            setShowSetup(false)
            router.push('/phone')
          }} />
        )}
      </div>
    </PhoneLayout>
  )
}

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
          <div className="space-y-3">
            <h3 className="text-base font-medium text-center mb-3">
              你想怎么称呼<span className="text-purple-400">爸爸</span>？
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {roleAOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, roleA_name: option })
                    setStep(2)
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
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
                className="input mt-2"
                autoFocus
              />
            )}
          </div>
        )
      case 2:
        return (
          <div className="space-y-3">
            <h3 className="text-base font-medium text-center mb-3">
              你想怎么称呼<span className="text-pink-400">妈妈</span>？
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {roleBOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, roleB_name: option })
                    setStep(3)
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
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
          <div className="space-y-3">
            <h3 className="text-base font-medium text-center mb-3">
              爸妈怎么<span className="text-cyan-400">称呼你</span>？
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {userNameOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, user_name: option })
                    setStep(4)
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
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
          <div className="space-y-3">
            <h3 className="text-base font-medium text-center mb-3">
              选择家庭<span className="text-amber-400">称谓模式</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {familyModeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, family_mode: option })
                    setStep(5)
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
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
          <div className="space-y-3">
            <h3 className="text-base font-medium text-center mb-2">确认你的家庭设定</h3>
            <div className="glass-card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">爸爸称呼：</span>
                <span className="font-medium text-purple-400">{formData.roleA_name === '自定义' ? customRoleA : formData.roleA_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">妈妈称呼：</span>
                <span className="font-medium text-pink-400">{formData.roleB_name === '自定义' ? customRoleB : formData.roleB_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">你的称呼：</span>
                <span className="font-medium text-cyan-400">{formData.user_name === '自定义' ? customUserName : formData.user_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">家庭模式：</span>
                <span className="font-medium text-amber-400">{formData.family_mode === '自定义' ? customFamilyMode : formData.family_mode}</span>
              </div>
            </div>
            <button onClick={handleComplete} className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium active:scale-[0.97] transition-transform mt-2">
              ❤️ 开始温馨之旅
            </button>
            <button onClick={() => setStep(1)} className="w-full py-2 text-sm text-white/40">重新设置</button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card w-full max-w-sm p-5 animate-slideUp">
        <div className="flex gap-1.5 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-purple-500' : 'bg-white/20'}`} />
          ))}
        </div>
        {renderStep()}
        {step > 1 && step < 5 && (
          <button onClick={() => setStep(step - 1)} className="text-white/30 text-xs mt-3 hover:text-white/60 transition-colors">← 返回上一步</button>
        )}
      </div>
    </div>
  )
}
