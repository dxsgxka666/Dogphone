// modules/weather.js
export function initWeather() {
  const sillyPhone = window.sillyPhone;
  if (!sillyPhone) {
    console.error('主加载器未找到！请确认小狗手机主脚本已运行。');
    return;
  }

  sillyPhone.registerApp({
    id: 'weather',
    name: '天气',
    emoji: '☀️',
    color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    onOpen: (phoneScreen) => {
      // 创建应用内页
      const appView = document.createElement('div');
      appView.className = 'app-view active';
      // 为了防止样式冲突，这里使用内联样式或者你定义的 Shadow DOM 样式
      appView.style.cssText = 'position: absolute; inset: 0; background: rgba(255,255,255,.97); z-index: 100; display: flex; flex-direction: column; border-radius: 34px;';
      
      appView.innerHTML = `
        <div class="app-view-header" style="height: 50px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid #e0e0e0;">
          <button onclick="this.closest('.app-view').remove()" style="background: none; border: none; font-size: 16px; color: #007aff; cursor: pointer;">← 返回</button>
          <div class="app-view-title" style="flex: 1; text-align: center; font-weight: 600; font-size: 16px; color: #1a1a1a;">天气</div>
        </div>
        <div class="app-view-content" style="flex: 1; padding: 20px; overflow-y: auto; text-align: center;">
          <div style="font-size:64px; margin-top: 20px;">☀️</div>
          <div style="font-size:48px; font-weight:300; margin:10px 0; color: #1a1a1a;">24°</div>
          <div style="font-size:18px; color:#666;">晴朗</div>
          <div style="margin-top:30px; display:grid; grid-template-columns:repeat(3,1fr); gap:16px; color: #1a1a1a;">
            <div style="text-align:center;"><div style="font-size:24px;">💧</div><div style="font-size:12px; color:#666;">湿度</div><div style="font-weight:600;">45%</div></div>
            <div style="text-align:center;"><div style="font-size:24px;">💨</div><div style="font-size:12px; color:#666;">风速</div><div style="font-weight:600;">3.2m/s</div></div>
            <div style="text-align:center;"><div style="font-size:24px;">🌡️</div><div style="font-size:12px; color:#666;">体感</div><div style="font-weight:600;">26°</div></div>
          </div>
        </div>
      `;
      phoneScreen.appendChild(appView);
    }
  });
}
initWeather();
