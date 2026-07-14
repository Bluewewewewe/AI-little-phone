// ==================== 粉丝门禁系统 ====================
// 简化版 - 已在 AI小手机中，无需验证

// 页面加载时直接进入主页面
document.addEventListener('DOMContentLoaded', function() {
    console.log('[MiMi] 已在 AI小手机中，直接进入主页面');
    enterMainPage();
});

function enterMainPage() {
    const authPage = document.getElementById('authPage');
    const mainPage = document.getElementById('mainPage');
    
    if (authPage) authPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'block';
    
    // 触发页面初始化
    if (typeof window.initSchedule === 'function') {
        setTimeout(() => window.initSchedule(), 100);
    }
}
