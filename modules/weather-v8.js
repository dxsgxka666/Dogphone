// modules/weather-v8.js
export function initWeather() {
  const sillyPhone = window.sillyPhone;
  if (!sillyPhone) return;

  sillyPhone.registerApp({
    id: 'weather',
    name: '天气',
    emoji: '☀️',
    color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    onOpen: (phoneScreen) => {
      const appView = document.createElement('div');
      appView.className = 'app-view active';
      appView.style.cssText = 'position: absolute; inset: 0; background: #f0f5fa; z-index: 100; display: flex; flex-direction: column; border-radius: 34px; overflow: hidden; font-family: sans-serif;';
      
      appView.innerHTML = `
        <div style="height: 50px; display: flex; align-items: center; padding: 0 16px; background: #fff; border-bottom: 1px solid #e0e0e0; border-radius: 34px 34px 0 0;">
          <button id="btn-back-v8" style="border:none; background:none; font-size:16px; color:#007aff; cursor:pointer;">← 返回</button>
          <div style="flex:1; text-align:center; font-weight:bold; color:#333;">天气</div>
          <div style="width:60px;"></div>
        </div>
        <div style="flex: 1; padding: 20px; overflow-y: auto;">
          <div style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); border-radius: 20px; padding: 20px; color: #fff; text-align: center;">
            <h2 style="margin:0; font-size: 24px;">测试成功！</h2>
            <p style="font-size: 14px; margin-top: 10px;">天气模块已经成功加载。</p>
            <p style="font-size: 12px; opacity: 0.8;">接下来我们慢慢完善内容</p>
          </div>
        </div>
      `;
      phoneScreen.appendChild(appView);
      appView.querySelector('#btn-back-v8').addEventListener('click', () => appView.remove());
    }
  });
}
initWeather();
