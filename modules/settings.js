// modules/settings.js
export function initSettings() {
  const sillyPhone = window.sillyPhone;
  if (!sillyPhone) return;

  sillyPhone.registerApp({
    id: 'settings',
    name: '设置',
    emoji: '⚙️',
    color: 'linear-gradient(135deg, #a4b9cc, #78909c)',
    onOpen: (phoneScreen) => {
      const appView = document.createElement('div');
      appView.className = 'app-view active';
      appView.style.cssText = 'position: absolute; inset: 0; background: rgba(255,255,255,.97); z-index: 100; display: flex; flex-direction: column; border-radius: 34px;';
      
      appView.innerHTML = `
        <div class="app-view-header" style="height: 50px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid #e0e0e0;">
          <button onclick="this.closest('.app-view').remove()" style="background: none; border: none; font-size: 16px; color: #007aff; cursor: pointer;">← 返回</button>
          <div class="app-view-title" style="flex: 1; text-align: center; font-weight: 600; font-size: 16px; color: #1a1a1a;">设置</div>
        </div>
        <div class="app-view-content" style="flex: 1; padding: 20px; overflow-y: auto;">
          <label style="font-size:14px; font-weight:600; margin-bottom:8px; display:block; color:#333;">手机背景颜色</label>
          <button onclick="window.sillyPhone.phoneScreen.style.background='#1a1a2e'" style="display:block; width:100%; padding:12px; border-radius:10px; background:#f0f2f5; border:1px solid #d0d5dd; cursor:pointer; margin-bottom:16px;">深海蓝</button>
          <button onclick="window.sillyPhone.phoneScreen.style.background='linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'" style="display:block; width:100%; padding:12px; border-radius:10px; background:#f0f2f5; border:1px solid #d0d5dd; cursor:pointer; margin-bottom:16px;">蜜桃粉</button>
        </div>
      `;
      phoneScreen.appendChild(appView);
    }
  });
}
initSettings();
