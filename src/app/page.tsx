'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
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
      <div className="flex flex-col h-full px-7 py-6 overflow-y-auto">
        <div className="text-center mb-8 mt-6 animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center"
               style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.6)' }}>
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-amber-900">
            AI小手机
          </h1>
          <p className="text-amber-900/40 text-xs">CP女儿模拟器</p>
        </div>

        <div className="glass-card p-5 mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-base font-medium mb-3 flex items-center gap-2 text-amber-900">
            ✨ 特色玩法
          </h2>
          <ul className="space-y-3 text-xs text-amber-900/50">
            <li className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">👩‍👩‍👧</span>
              <span>跟爸爸、妈妈一起组建温暖的家</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">💕</span>
              <span>通过聊天提升亲密度，解锁更多故事</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">🔒</span>
              <span>从地下秘密到官宣公开，体验完整叙事</span>
            </li>
          </ul>
        </div>

        <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowSetup(true)}
            className="w-full py-3.5 text-base rounded-2xl font-medium active:scale-[0.97] transition-transform text-amber-900"
            style={{
              background: 'rgba(251, 191, 36, 0.18)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.5)'
            }}
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
  const roleBOptions = ['妈妈', '妈咪', '母亲', 'Mommy', '自定义']
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

  const optionButtonStyle = (isSelected: boolean, color: string): React.CSSProperties => {
    const colorMap: Record<string, string> = {
      purple: 'rgba(168, 85, 247, 0.18)',
      pink: 'rgba(236, 72, 153, 0.18)',
      cyan: 'rgba(6, 182, 212, 0.18)',
      amber: 'rgba(245, 158, 11, 0.18)',
    }
    return {
      background: isSelected ? (colorMap[color] || colorMap.purple) : 'rgba(255,255,255,0.20)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.5)',
      borderRadius: '16px',
      padding: '14px',
      fontSize: '14px',
      fontWeight: 500,
      color: '#78350f',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-base font-medium text-center mb-4 text-amber-900">
              你想怎么称呼<span className="text-amber-500">爸爸</span>？
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {roleAOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, roleA_name: option })
                    setStep(2)
                  }}
                  style={optionButtonStyle(formData.roleA_name === option, 'purple')}
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
            <h3 className="text-base font-medium text-center mb-4 text-amber-900">
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
                  style={optionButtonStyle(formData.roleB_name === option, 'pink')}
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
            <h3 className="text-base font-medium text-center mb-4 text-amber-900">
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
                  style={optionButtonStyle(formData.user_name === option, 'cyan')}
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
            <h3 className="text-base font-medium text-center mb-4 text-amber-900">
              选择家庭<span className="text-amber-500">称谓模式</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {familyModeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, family_mode: option })
                    setStep(5)
                  }}
                  style={optionButtonStyle(formData.family_mode === option, 'amber')}
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
            <h3 className="text-base font-medium text-center mb-3 text-amber-900">确认你的家庭设定</h3>
            <div className="glass-card p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-amber-900/45">爸爸称呼：</span>
                <span className="font-medium text-amber-800">{formData.roleA_name === '自定义' ? customRoleA : formData.roleA_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-900/45">妈妈称呼：</span>
                <span className="font-medium text-pink-500">{formData.roleB_name === '自定义' ? customRoleB : formData.roleB_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-900/45">你的称呼：</span>
                <span className="font-medium text-cyan-500">{formData.user_name === '自定义' ? customUserName : formData.user_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-900/45">家庭模式：</span>
                <span className="font-medium text-amber-600">{formData.family_mode === '自定义' ? customFamilyMode : formData.family_mode}</span>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-3.5 rounded-2xl font-medium active:scale-[0.97] transition-transform text-amber-900"
              style={{
                background: 'rgba(251, 191, 36, 0.18)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.5)'
              }}
            >
              ❤️ 开始温馨之旅
            </button>
            <button onClick={() => setStep(1)} className="w-full py-2 text-sm text-amber-900/35">重新设置</button>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 bg-amber-900/10 backdrop-blur-sm flex items-center justify-center p-5 z-50">
      <div className="glass-card w-full max-w-sm p-6 animate-slideUp">
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background: i <= step ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255,255,255,0.25)'
              }}
            />
          ))}
        </div>
        {renderStep()}
        {step > 1 && step < 5 && (
          <button onClick={() => setStep(step - 1)} className="text-amber-900/35 text-xs mt-4 hover:text-amber-900/60 transition-colors">← 返回上一步</button>
        )}
      </div>
    </div>
  )
}
