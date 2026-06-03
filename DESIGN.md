# DESIGN.md

## 气质与意象
深夜星空下的手机屏幕——暗色基底、微光粒子、毛玻璃质感。像在寂静房间里独自滑动手机，屏幕光线在指尖流转。

## 视觉策略
- **Liquid Glass 设计系统**：全局毛玻璃效果（backdrop-blur + 半透明背景），顶部高光线模拟光线折射
- **iOS 真机还原**：桌面端手机框模拟 iPhone 15 Pro 外观，Dynamic Island + 状态栏 + Home Indicator
- **深色主题**为主，支持浅色切换
- 图标使用 Emoji 原生风格

## 配色方案
- **主背景**: 深紫黑渐变 `#0c0015 → #0a0a2e → #0f0c29`
- **爸爸色**: 紫罗兰 `#8b5cf6`
- **妈妈色**: 玫瑰粉 `#ec4899`
- **用户色**: 青蓝 `#06b6d4`
- **玻璃卡片**: `rgba(255,255,255,0.06)` + `backdrop-blur(28px)`

## 页面结构
- **桌面端**: 居中手机框 (390x844, min(844px, 96dvh)), 圆角55px, Dynamic Island, Home Indicator
- **移动端**: 全屏体验，隐藏手机框/Dynamic Island/Home Indicator
- **状态栏**: iOS 风格，桌面端在 Dynamic Island 下方留出 44px padding，移动端 14px
- **首页**: APP 图标 4列网格 + 爸妈状态小组件 + 底部 Dock
- **Dock**: 4 个常驻 APP，毛玻璃背景

## 动效与交互
- APP 打开: 从底部滑入 + 缩放 `appOpen` (0.35s, elastic)
- APP 关闭: 向下滑出 + 缩小 `appClose` (0.25s)
- 按钮: `active:scale-90` 按压反馈
- 时间渲染: useState + useEffect 驱动，避免 Hydration 错误

## 设计禁忌
- 禁止使用纯白背景卡片
- 禁止在渲染中直接使用 new Date()（必须 useEffect 驱动）
- 禁止去除毛玻璃效果
